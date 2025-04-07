const net = require("net");
const fs = require('fs')
const PORT = 4221;

const rFile = fs.readFileSync('/tmp/foo', 'utf8', (err, data) => {
	if (err) return console.error(err)
	return data;
})
console.log("rFile: ", rFile)
const fSizeBytes = fs.statSync('/tmp/foo')?.size
console.log("fSizeBytes: ", fSizeBytes)

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

		const echoMatch = /^\/echo\/[^/]+$/.test(url) ? '/__ECHO__' : url;

		switch (echoMatch) {
			case "/":
				const httpResponse200 = "HTTP/1.1 200 OK\r\n\r\n";
				socket.write(httpResponse200);
				socket.end();
				break;
			case "/__ECHO__":
				const formatedUrl = url.slice('/echo/'.length);
				const urlLength = formatedUrl.length;
				const httpEchoResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${urlLength}\r\n\r\n${formatedUrl}`
				socket.write(httpEchoResponse);
				socket.end();
				break;
			case '/user-agent':
				const httpAgentResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${agentVal.length}\r\n\r\n${agentVal}`
				socket.write(httpAgentResponse);
				socket.end();
				break;
			case '/files/foo':
				const httpFileResponse = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fSizeBytes}\r\n\r\n${rFile}`
				socket.write(httpFileResponse);
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

