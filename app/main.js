const net = require("net");
const PORT = 4221;

const server = net.createServer((socket) => {
	socket.on("data", (data) => {
		const res = data.toString()
		console.log("Result: ", res)
	})

	socket.write('Hello fr');
	socket.end();

	socket.on("end", () => {
		console.log(`Client disconnected`)
	})

	socket.on("error", (error) => {
		console.log("Socket Errror " + error)
	})
})

server.listen(PORT, () => {
	console.log(`TCP is listening at port ${PORT}`)
})

