const express = require('express');
const path = require('path');
const http = require("http")
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 5000;
const io = require("socket.io")(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: [ "GET", "POST" ]
	}
})


io.on("connection", (socket) => {
	socket.emit("me", socket.id)
	console.log(socket.id)

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
		console.log("emitting callEnded")
	})
	

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
		console.log("calling", data.userToCall, "and emitting callUser")
	})
	

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
		console.log("sending signal", data.signal, "to", data.to)
	})
	
})


// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));



// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});


app.listen(port, () => {
  console.log(`Cam2Cam backend listening on ${port}`);
});


