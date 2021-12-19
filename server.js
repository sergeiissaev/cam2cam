const express = require('express');
const path = require('path');
const http = require("http")
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 5000;
const io = require("socket.io")(server)






io.on("connection", (socket) => {
	socket.emit("me", socket.id)
	console.log("User connected " + socket.id + " - emitting Me")

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
		console.log("User disconnected - " + socket.id + " emitting callEnded")
	})
	

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
		console.log(socket.id + " is calling", data.userToCall, "and emitting callUser")
	})
	

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
		console.log("server answerCall, sending signal to", data.to, "as callAccepted")
	})
	
})



// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));



// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});



server.listen(port, function(){
  console.log(`Cam2Cam backend listening on ${port}`);
});