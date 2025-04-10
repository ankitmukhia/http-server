const net = require("net")
const fs = require("fs")
const zlib = require('zlib')
const { promisify } = require('util')
const PORT = 4221;

// make zlib.gzip return promise
const gzip = promisify(zlib.deflateSync)

// Get directory from the command line
const dirFlagIndex = process.argv.indexOf('--directory')
const dirPath = process.argv[dirFlagIndex + 1]

if (!fs.existsSync(dirPath)) {
	fs.mkdirSync(dirPath, { recursive: true });
}

async function gzipCompressor(input) {
	const buff = await gzip(input)
	return buff;
}

// need to write file, user will send 'Hello, World' with path. ou have to send back the file
const server = net.createServer((socket) => {
	socket.on('data', async (data) => {
		const res = data.toString();
		console.log("res: ", res)
		// parse it in a way such that i can extract secific header
		const [headers, body] = res.split('\r\n\r\n')
		const lines = headers.split('\r\n')
		const reqType = lines[0].includes('POST')
		let agentVal = "";
		let encodingType = false;

		// extract headers
		for (const line of lines.slice(1)) {
			const [key, value] = line.split(': ')
			if (key && value) {
				if (key.toLowerCase().includes('user-agent')) {
					agentVal = value;
				}

				if (key.toLowerCase().includes('accept-encoding') && value.toLowerCase().includes('gzip')) {
					encodingType = true
				}
			}
		}

		const url = res.split(' ')[1]
		const rMatch = /^\/(files|echo)(\/[^/]+)?$/.test(url) ? '/__ECHO__' : url;

		switch (rMatch) {
			case "/":
				const httpResponse200 = "HTTP/1.1 200 OK\r\n\r\n";
				socket.write(httpResponse200);
				socket.end();
				break;
			case "/__ECHO__":
				if (url.startsWith('/echo/')) {
					const formatedUrl = url.slice('/echo/'.length);
					// const compressedVal = await gzipCompressor(formatedUrl)
					const compressedVal = zlib.gzipSync(formatedUrl)
					console.log("compressed: ", compressedVal)
					const urlLength = formatedUrl.length;
					const compressedLength = compressedVal.length
					const httpEchoResponse = `HTTP/1.1 200 OK\r\n${encodingType ? "Content-Encoding: gzip\r\n" : ""}Content-Type: text/plain\r\nContent-Length: ${encodingType ? compressedLength : urlLength}\r\n\r\n${encodingType ? "" : formatedUrl}`
					socket.write(httpEchoResponse);
					if(encodingType){
						socket.write(compressedVal)
					}
					socket.end();
					break;
				} else if (reqType) {
					const formatedFilePath = url.slice('/files/'.length);
					try {
						if (!fs.existsSync(`${dirPath}${formatedFilePath}`) && !!body) {
							fs.writeFileSync(`${dirPath}${formatedFilePath}`, body)
							const httpPostResponse = "HTTP/1.1 201 Created\r\n\r\n";
							socket.write(httpPostResponse)
							socket.end()
							break;
						}
					} catch (err) {
						console.error(err)
					}
				} else {
					const formatedFilePath = url.slice('/files/'.length);
					if (!fs.existsSync(`${dirPath}${formatedFilePath}`)) {
						defaultResponse(socket)
						break;
					}
					const rFile = fs.readFileSync(`${dirPath}${formatedFilePath}`, 'utf8')
					const fSizeBytes = fs.statSync(`${dirPath}${formatedFilePath}`).size
					const httpFileResponse = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fSizeBytes}\r\n\r\n${rFile}`;
					socket.write(httpFileResponse);
					socket.end();
					break;
				}
			case '/user-agent':
				const httpAgentResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${agentVal.length}\r\n\r\n${agentVal}`
				socket.write(httpAgentResponse);
				socket.end();
				break;
			default:
				defaultResponse(socket)
		}
	})

	socket.on("end", () => {
		socket.end();
	})

	socket.on('error', (error) => {
		console.log("error: ", error)
		socket.end()
	})
})

server.listen(PORT, () => {
	console.log(`TCP is listening at port ${PORT}`)
})


const defaultResponse = (socket) => {
	const httpResponse404 = "HTTP/1.1 404 Not Found\r\n\r\n"
	socket.write(httpResponse404);
	socket.end();
} 
