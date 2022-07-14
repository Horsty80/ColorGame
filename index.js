const http = require("http");

const app = require("express")();
// Serve html page
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

app.listen(9091, () => console.log("Listening on http port 9091"));

const webSocketServer = require("websocket").server;

const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"));

// hashmap
const clients = {};

const wsServer = new webSocketServer({
  httpServer: httpServer,
});

wsServer.on("request", (request) => {
  // try to connect
  const connection = request.accept(null, request.origin); // tcp connection
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => console.log("closed!"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    // I have received a message from the client
    console.log(result);
  });
  // generate a new clientId
  const clientId = guid();
  // create the link between the client and the connection
  clients[clientId] = { connection };

  const payload = {
    method: "connect",
    clientId,
  };

  // send back the client connect
  connection.send(JSON.stringify(payload));
});

const guid = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
};
