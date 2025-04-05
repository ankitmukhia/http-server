const net = require("net");
const PORT = 4221;

const server = net.createServer((socket) => {
	const httpResponse = "HTTP/1.1 200 OK \r\n\r\n"
	console.log("http res: ", httpResponse)

	socket.write(httpResponse);
	socket.end();

	socket.on("end", () => {
		console.log(`Client disconnected`)
	})
})

server.listen(PORT, () => {
	console.log(`TCP is listening at port ${PORT}`)
})

