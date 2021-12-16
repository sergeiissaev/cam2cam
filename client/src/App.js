import React, { createRef,  Component } from 'react';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import ReactPlayer from 'react-player';





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
  callAccepted: false,
 }
 this.myVideo = createRef()
 this.myVideo.current = [];
 this.connectionRef = createRef()
 this.userVideo = createRef()
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

    const callUser = (id) => {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream
      })
      peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: id,
          signalData: data,
          from: me,
          name: name
        })
      })
      peer.on("stream", (stream) => {
        
          userVideo.current.srcObject = stream
        
      })
      socket.on("callAccepted", (signal) => {
        this.setState({callAccepted: true})
        peer.signal(signal)
      })
  
      connectionRef.current = peer
    }







    const answerCall =() =>  {
      setCallAccepted(true)
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream
      })
      peer.on("signal", (data) => {
        socket.emit("answerCall", { signal: data, to: caller })
      })
      peer.on("stream", (stream) => {
        userVideo.current.srcObject = stream
      })
  
      peer.signal(callerSignal)
      connectionRef.current = peer
    }
  
    const leaveCall = () => {
      setCallEnded(true)
      connectionRef.current.destroy()
    }




    return (
      <div >
<h1 style={{ textAlign: "center", color: '#fff' }}>Zoomish - ID: {this.state.me}</h1>
<Container>
					<div>
          {this.state.receivingCall && !this.state.callAccepted ? (
						<div className="caller">
						<h1 >{this.state.name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}




            </div>
            </Container>



            <Container fluid>
				<Row>
        <Col xs={1}></Col>
        
				<Col xs={10} >

{this.state.stream &&  <video playsInline muted ref={this.myVideo} autoPlay style={{width: '300px', left: '15%', marginTop: '25px', position: 'absolute'}}/>}

{this.state.callAccepted && !this.state.callEnded ?
  <video playsInline ref={this.userVideo} autoPlay style={{width: '90%', paddingLeft: '10%'}}  />:
  <ReactPlayer
playing = {true}
loop = {true}
    url= 'videos/loading_circle_bars.mp4'
    width='100%'
    height='90%'
    controls = {true}

    />}


</Col>
        <Col xs={1}></Col>
        </Row>
			</Container>










      </div>
    );
  }
}

export default App;