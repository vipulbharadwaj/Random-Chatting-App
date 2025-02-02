import React from 'react'
import { useEffect } from 'react';
import { io, Socket } from "socket.io-client";
import { useState } from 'react';
import { useMemo } from 'react';
import './App.css'


const App = () => {
  const [message, setMessage] = useState("");
  //const [room, setRoom] = useState("");
  const[socketId, setSocketId] = useState("");
  const[messages, setMessages] = useState([]);
  const[status, setStatus] = useState("welcome");
  //console.log(messages);

  const socket = useMemo(()=>io("https://vichat.onrender.com"), [])
  

 
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        text: message,
        sent: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newMessage]);
      socket.emit('message', message);
      setMessage("");
    }
  };

   const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      if (message.trim()) {
        handleSubmit(e); 
      }
    }
  };

  
  const handlefindPartner=()=>{
    socket.emit('findPartner');
    setStatus('waiting');
  }
  const handleDisconnect = () => {
    socket.emit("endChat")
    setStatus("disconnected");
    setMessages([]);
    setMessage("");
    console.log("Disconnected from server");
  };
  socket.on('ready', ()=>{
    setTimeout(()=>{
      setStatus('ready');
    }, 2000)
  })
  

  useEffect(() => {
   // setStatus("welcome");
    const handleConnect = () => {
      setSocketId(socket.id);
      setStatus('connected');
      console.log("Connected to server", socket.id);
    };

    const handlePartnerFound=()=>{
      setStatus("chatting");
    }
     
    const handleWaiting=()=>{
      setStatus("waiting");
    }

    const handleError=(err)=>{
      console.error('Connection error: ', err)
      setStatus('error');
    }

    const handleMessage = (message) => {
      const newMessage = {
        text: message,
        sent: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      console.log("receive-message", message);
    };


    socket.on("connect", handleConnect);
    socket.on("message", handleMessage);
    socket.on('partnerFound', handlePartnerFound);
    socket.on('connect_error', handleError);
    socket.on('partnerDisconnected', handleDisconnect);
    socket.on('waiting', handleWaiting);
  
    return () => {
      socket.off("connect", handleConnect);
      socket.off("message", handleMessage);
      socket.off("partnerFound", handlePartnerFound);
      socket.off("connect_error", handleError);
      socket.off("partnerDisconnected", handleDisconnect);
    };
  }, [socket]);
  
  
  return (
    <>
      <div className="chat-container">
    <div className="chat-header">
      <h2>Welcome to Live Chat</h2>
      <span className="socket-id">ID: {socketId}</span>

      <div className={`connection-status ${status}`}>
      {status==="welcome" && <p>Connecting to server...</p>}
        {status === 'connected' && <p>Connected</p>}
        {status === 'waiting' && <p>Connecting to Partner...</p>}
        {status === 'disconnected' && <p>Chat Ended</p>}
        {status ==='chatting' && <p>Connected with Partner</p>}
        {status==='ready' && <p>
            Chat ended. please press <span>Find</span> to find a new partner.
          </p>}
          {status==='error' && <p>Server is busy</p>}
          
      </div>
      <hr />
    </div>
    <div className="chat-body">
    {messages.map((msg, i) => (
        <div
          key={i}
          className={`message ${msg.sent ? 'sent' : 'received'}`}
        >
          <div className="message-bubble">
            <p>{msg.text}</p>
            <span className="message-time">{msg.time}</span>
          </div>
        </div>
      ))}
    </div>
    <form onSubmit={handleSubmit}>
    {status === 'chatting' ? <button className='endbtn' onClick={handleDisconnect}>End Chat</button> :<button className='endbtn' onClick={handlefindPartner} >Find</button>}
      <input id='message-input' type="text" onChange={(e)=>setMessage(e.target.value)} value={message} name="message" onKeyDown={handleKeyDown} placeholder="Type a message..." />
     {/* <input id='room-input' type="text" onChange={(e)=>setRoom(e.target.value)} value={room} name="room" placeholder="Room Id" />*/}
      <button type="submit" className='sendbtn' disabled={status!=='chatting'}> <span className='send-text'>Send</span> <span className="send-icon">➤</span></button>
      
     
      
    </form>
    </div>
    </>
  )
}

export default App;
