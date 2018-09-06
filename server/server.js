// cheatsheet
//  // sending to sender-client only
//  socket.emit('message', "this is a test");

//  // sending to all clients, include sender
//  io.emit('message', "this is a test");

//  // sending to all clients except sender
//  socket.broadcast.emit('message', "this is a test");

//  // sending to all clients in 'game' room(channel) except sender
//  socket.broadcast.to('game').emit('message', 'nice game');

//  // sending to all clients in 'game' room(channel), include sender
//  io.in('game').emit('message', 'cool game');

//  // sending to sender client, only if they are in 'game' room(channel)
//  socket.to('game').emit('message', 'enjoy the game');

//  // sending to all clients in namespace 'myNamespace', include sender
//  io.of('myNamespace').emit('message', 'gg');

//  // sending to individual socketid
//  socket.broadcast.to(socketid).emit('message', 'for your eyes only');

// io.on("connection", socket => {}) here the socket is indivadual socket for each user.
// one side emit another side use socket.on to recieve the emit from another side.`
// socket.on('createMessage', (message, callback)} callback is the acknoledge callback function to make sure the emited message has been recieved by the other side. logic need to be add to both on and emit functions to make it happen.
// socket.io will delete the room if there are no body in it.
const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const { generateMessage, generateLocationMessage } = require("./utils/message");
const { isRealString, isPrivate } = require("./utils/validation");
const { Users } = require("./utils/users");

const publicPath = path.join(__dirname, "../public");
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(express.static(publicPath));

io.on("connection", socket => {
  console.log(users);
  console.log("New user connected");

  socket.on("join", (params, callback) => {
    console.log(params);
    if (!isRealString(params.name) || !isRealString(params.room)) {
      return callback("user name and room name can not be empty.");
    }

    if (
      users.getUserbyNameRoom(params.name, params.room) ||
      params.name === "AnoChatRobot"
    ) {
      return callback(
        "please user another user name, this user name is occupied in this room"
      );
    }

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room, params.location);

    io.to(params.room).emit(
      "updateUserList",
      users.getUserList(params.room, socket.id)
    );
    socket.emit(
      "newMessage",
      generateMessage("AnoChatRobot", "Welcome to the Anochat")
    );
    socket.broadcast
      .to(params.room)
      .emit(
        "newMessage",
        generateMessage("AnoChatRobot", `Say Hi to ${params.name}.`)
      );
    callback();
  });

  socket.on("createMessage", (message, callback) => {
    var user = users.getUser(socket.id);

    if (user && isRealString(message.text)) {
      var targetUser = isPrivate(message.text, user.room, users);
      if (targetUser) {
        targetID = targetUser.id;
        socket.broadcast
          .to(targetID)
          .emit(
            "newMessage",
            generateMessage(user.name, message.text + " (private)")
          );
        socket.emit(
          "newMessage",
          generateMessage(user.name, message.text + " (private)")
        );
      } else {
        io.to(user.room).emit(
          "newMessage",
          generateMessage(user.name, message.text)
        );
      }
    }

    callback();
  });

  socket.on("createLocationMessage", coords => {
    var user = users.getUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "newLocationMessage",
        generateLocationMessage(user.name, coords.latitude, coords.longitude)
      );
    }
  });

  socket.on("disconnect", () => {
    var user = users.removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "updateUserList",
        users.getUserList(user.room, user.id)
      );
      io.to(user.room).emit(
        "newMessage",
        generateMessage("AnoChatRobot", `${user.name} has left.`)
      );
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});
