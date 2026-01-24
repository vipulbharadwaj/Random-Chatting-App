import React, { useEffect, useRef, useState } from "react";
import "../ChatBody.css";


const Typing = ({ socket, setIsTyping }) => {
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleTypingEvent = () => {
      setIsTypingLocal(true);
      setIsTyping(true); 

      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Hiding indicator after 2. seconds of inactivity
      timeoutRef.current = setTimeout(() => {
        setIsTypingLocal(false);
        setIsTyping(false);
      }, 500);
    };

    socket.on("typing", handleTypingEvent);

    return () => {
      socket.off("typing", handleTypingEvent);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [socket, setIsTyping]);

  if (!isTypingLocal) return null;

  return (
    <div className="typing-container">
      <div className="typing-bubble">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <span className="typing-text">Partner is typing...</span>
    </div>
  );
};

export default Typing;
