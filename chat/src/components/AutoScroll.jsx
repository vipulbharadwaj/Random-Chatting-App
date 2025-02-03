import React from 'react'
import { useEffect } from 'react';
import { useRef } from 'react';

const AutoScroll = ({children, messages}) => {
    const chatContainerRef = useRef(null);
    const isAtBottomRef = useRef(null);


     // Scroll handling
useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const threshold = 80;
      const isAtBottom =
        container.scrollHeight -
          (container.scrollTop + container.clientHeight) <=
        threshold;
      isAtBottomRef.current = isAtBottom;
    };
    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  // Auto-scrolling whenever a new message arrives or is sent
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || messages.length === 0) return;
  
    const lastText = messages[messages.length - 1];
    if (lastText?.sent) {
      container.scrollTop = container.scrollHeight;
    } else if (isAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);
  return (
    <div className="chat-body" ref={chatContainerRef}>
    {children}
    </div>
  )
}

export default AutoScroll
