const path = require("path");
const axios = require("axios");
const express = require("express");
const socket = require("socket.io");
const mongoose = require("mongoose");
const User = require("./utils/models/userSchema");
const Message = require("./utils/models/messageModel");
const { get } = require("http");
require("dotenv").config();

//Connecting to the database
const dbUrl = `mongodb+srv://samuel:${process.env.MONGO_DB_PASSWORD}@cluster0.a6o8s05.mongodb.net/devConnect?retryWrites=true&w=majority`;
mongoose.connect(dbUrl, (err) => {
  if (err) {
    console.log(err);
  }
  console.log("database connected");
});

//setting up app to use static files
const PORT = 8000;
const app = express();
const server = app.listen(PORT, () => {
  console.log(`server started, listening on port ${PORT} `);
});
app.use(express.static(path.join(__dirname, "public")));

//configuring app for http request parsing
app.use(express.json());
app.use(express.urlencoded());

// Socket setup
const io = socket(server);

// User.find({ username: username })
//   .then((user) => {
//     socket.username = user[0]?.username;
//     socket.chatRoom = community;
//     socket.join(community);
//     const BotMessage = `Hi, ${socket.username}, welcome back to Dev-connect. You have joined the ${socket.chatRoom} room`;
//     // socket.emit(
//     //   "updateChatMessage",
//     //   "ChatBot",
//     //   socket.chatRoom,
//     //   socket.username,
//     //   BotMessage
//     // );

//     const senderId = mongoose.Types.ObjectId(user[0]?.id);

//     const message = new Message({
//       text: BotMessage,
//       room: socket.chatRoom,
//       sender: senderId,
//     });

//     message
//       .save()
//       .then(() => {
//         let getRoomMessages = Message.find({
//           room: socket.chatRoom,
//         }).exec();
//         getRoomMessages.then((messageHistory) => {
//           socket.emit("loadChatHistory", messageHistory);
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//     return;
//   })
//   .catch((err) => {
//     console.log(err);
//   });
// const user = new User({ username });
// user
//   .save()
//   .then((res) => {
//     socket.username = username;
//     socket.chatRoom = community;
//     socket.join(community);
//     const welcomeBotMessage = `Hi, ${socket.username}, welcome to Dev-connect. You have joined the ${socket.chatRoom} community room`;
//     const message = new Message({
//       text: welcomeBotMessage,
//       room: socket.chatRoom,
//       sender: res._id,
//     });

//     message
//       .save()
//       .then(() => {
//         let getRoomMessages = Message.find({
//           room: socket.chatRoom,
//         }).exec();
//         getRoomMessages.then((messageHistory) => {
//           socket.emit("loadChatHistory", messageHistory);
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//     // socket.emit(
//     //   "updateChatMessage",
//     //   "ChatBot",
//     //   socket.chatRoom,
//     //   socket.username
//     // );
//   })
//   .catch((err) => {
//     // console.log(err);
//   });
socket.on("updateCurrentRoom", (room) => {
  let botMessage;
  botMessage = `${socket.username} left the room`;
  socket.broadcast
    .to(socket.chatRoom)
    .emit(
      "updateChatMessage",
      "ChatBot",
      socket.chatRoom,
      socket.username,
      botMessage
    );
  const message = new Message({
    text: botMessage,
    room: socket.chatRoom,
    sender: null,
  });

  message
    .save()
    .then(() => {
      let getRoomMessages = Message.find({
        room: socket.chatRoom,
      }).exec();
      getRoomMessages.then((messageHistory) => {
        socket.emit("updateChatHistory", messageHistory);
      });
    })
    .catch((err) => {
      console.log(err);
    });
  socket.leave(socket.chatRoom);
  socket.chatRoom = room;
  socket.join(socket.chatRoom);
  socket.emit(
    "updateChatMessage",
    "ChatBot",
    socket.chatRoom,
    socket.username,
    `Hi, ${socket.username}, You have joined ${socket.chatRoom} community`
  );

  socket.broadcast
    .to(room)
    .emit(
      "updateChatMessage",
      "NEWUSER",
      socket.username + "has joined the room"
    );
});

socket.on("sendMessage", (message) => {
  io.sockets
    .to(socket.chatRoom)
    .emit(
      "updateChatMessage",
      "myMessage",
      socket.chatRoom,
      socket.username,
      message
    );
});

socket.on("updateMembersList", () => {
  User.find({}).then((users) => {
    socket.emit("showUsers", users);
  });
});
