require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { watch } = require("fs");
const { setTimeout } = require("timers/promises");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const server = http.createServer(app);

app.use(cors());
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let waitingUsers = [];
let activeChats = new Map(); // storing active chat pairs

io.on("connection", (socket) => {
  console.log("A User is Connected", socket.id);

  socket.on("findPartner", ()=>{
    try {
      if(waitingUsers.length >0){
        const partnerSocket = waitingUsers.shift();
        
        if(partnerSocket.id == socket.id){
          socket.emit("waiting");
          return;
        }
        activeChats.set(socket.id, partnerSocket.id);
        activeChats.set(partnerSocket.id, socket.id);

        socket.emit("partnerFound", partnerSocket.id);
        partnerSocket.emit("partnerFound", socket.id);
      }
      else{
        if(!waitingUsers.some((user)=> user.id===socket.id)){
          waitingUsers.push(socket);
          socket.emit("waiting");
        }
      }
    } catch (error) {
      console.error(`Error in findPartner: ${error.message}`);
    }
  })

  //handling typing event
  socket.on("typing", (isTyping)=>{
    const partnerId = activeChats.get(socket.id);
    if(partnerId){
      io.to(partnerId).emit("typing", isTyping? `User ${socket.id}`: null);
      }
  });

  //Handling Messages betweeen Users
  socket.on("message", (data) => {
    console.log("Message Received: ", data);
    const partner = activeChats.get(socket.id);
    if (partner) {
      io.to(partner).emit("message", data);
    }
     const chatId = [socket.id, partner].sort().join("_");
      const chatRef = db.collection("chats").doc(chatId);
      try {
        await chatRef.set(
          {
            messages: admin.firestore.FieldValue.arrayUnion({
              sender: socket.id,
              receiver: partner,
              text: data,
              timestamp: admin.firestore.Timestamp.now(),
            }),
          },
          { merge: true }
        );

      } catch (error) {
        console.error("Error saving message:", error);
      }
  });

  //Handling end chat
  socket.on("endChat", () => {
    console.log(`User ${socket.id} ended chat`);

    const partnerId = activeChats.get(socket.id);
    if (partnerId) {
      // Notify the partner about the disconnection
      io.to(partnerId).emit("partnerDisconnected");
      activeChats.delete(socket.id);
      activeChats.delete(partnerId);
    }
    socket.emit("chatEnded");
  });

  // Handling Disconnection
  socket.on("disconnect", () => {
 
    console.log("User Disconnected", socket.id);
    //Removing from waiting user if socket is in the list
    waitingUsers = waitingUsers.filter((userId) => userId.id !== socket.id);

    const partnerSocket = activeChats.get(socket.id);
    if (partnerSocket) {
      // Notify the partner about the disconnection
      io.to(partnerSocket).emit("partnerDisconnected");
      activeChats.delete(socket.id);
      activeChats.delete(partnerSocket);
    }
    socket.emit("disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
