import React, { Component } from 'react';
import './App.css';
const port = process.env.PORT || 5000;
console.log(port)
var host = location.origin;
console.log(host)

class App extends Component {
  // Initialize state
  state = { banana: true }

  // Fetch passwords after first mount
  componentDidMount() {

  }



  render() {
    const io = require("socket.io-client");     
    const socket = io.connect(host, {port: port, transports: ["websocket"]});
    console.log(socket)

    return (
      <div >
      <h1>Hi Yuyan!</h1>
      <h2>Want to get <b>Popeyes!!?</b></h2>
      <button onClick={()=> alert('Yay! I just received the notification, and will be outside in 5 minutes!')} type="button">Yes! Let's Go!</button> 
      <button onClick={()=> alert('I know.')} type="button">I'm a butt :(</button> 
      </div>
    );
  }
}

export default App;