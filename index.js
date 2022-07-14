const { create } = require("domain");
const { response } = require("express");
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
const games = {};

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
    // a user want to create a new game
    if (result.method === "create") {
      const clientId = result.clientId;
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        balls: 20,
        clients: [],
      };
      const payload = {
        method: "create",
        game: games[gameId],
      };
      const con = clients[clientId].connection;
      con.send(JSON.stringify(payload));
    }
    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];
      if (game.clients.length >= 3) {
        // sorry max players reach
        return;
      }
      const color = { 0: "Red", 1: "Green", 2: "Blue" }[game.clients.length];
      game.clients.push({
        clientId,
        color,
      });

      if (game.clients.length === 3) {
        updateGameState();
      }
      const payload = {
        method: "join",
        game,
      };
      game.clients.forEach((client) => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    }
    if (result.method === "play") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;

      let state = games[gameId].state;
      if (!state) {
        state = {};
      }
      state[ballId] = color;
      games[gameId].state = state;

      const game = games[gameId];
      //   const payload = {
      //     method: "play",
      //     game,
      //   };
    }
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

function updateGameState() {
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payload = {
      method: "update",
      game,
    };
    game.clients.forEach((client) => {
      clients[client.clientId].connection.send(JSON.stringify(payload));
    });
  }
  setTimeout(updateGameState, 500);
}
