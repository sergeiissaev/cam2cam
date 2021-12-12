import React, { createRef,  Component } from 'react';
import './App.css';
const port = process.env.PORT || 5000;
console.log(port)
var host = location.origin;
console.log(host)

class App extends Component {
  constructor(props) {
    super(props);
  // Initialize state
  this.state = { me: "placeholder",
  receivingCall: false,
  caller: "",
  name: "",
  callerSignal: "",
  stream: "",
 }
 this.myVideo = createRef()
 this.myVideo.current = [];
  }



  // Fetch passwords after first mount
  componentDidMount() {
    const io = require("socket.io-client");     
    const socket = io.connect(host, {port: port, transports: ["websocket"]});


    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      this.setState({stream: stream})
        this.myVideo.current.srcObject = stream
        console.log('Requesting media ... stream set to ', stream)
    })


    socket.on("me", (id) => {
      this.setState({me: id})
      console.log('setting variable me to')
      console.log(this.state.me)
    })


    socket.on("callUser", (data) => {
      this.setState({receivingCall: true, caller: data.from, name: data.name, callerSignal: data.signal})
    })


  }

  




  render() {



    return (
      <div >
      <h1>Hi Yuyan!</h1>
      <h2>Want to get <b>Popeyes!!?</b></h2>
      <h1>{this.state.me}</h1>
      <button onClick={()=> alert('Yay! I just received the notification, and will be outside in 5 minutes!')} type="button">Yes! Let's Go!</button> 
      <button onClick={()=> alert('I know.')} type="button">I'm a butt :(</button> 
      </div>
    );
  }
}

export default App;