import React, { useEffect, useRef, useState } from "react";

const Typing = ({ socket}) => {
  const typingTimeoutRef = useRef(null);
  const [typingUser, setTypingUser] = useState(null);

  useEffect(() => {
    const handleTypingEvent = (user) => {
        if(user){
            setTypingUser(user);
        }
        else{
            setTypingUser(null);
        }
    };

    socket.on("typing", handleTypingEvent);
    return () => socket.off("typing", handleTypingEvent);
  }, [socket]);



  return typingUser ? <div className="typing-indicator">Partner is typing...</div> : null;
};

export default Typing;
