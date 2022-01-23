const express = require('express');
const path = require('path');
const http = require("http")
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 5000;
const io = require("socket.io")(server)


var queue = [];    // list of sockets waiting for peers
var rooms = {};    // map socket.id => room
var names = {};    // map socket.id => name
var allUsers = {}; // map socket.id => socket

var findPeerForLoneSocket = (socket_data) => {
	
	console.log('finding random peer')
	if (queue.length > 0) {
		console.log('Matching with existing user');
		var socket = socket_data[0];
		var data = socket_data[1];
		var waiting_user = queue.pop();
		var waiting_user_socket = waiting_user[0];
		var waiting_user_data = waiting_user[1];
        var room = socket.id + '#' + waiting_user_socket.id;
		waiting_user_socket.join(room);
        socket.join(room);
		// register rooms to their names
		rooms[waiting_user_socket.id] = room;
		rooms[socket.id] = room;
        // exchange names between the two of them and start the chat
        // waiting_user_socket.emit('randomChat', { 'room':room, signal: data.signalData, from: data.from, gender: data.gender, age: data.age, location: data.location});
        // socket.emit('randomChat', { 'room':room, signal: waiting_user_data.signalData, from: waiting_user_data.from, gender: waiting_user_data.gender, age: waiting_user_data.age, location: waiting_user_data.location});
		socket.to(waiting_user_socket.id).emit("callUser", { signal: data.signalData, from: data.from, name: data.name, gender: data.gender, age: data.age, location: data.location })
		console.log(socket.id + " is calling", waiting_user_socket.id, "and emitting callUser")


	}
	else {
	queue.push(socket_data)
	console.log('The queue is now size', queue.length)
	// console.log('The queue has')
	// for (let i = 0; i < queue.length; i++) {
	// 	console.log(queue[i].id)
	//   } 
	}

}



io.on("connection", (socket) => {
	socket.emit("me", socket.id)
	console.log("User connected " + socket.id + " - emitting Me")
	


	socket.on("endCall", () => {
		console.log( socket.id + " pressed next")
		socket.disconnect();
	})


	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
		console.log("User disconnected - " + socket.id + " emitting callEnded")

	})
	

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name, gender: data.gender, age: data.age, location: data.location })
		console.log(socket.id + " is calling", data.userToCall, "and emitting callUser")
	})

	socket.on("callRandomUser", (data) => {
		let socket_data = [];
		socket_data.push(socket);
		socket_data.push(data);
		findPeerForLoneSocket(socket_data);
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