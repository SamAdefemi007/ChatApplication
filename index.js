const path = require("path");
const axios = require("axios");
const express = require("express");
const socket = require("socket.io");
const mongoose = require("mongoose");
const User = require("./utils/models/userSchema");
const Message = require("./utils/models/messageModel");
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
const PORT = `0.0.0.0:$PORT`;
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

io.on("connection", (socket) => {
  console.log("Socket connection Made");

  //Connection when a new user joins the community
  socket.on("newUser", async (username, community) => {
    //Checking if user exists in this database via the api
    axios({
      method: "get",
      url: "http://localhost:8000/getUser",
      params: {
        username: username,
      },
    })
      .then(function (response) {
        let botMessage;
        let senderId;
        socket.chatRoom = community;
        //If user exists?
        if (response.data) {
          let userObj = response.data;
          senderId = mongoose.Types.ObjectId(userObj._id);
          socket.username = userObj.username;
          socket.join(socket.chatRoom);
          botMessage = `Hi, ${socket.username}, welcome back to Dev-connect. You have now joined the ${socket.chatRoom} room`;
        }
        //if user does not exist in the database, create a new user and save it
        else {
          botMessage = `Hi, ${socket.username}, welcome to Dev-connect. You have joined the ${socket.chatRoom} community room`;
          const newUser = new User({ username });
          newUser.save().then((user) => {
            senderId = user._id;
            socket.username = username;
            socket.join(socket.chatRoom);
          });
        }
        //save the welcome message in the database
        const messageObj = {
          text: botMessage,
          room: socket.chatRoom,
          sender: null,
        };
        let updatedChatList;
        saveMessage(messageObj);

        //get the updated Chat History and updated the front end
        (async () => {
          updatedChatList = await getChatHistory(socket.chatRoom);
          socket.emit(
            "updateChat",
            socket.chatRoom,
            socket.username,
            updatedChatList?.data
          );
          let userList = await getUsers();
          socket.emit("showUsers", userList);
        })();

        //send the updatedChat to the client
      })
      .catch(function (err) {
        console.log(err);
      });
  });

  socket.on("updateCurrentRoom", (room) => {
    let updatedChatList;
    //User left message
    let userLeftMessage = `${socket.username} left the room`;
    const leftMessage = new Message({
      text: userLeftMessage,
      room: socket.chatRoom,
      sender: null,
    });
    leftMessage.save().then(() => {});

    (async () => {
      updatedChatList = await getChatHistory(socket.chatRoom);
    })();

    socket.broadcast
      .to(socket.chatRoom)
      .emit("updateChat", socket.chatRoom, socket.username, [updatedChatList]);
    socket.leave(socket.chatRoom);
    socket.chatRoom = room;
    socket.join(socket.chatRoom);
    let userJoinedMessage = `Hi, ${socket.username}, You have joined ${socket.chatRoom} community`;
    const joinMessage = new Message({
      text: userJoinedMessage,
      room: socket.chatRoom,
      sender: null,
    });

    joinMessage.save().then((res) => {});

    (async () => {
      updatedChatList = await getChatHistory(socket.chatRoom);
    })();
    socket.emit("updateChat", socket.chatRoom, socket.username, [
      updatedChatList,
    ]);

    let broadcastMessage = socket.username + "has joined the room";

    const allBroadcast = new Message({
      text: broadcastMessage,
      room: socket.chatRoom,
      sender: null,
    });

    allBroadcast.save().then((res) => {});
    (async () => {
      updatedChatList = await getChatHistory(socket.chatRoom);
    })();
    socket.broadcast
      .to(room)
      .emit("updateChat", socket.chatRoom, socket.username, updatedChatList);
  });
});

//helper functions

//getChatHistory from database API
app.get("/chatHistory", (req, res) => {
  const community = req.query.community;
  let getRoomMessages = Message.find({
    room: community,
  }).exec();
  getRoomMessages
    .then((messageHistory) => {
      return res.status(200).json(messageHistory);
    })
    .catch((err) => {
      return res.status(500).json([{ error: err }]);
    });
});

const saveMessage = (messageObj) => {
  axios({
    method: "post",
    url: "http://localhost:8000/saveMessage",
    data: messageObj,
  }).then((response) => {
    console.log("message saved successfully");
  });
};

async function getChatHistory(room) {
  try {
    let res = await axios({
      method: "get",
      url: "http://localhost:8000/chatHistory",
      params: {
        community: room,
      },
    });

    return await res;
  } catch (error) {
    console.error(error);
  }
}

async function getUsers() {
  try {
    let res = await User.find({}).exec();
    return await res;
  } catch (error) {
    console.error(error);
  }
}

//GetUserId from database API

app.get("/getUser", (req, res) => {
  const username = req.query.username;
  let getUser = User.findOne({ username: username }).exec();
  getUser
    .then((user) => {
      return res.status(200).json(user);
    })
    .catch((err) => {
      return res.status(500).json([{ error: err }]);
    });
});

app.post("/saveMessage", (req, res) => {
  const { text, room, sender } = req.body;

  const message = new Message({
    text: text,
    room: room,
    sender: sender,
  });
  message
    .save()
    .then(() => {
      const updatedChatList = getChatHistory(room);
      return res.status(200).json({ updatedChatList });
    })
    .catch((err) => console.log(err));
});
