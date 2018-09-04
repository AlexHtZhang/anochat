// io.on("connection", socket => {}) here the socket is indivadual socket for each user.
// one side emit another side use socket.on to recieve the emit from another side.
const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const publicPath = path.join(__dirname, "../public");
const port = process.env.PORT || 8888;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use(express.static(publicPath));

io.on("connection", socket => {
  console.log("New user connected");

  socket.emit("newMessage", {
    from: "Admin",
    text: "Welcome to the anochat",
    createdAt: new Date().getTime()
  });

  socket.broadcast.emit("newMessage", {
    from: "Admin",
    text: "New user joined",
    createdAt: new Date().getTime()
  });

  socket.on("createMessage", message => {
    console.log("createMessage", message);
    io.emit("newMessage", {
      from: message.from,
      text: message.text,
      createdAt: new Date().getTime()
    });
    // socket.broadcast.emit('newMessage', {
    //   from: message.from,
    //   text: message.text,
    //   createdAt: new Date().getTime()
    // });
  });

  socket.on("disconnect", () => {
    console.log("User was disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});
