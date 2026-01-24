import React, { useRef } from "react";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useState } from "react";
import { useMemo } from "react";
import "./App.css";
import "./ChatBody.css";
import AutoScroll from "./components/AutoScroll";
import Typing from "./components/Typing";
import { uploadImageToCloudinary } from "./components/ImageUpload";
import { MdUpload } from "react-icons/md";
import ImageMessage from "./components/ImageMessage";
import { MdSend, MdAddPhotoAlternate, MdArrowBack, MdCircle } from "react-icons/md";


const App = () => {
  const [message, setMessage] = useState("");
  const [socketId, setSocketId] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("welcome");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  const socket = useMemo(() => io("https://vichat.onrender.com"), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        text: message,
        sent: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, newMessage]);
      socket.emit("message", message);
      setMessage("");
      setIsTyping(false);
      socket.emit("typing", false);
    }
  };
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageUrl = await uploadImageToCloudinary(file);
      const msg = {
        type: "image",
        url: imageUrl,
        time: new Date().toLocaleTimeString(),
        sent: true,
      };

      socket.emit("message", msg);
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      console.error("Image upload failed");
    }
  };

  const handlefindPartner = () => {
    socket.emit("findPartner");
    setStatus("waiting");
  };
  const handleDisconnect = () => {
    socket.emit("endChat");
    setStatus("disconnected");
    setMessages([]);
    setMessage("");
    console.log("Disconnected from server");
  };

  useEffect(() => {
    // setStatus("welcome");
    const handleConnect = () => {
      setSocketId(socket.id);
      setStatus("connected");
      console.log("Connected to server", socket.id);
    };

    const handlePartnerFound = () => {
      setStatus("chatting");
    };
    const handleChatEnded = () => {
      setStatus("ended");
    };

    const handleWaiting = () => {
      setStatus("waiting");
    };

    const handleError = (err) => {
      console.error("Connection error: ", err);
      setStatus("error");
    };

    const handleMessage = (message) => {
      const base = typeof message === "string" ? { text: message } : message;
      const newMessage = {
        //text: message,
        ...base,
        sent: false,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      console.log("receive-message", message);
    };

    socket.on("connect", handleConnect);
    socket.on("message", handleMessage);
    socket.on("partnerFound", handlePartnerFound);
    socket.on("connect_error", handleError);
    socket.on("chatEnded", handleChatEnded);
    socket.on("partnerDisconnected", handleDisconnect);
    socket.on("waiting", handleWaiting);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("message", handleMessage);
      socket.off("partnerFound", handlePartnerFound);
      socket.off("connect_error", handleError);
      socket.off("chatEnded", handleChatEnded);
      socket.off("partnerDisconnected", handleDisconnect);
    };
  }, [socket]);

  const handleTyping = (e) => {
    const isUserTyping = e.target.value.length > 0;
    if (!isTyping && isUserTyping) {
      setIsTyping(true);
      socket.emit("typing", true);
    } else if (!isUserTyping && isTyping) {
      setIsTyping(false);
      socket.emit("typing", false);
    }
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", false);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (message.trim()) {
        handleSubmit(e);
      }
    }
  };

  // return (
  //   <>
  //     <div className="chat-container">
  //       <div className="chat-header">
  //         <h2>Welcome to Live Chat</h2>
  //         <span className="socket-id">ID: {socketId}</span>

  //         <div className={`connection-status ${status}`}>
  //           {status === "welcome" && <p>Connecting to server...</p>}
  //           {status === "connected" && <p>Connected</p>}
  //           {status === "waiting" && <p>Connecting to Partner...</p>}
  //           {status === "disconnected" && <p>Chat Ended</p>}
  //           {status === "chatting" && <p>Connected with Partner</p>}
  //           {status === "ended" && (
  //             <p>Your chat partner has left. Tap find to start a new chat!</p>
  //           )}
  //           {status === "error" && <p>Server is busy</p>}
  //         </div>
  //         <hr />
  //         <Typing socket={socket} setIsTyping={setIsTyping}></Typing>
  //       </div>
  //       <AutoScroll messages={messages}>
  //         {messages.map((msg, i) => (
  //           <div
  //             key={i}
  //             className={`message ${msg.sent ? "sent" : "received"}`}
  //           >
  //             <div className="message-bubble">
  //               {msg.text&&<p>{msg.text}</p>}
  //               {msg.type === "image" && (
  //                // <img src={msg.url} alt="sent img" className="message-image" />
  //                <ImageMessage key={i} msg={msg} />
  //               )}
  //               <span className="message-time">{msg.time}</span>
  //             </div>
  //           </div>
  //         ))}
  //       </AutoScroll>

  //       <form onSubmit={handleSubmit}>
  //         {status === "chatting" ? (
  //           <button className="endbtn" onClick={handleDisconnect}>
  //             End Chat
  //           </button>
  //         ) : (
  //           <button
  //             className="endbtn"
  //             disabled={status === "waiting"}
  //             onClick={handlefindPartner}
  //           >
  //             Find
  //           </button>
  //         )}
  //         <div className="upload-button-container">
  //           <input
  //             type="file"
  //             id="file-input"
  //             accept="image/*"
  //             onChange={handleSendImage}
  //             style={{ display: "none" }}
  //             disabled={status!=="chatting"}
  //           />
  //           <button className="upload-button"
  //             onClick={() => document.getElementById("file-input").click()}
  //             >
  //             <MdUpload className="upload-icon"/>
  //           </button>
            
  //         </div>

  //         <input
  //           id="message-input"
  //           type="text"
  //           disabled={status !== "chatting"}
  //           onChange={(e) => {
  //             setMessage(e.target.value);
  //             handleTyping(e);
  //           }}
  //           value={message}
  //           onKeyDown={handleKeyDown}
  //           name="message"
  //           placeholder="Type your message..."
  //         ></input>

  //         {/* <input id='room-input' type="text" onChange={(e)=>setRoom(e.target.value)} value={room} name="room" placeholder="Room Id" />*/}
  //         <button
  //           type="submit"
  //           className="sendbtn"
  //           disabled={status !== "chatting"}
  //         >
  //           {" "}
  //           <span className="send-text">Send</span>{" "}
  //           <span className="send-icon">➤</span>
  //         </button>
  //       </form>
  //     </div>
  //   </>
  // );



// ... inside your component ...

return (
    <div className="chat-app-wrapper">
      <div className="chat-window">
        
        {/* --- Header: Minimal & Glass --- */}
        <header className="chat-header">
           <div className="header-left">
              <div className="avatar-circle">
                 {status === "chatting" ? "👤" : "✨"}
              </div>
              <div className="header-info">
                 <h2 className="chat-title">
                    {status === "chatting" ? "Anonymous Partner" : "Random Chat"}
                 </h2>
                 <div className="status-row">
                    <MdCircle size={8} className={`status-dot ${status}`} />
                    <span className="status-text">
                       {status === "chatting" ? "Online" : status === "waiting" ? "Searching..." : "Disconnected"}
                    </span>
                 </div>
              </div>
           </div>
           
           {/* Header Actions (Find / End) */}
           <div className="header-actions">
              {status === "chatting" ? (
                 <button className="btn-pill danger" onClick={handleDisconnect}>
                    End
                 </button>
              ) : (
                 <button 
                    className={`btn-pill primary ${status === "waiting" ? "pulse" : ""}`} 
                    onClick={handlefindPartner}
                    disabled={status === "waiting"}
                 >
                    {status === "waiting" ? "Searching" : "Find Match"}
                 </button>
              )}
           </div>
        </header>

        {/* --- Chat Body --- */}
        <div className="chat-body">
            <AutoScroll messages={messages}>
               <div className="scroll-spacer">
                  {messages.length === 0 && (
                     <div className="empty-placeholder">
                        <p>Say hello to a stranger 👋</p>
                        <small>ID: {socketId?.slice(0,6)}</small>
                     </div>
                  )}

                  {messages.map((msg, i) => (
                     <div key={i} className={`msg-row ${msg.sent ? "sent" : "received"}`}>
                        <div className="msg-content">
                           {msg.type === "image" && <ImageMessage key={i} msg={msg} />}
                           {msg.text && <p className="msg-text">{msg.text}</p>}
                           <span className="msg-meta">{msg.time}</span>
                        </div>
                     </div>
                  ))}
               </div>
                <div><Typing socket={socket} setIsTyping={setIsTyping} /></div>
            </AutoScroll>
        </div>

        {/* --- Footer: The Input Bar --- */}
        
        <footer className="chat-footer">
           <form onSubmit={handleSubmit} className="input-group">
              
              {/* 1. Image Upload (Left) */}
              <input
                 type="file"
                 id="hidden-file"
                 accept="image/*"
                 onChange={handleSendImage}
                 hidden
                 disabled={status !== "chatting"}
              />
              <button 
                 type="button" 
                 className="icon-btn"
                 onClick={() => document.getElementById("hidden-file").click()}
                 disabled={status !== "chatting"}
              >
                 <MdAddPhotoAlternate size={24} />
              </button>

              {/* 2. Text Input (Middle - Grows to fill space) */}
              <input
                 className="main-input"
                 type="text"
                 placeholder="Type a message..."
                 value={message}
                 onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping(e);
                 }}
                 onKeyDown={handleKeyDown}
                 disabled={status !== "chatting"}
                 autoComplete="off"
              />

              {/* 3. Send Button (Right - Fixed position) */}
              <button 
                 type="submit" 
                 className="send-btn"
                 disabled={status !== "chatting" || !message.trim()}
              >
                 <MdSend size={20} />
              </button>

           </form>
           
           
          
        </footer>

      </div>
    </div>
);
};

export default App;
