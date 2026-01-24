import React, { useEffect, useRef } from "react";

const AutoScroll = ({ children, messages }) => {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScrollRef.current = isNearBottom;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const iSentIt = lastMessage?.sent;

    if (iSentIt || shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="chat-body" ref={containerRef}>
      {children}
      
      <div ref={bottomRef} style={{ height: "1px", width: "100%" }} />
    </div>
  );
};

export default AutoScroll;