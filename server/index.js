require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { watch } = require("fs");
const { setTimeout } = require("timers/promises");

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

io.on("connection", (socket) => {
  console.log("A User is Connected", socket.id);

  //when user is ready to chat
  socket.on("findPartner", () => {
    if (waitingUsers.length > 0) {
      const partnerSocket = waitingUsers.pop();

      //prevents self matching
      if (partnerSocket.id === socket.id) {
        socket.emit("waiting");
        return;
      }

      if (partnerSocket) {
        console.log("Partner Socket Id: ", partnerSocket.id);
        socket.partner = partnerSocket.id;
        partnerSocket.partner = socket.id;

        socket.emit("partnerFound", partnerSocket.id);
        partnerSocket.emit("partnerFound", socket.id);
      } else {
        socket.emit("waiting");
      }
    } else {
      if (!waitingUsers.some((user) => user.id === socket.id)) {
        waitingUsers.push(socket);
      }
    }
  });

  //Handling Messages betweeen Users
  socket.on("message", (data) => {
    console.log("Message Received: ", data);
    if (socket.partner) {
      io.to(socket.partner).emit("message", data);
    }
  });


  //Handling end chat
  socket.on('endChat', () => {
    console.log(`User ${socket.id} ended chat`);

    if (socket.partner) {
      // Notify the partner about the disconnection
      io.to(socket.partner).emit('partnerDisconnected');

      // Get the partner socket and reset their partner reference
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) {
        partnerSocket.partner = null; 
      }
    }

    // Reset the user's partner reference
    socket.partner = null;
    waitingUsers = waitingUsers.filter(user => user.id !== socket.id);

    socket.emit('ready');
  });

  // Handling Disconnection
  socket.on("disconnect", () => {
    waitingUsers = waitingUsers.filter((userId) => userId !== socket.id);
    console.log("User Disconnected", socket.id);

    if (socket.partner) {
      // Notify the partner about the disconnection
      io.to(socket.partner).emit("partnerDisconnected");

      // Get the partner socket and remove the partner reference
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) {
        partnerSocket.partner = null;
      }
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
