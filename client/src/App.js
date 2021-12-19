import React, { createRef,  Component } from 'react';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import ReactPlayer from 'react-player';
import TextField from "@material-ui/core/TextField";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Button from "@material-ui/core/Button";
import AssignmentIcon from "@material-ui/icons/Assignment";
import IconButton from "@material-ui/core/IconButton";
import PhoneIcon from "@material-ui/icons/Phone";
import Peer from "simple-peer";

const io = require("socket.io-client");   




const port = process.env.PORT || 5000;
console.log(port)
var host = location.origin;
console.log(host)

class App extends Component {
  constructor(props) {
    super(props);
  // Initialize state
  this.state = { 
  me: "placeholder",
  receivingCall: false,
  caller: "",
  name: "",
  callerSignal: "",
  stream: "",
  callAccepted: false,
  callerName: "unknown caller",
  idToCall: "",
 }
 this.myVideo = createRef()
 this.myVideo.current = [];
 this.connectionRef = createRef()
 this.connectionRef.current = [];
 this.userVideo = createRef()
 this.userVideo.current = [];



 this.callUser = this.callUser.bind(this);
 this.answerCall = this.answerCall.bind(this);
 this.leaveCall = this.leaveCall.bind(this);
  }




  // Fetch passwords after first mount
  componentDidMount() {
      
    this.socket = io.connect(host, {port: port, transports: ["websocket"]});


    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      this.setState({stream: stream})
        this.myVideo.current.srcObject = stream
        console.log('Requesting media ... stream set to ', stream)
    })


    this.socket.on("me", (id) => {
      this.setState({me: id})
      console.log('socket received me, setting variable me to')
      console.log(this.state.me)
    })


    this.socket.on("callUser", (data) => {
      this.setState({receivingCall: true, caller: data.from, callerName: data.name, callerSignal: data.signal})
      console.log('sockets callUser is triggered: ' + this.state.name + " is receiving a call from ", this.state.callerName, "(", this.state.caller, ") with signal")
    })


  }





   callUser = (id) => {
    console.log('callUser function triggered')
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.state.stream
    })
    peer.on("signal", (data) => {
      this.socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: this.state.me,
        name: this.state.name
      })
    })
    peer.on("stream", (stream) => {
      
        this.userVideo.current.srcObject = stream
      
    })

    this.socket.on("callAccepted", (signal) => {
      console.log('Call was accepted in function callUser')
      this.setState({callAccepted: true})
      peer.signal(signal)
    })

    this.connectionRef.current = peer
  }





  answerCall =() =>  {
    this.setState({callAccepted: true})
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: this.state.stream
    })
    peer.on("signal", (data) => {
      this.socket.emit("answerCall", { signal: data, to: this.state.caller })
      console.log('answerCall peer received signal, emitting answerCall with signal data', "to", this.state.caller)
    })
    peer.on("stream", (stream) => {
      console.log('answerCall peer received stream, setting this.userVideo to stream')
      this.userVideo.current.srcObject = stream
    })

    peer.signal(this.state.callerSignal)
    this.connectionRef.current = peer
    console.log(this.state)
  }




  leaveCall = () => {
    this.setState({callEnded: true})
    this.connectionRef.current.destroy()
  }







  render() {


    return (
      <div >
<h1 style={{ textAlign: "center", color: '#fff' }}>Zoomish - ID: {this.state.me}</h1>
<Container>
					<div>
          {this.state.receivingCall && !this.state.callAccepted ? (
						<div className="caller">
						<h1 >{this.state.callerName} is calling...</h1>
						<Button variant="contained" color="primary" onClick={this.answerCall}>
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

{this.state.stream &&  <video className="img-hor-vert"   playsInline muted ref={this.myVideo} autoPlay style={{width: '300px', left: '15%', marginTop: '25px', position: 'absolute'}}/>}

{this.state.callAccepted && !this.state.callEnded ?
<div>
  {/* <video playsInline ref={this.userVideo} autoPlay style={{width: '90%', paddingLeft: '10%'}}  /> */}
  <h1>playing video</h1>
  <video playsInline ref={this.userVideo} autoPlay style={{width: '90%', paddingLeft: '10%'}}  />
  <h1>playing vid333eo</h1>
  </div>
  :
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




			<Container fluid style={{    bottom: 0, position: 'fixed'}}>
			<Row style={{backgroundColor: 'yellow'}}>
			<Col xs={3} >
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={this.state.name}
					onChange={(e) => this.setState({name: e.target.value})}

				/>
					</Col>
					<Col xs={3}>
				<CopyToClipboard text={this.state.me} >
					<Button variant="contained" onClick={() => console.log("Clicked copy ID with ID", this.state.me)} color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>
				</Col>
				<Col xs={3}>
				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={this.state.idToCall}
					onChange={(e) => this.setState({idToCall: e.target.value})}
				/>
					</Col>
					<Col xs={3}>
				<div className="call-button">
					{this.state.callAccepted && !this.state.callEnded ? (
						<Button variant="contained" color="secondary" onClick={this.leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => this.callUser(this.state.idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
				</div>
				</Col>

		</Row>
			</Container>






      </div>
    );
  }
}

export default App;