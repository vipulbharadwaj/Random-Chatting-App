import { useState } from "react";
import "./ImageMessage.css";

const ImageMessage = ({ msg }) => {
    const url= msg.url

  const [isRevealed, setIsRevealed] = useState(msg.sent);
  

  const handleView = () => setIsRevealed(true);
  const openInNewTab = () => window.open(url, "_blank");

  return (
    <div className="image-message">
      <img
        src={url}
        alt="sent"
        className={`chat-image ${isRevealed ? "clear" : "blur"}`}
        onClick={isRevealed ? openInNewTab : null}
      />
      {!isRevealed && (
        <button className="view-button" onClick={handleView}>
          View
        </button>
      )}
    </div>
  );
};

export default ImageMessage;
