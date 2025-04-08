const net = require("net")
const fs = require("fs")
const PORT = 4221;

// Get directory from the command line
const dirFlagIndex = process.argv.indexOf('--directory')
const dirPath = process.argv[dirFlagIndex + 1]

fs.mkdirSync(dirPath, { recursive: true })

// need to write file, user will send 'Hello, World' with path. ou have to send back the file
const server = net.createServer((socket) => {
	socket.on('data', (data) => {
		const res = data.toString();

		// parse it in a way such that i can extract secific header
		const [headers, body] = res.split('\r\n\r\n')
		const lines = headers.split('\r\n')
		let agentVal = "";

		// extract headers
		for (const line of lines.slice(1)) {
			const [key, value] = line.split(': ')
			if (key && value) {
				if (key.toLowerCase().includes('user-agent')) {
					agentVal = value
				}
			}
		}

		// write file

		const url = res.split(' ')[1]

		// const echoMatch = /^\/echo\/[^/]+$/.test(url) ? '/__ECHO__' : url;
		const rMatch = /^\/(files|echo)(\/[^/]+)?$/.test(url) ? '/__ECHO__' : url;

		switch (rMatch) {
			case "/":
				const httpResponse200 = "HTTP/1.1 200 OK\r\n\r\n";
				socket.write(httpResponse200);
				socket.end();
				break;
			case "/__ECHO__":
				if (url === "/echo/") {
					const formatedUrl = url.slice('/echo/'.length);
					const urlLength = formatedUrl.length;
					const httpEchoResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${urlLength}\r\n\r\n${formatedUrl}`
					socket.write(httpEchoResponse);
					socket.end();
					break;
				} else {
					const formatedFilePath = url.slice('/files/'.length);
					const rFile = fs.readFileSync(`${dirPath}${formatedFilePath}`, 'utf8')
					const fSizeBytes = fs.statSync(`${dirPath}/${formatedFilePath}`).size
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
				const httpResponse404 = "HTTP/1.1 404 Not Found\r\n\r\n"
				socket.write(httpResponse404);
				socket.end();
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

