import React, { createRef, Component } from "react";
import "./App.css";
import { Container, Row, Col } from "react-bootstrap";
import ReactPlayer from "react-player";
import TextField from "@material-ui/core/TextField";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Button from "@material-ui/core/Button";
import AssignmentIcon from "@material-ui/icons/Assignment";
import IconButton from "@material-ui/core/IconButton";
import PhoneIcon from "@material-ui/icons/Phone";
import Peer from "simple-peer";
import ReactModal from "react-modal";
import Form from "react-bootstrap/Form";

const io = require("socket.io-client");

const port = process.env.PORT || 5000;
console.log(port);
var host = location.origin;
console.log(host);

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
      callerAge: "",
      callerLocation: "",
      callerGender: "",
      stream: "",
      callAccepted: false,
      callerName: "unknown caller",
      idToCall: "",
      showModal: true,
      gender: "male",
      searching: false,
      location: "Canada",
      age: "18-64",
    };
    this.myVideo = createRef();
    this.myVideo.current = [];
    this.connectionRef = createRef();
    this.connectionRef.current = [];
    this.userVideo = createRef();
    this.userVideo.current = [];

    this.callUser = this.callUser.bind(this);
    this.callRandomUser = this.callRandomUser.bind(this);
    this.answerCall = this.answerCall.bind(this);
    this.leaveCall = this.leaveCall.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  // Fetch passwords after first mount
  componentDidMount() {}

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });

    this.socket = io.connect(host, { port: port, transports: ["websocket"] });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.setState({ stream: stream });
        this.myVideo.current.srcObject = stream;
        console.log("Requesting media ... stream set to ", stream);
      });

    this.socket.on("me", (id) => {
      this.setState({ me: id });
      console.log("socket received me, setting variable me to");
      console.log(this.state.me);
    });

    this.socket.on("callUser", (data) => {
      this.setState({
        receivingCall: true,
        caller: data.from,
        callerName: data.name,
        callerSignal: data.signal,
        callerAge: data.age,
        callerLocation: data.location,
        callerGender: data.gender,
      });
      console.log(
        "sockets callUser is triggered: " +
          this.state.name +
          " is receiving a call from ",
        this.state.callerName,
        "(",
        this.state.caller,
        ") with signal and gender ",
        this.state.callerGender
      );
      this.answerCall();
    });

    this.socket.on("randomChat", (data) => {
      this.setState({
        callAccepted: true,
        caller: data.from,
        callerName: data.name,
        callerSignal: data.signal,
        callerAge: data.age,
        callerLocation: data.location,
        callerGender: data.gender,
      });
      console.log(
        "Randomly chatting with a ",
        data.gender,
        data.age,
        data.location,
        data.from,
        "!"
      );
    });
  }

  callUser = (id) => {
    console.log("callUser function triggered, creating peer");
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.state.stream,
    });
    peer.on("signal", (data) => {
      console.log("CallUser signal");
      this.socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: this.state.me,
        name: this.state.name,
        gender: this.state.gender,
        location: this.state.location,
        age: this.state.age,
      });
    });
    peer.on("stream", (stream) => {
      console.log("CallUser stream");
      this.userVideo.current.srcObject = stream;
    });

    this.socket.on("callAccepted", (signal) => {
      console.log("Call was accepted in function callUser");
      this.setState({ callAccepted: true });
      peer.signal(signal);
    });

    this.connectionRef.current = peer;
  };

  callRandomUser = (id) => {
    console.log("callRandomUser function triggered, creating peer");
    this.setState({ searching: true });
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.state.stream,
    });
    peer.on("signal", (data) => {
      console.log("CallRandomUser signal");
      this.socket.emit("callRandomUser", {
        userToCall: id,
        signalData: data,
        from: this.state.me,
        name: this.state.name,
        gender: this.state.gender,
        location: this.state.location,
        age: this.state.age,
      });
    });
    peer.on("stream", (stream) => {
      console.log(
        "random call peer received stream, setting this.userVideo to stream"
      );
      this.userVideo.current.srcObject = stream;
    });

    this.socket.on("callAccepted", (signal) => {
      console.log("Call was accepted in function callUser");
      this.setState({ callAccepted: true });
      peer.signal(signal);
    });

    this.connectionRef.current = peer;
  };

  answerCall = () => {
    this.setState({ callAccepted: true, searching: false });
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: this.state.stream,
    });
    peer.on("signal", (data) => {
      this.socket.emit("answerCall", { signal: data, to: this.state.caller });
      console.log(
        "answerCall peer received signal, emitting answerCall with signal data",
        "to",
        this.state.caller
      );
    });
    peer.on("stream", (stream) => {
      console.log(
        "answerCall peer received stream, setting this.userVideo to stream"
      );
      this.userVideo.current.srcObject = stream;
    });

    peer.signal(this.state.callerSignal);
    this.connectionRef.current = peer;
    console.log(this.state);
  };

  leaveCall = () => {
    this.setState({ callEnded: true });
    this.connectionRef.current.destroy();
  };

  render() {
    return (
      <div>
        <ReactModal
          isOpen={this.state.showModal}
          contentLabel="Input Age and Location"
          onRequestClose={this.handleCloseModal}
        >
          <p>Enter your information to log in</p>
          <Form>
            <Row>
              <Form.Group as={Col} controlId="formGridState">
                <Form.Label>Gender </Form.Label>
                <Form.Select
                  aria-label="Default select example"
                  onChange={(e) => {
                    this.setState({ gender: e.target.value });
                  }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Form.Group>

              <Form.Group as={Col} controlId="formGridStatea">
                <Form.Label>Age </Form.Label>
                <Form.Select
                  aria-label="Default select example"
                  defaultValue={this.state.age}
                  onChange={(e) => {
                    this.setState({ age: e.target.value });
                  }}
                >
                  <option value="<12">&#60;12</option>
                  <option value="12-18">12-18</option>
                  <option value="18-64">18-64</option>
                  <option value="64+">&#62;64</option>
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col} controlId="formGridState">
                <Form.Label>Country</Form.Label>
                <Form.Select
                  defaultValue={this.state.location}
                  onChange={(e) => {
                    this.setState({ location: e.target.value });
                  }}
                >
                  <option value="Canada">Canada</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Form.Group>
            </Row>
          </Form>

          <br />
          <br />
          <br />
          <br />
          <br />

          <Row>
            <Col></Col>
            <Col>
              <p>
                {this.state.gender} {this.state.age} {this.state.location}{" "}
              </p>
              <button onClick={this.handleCloseModal}>Submit</button>
            </Col>
            <Col></Col>
          </Row>
        </ReactModal>

        <h1 style={{ textAlign: "center", color: "#fff" }}>Random Chat Site</h1>
        <Container>
          <div>
            {this.state.receivingCall && !this.state.callAccepted ? (
              <div className="caller">
                <h1>
                  {this.state.callerName} ({this.state.callerAge} year old{" "}
                  {this.state.callerGender} from {this.state.callerLocation}) is
                  calling...
                </h1>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.answerCall}
                >
                  Answer
                </Button>
              </div>
            ) : null}
          </div>
        </Container>

        <Container fluid>
          <Row>
            <Col xs={1} style={{ color: "white" }}>
              <h3>
                <u>Your info</u>
              </h3>
              <h6>Gender: {this.state.gender}</h6>
              <h6>Age: {this.state.age}</h6>
              <h6>Location: {this.state.location}</h6>

              <h3>
                <u>Chatting with</u>
              </h3>
              <h6>Gender: {this.state.callerGender}</h6>
              <h6>Age: {this.state.callerAge}</h6>
              <h6>Location: {this.state.callerLocation}</h6>
            </Col>

            <Col xs={10}>
              {this.state.stream && (
                <video
                  className="img-hor-vert"
                  playsInline
                  muted
                  ref={this.myVideo}
                  autoPlay
                  style={{
                    width: "300px",
                    left: "15%",
                    marginTop: "25px",
                    position: "absolute",
                  }}
                />
              )}

              {this.state.callAccepted && !this.state.callEnded ? (
                <div>
                  {/* <video playsInline ref={this.userVideo} autoPlay style={{width: '90%', paddingLeft: '10%'}}  /> */}
                  <h1>playing video</h1>
                  <video
                    playsInline
                    ref={this.userVideo}
                    autoPlay
                    style={{ width: "90%", paddingLeft: "10%" }}
                  />
                  <h1>playing vid333eo</h1>
                </div>
              ) : (
                <ReactPlayer
                  playing={true}
                  loop={true}
                  url="videos/loading_circle_bars.mp4"
                  width="100%"
                  height="90%"
                  controls={true}
                />
              )}
            </Col>
            <Col xs={1}></Col>
          </Row>
        </Container>

        <Container fluid style={{ bottom: 0, position: "fixed" }}>
          <Row style={{ backgroundColor: "yellow" }}>
            <Col xs={3}>
              <TextField
                id="filled-basic"
                label="Name"
                variant="filled"
                value={this.state.name}
                onChange={(e) => this.setState({ name: e.target.value })}
              />
            </Col>
            <Col xs={3}>
              <CopyToClipboard text={this.state.me}>
                <Button
                  variant="contained"
                  onClick={() =>
                    console.log("Clicked copy ID with ID", this.state.me)
                  }
                  color="primary"
                  startIcon={<AssignmentIcon fontSize="large" />}
                >
                  Copy ID
                </Button>
              </CopyToClipboard>
            </Col>
            <Col xs={2}>
              <TextField
                id="filled-basic"
                label="ID to call"
                variant="filled"
                value={this.state.idToCall}
                onChange={(e) => this.setState({ idToCall: e.target.value })}
              />
            </Col>
            {!this.state.searching && !this.state.callAccepted && (
              <Col xs={1}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => this.callRandomUser(this.state.idToCall)}
                >
                  Random Chat
                </Button>
              </Col>
            )}
            {this.state.searching && !this.state.callAccepted && (
              <Col xs={1}>
                <h6>Searching</h6>
              </Col>
            )}
            {!this.state.searching && this.state.callAccepted && (
              <Col xs={1}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => this.callRandomUser(this.state.idToCall)}
                >
                  Start New Chat
                </Button>
              </Col>
            )}

            <Col xs={3}>
              <div className="call-button">
                {this.state.callAccepted && !this.state.callEnded ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={this.leaveCall}
                  >
                    End Call
                  </Button>
                ) : (
                  <IconButton
                    color="primary"
                    aria-label="call"
                    onClick={() => this.callUser(this.state.idToCall)}
                  >
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
