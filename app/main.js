const net = require("net");
const PORT = 4221;

const server = net.createServer((socket) => {
	socket.on('data', (data) => {
		const res = data.toString();
		const url = res.split(' ')[1]

		switch (url) {
			case "/":
				const httpResponse200 = "HTTP/1.1 200 OK\r\n\r\n";
				socket.write(httpResponse200);
				socket.end();
				break;
			default:
				const httpResponse404 = "HTTP/1.1 404 Not Found\r\n\r\n";
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

