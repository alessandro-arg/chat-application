import "./detail.css";
import useChatStore from "../../lib/chat-store";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const Detail = ({ onClose }) => {
  const { user, chatId } = useChatStore();
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!chatId) return;

      try {
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          const allMessages = chatData.messages || [];

          const imageMessages = allMessages
            .filter((msg) => msg.img)
            .map((msg) => msg.img);

          setImages(imageMessages);
        }
      } catch (err) {
        console.error("Error fetching chat images:", err);
      }
    };

    fetchImages();
  }, [chatId]);

  return (
    <div className="detail">
      <div className="button-wrapper">
        <button className="close-btn" onClick={onClose}>
          <img src="./close.svg" alt="" />
        </button>
      </div>
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat settings</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & help</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared photos</span>
            <img src="./arrowDown.png" alt="" />
          </div>
          <div className="photos">
            {images.length === 0 ? (
              <p className="no-images">No shared photos yet</p>
            ) : (
              images.map((imgUrl, index) => {
                const fullPath = decodeURIComponent(
                  imgUrl.split("/o/")[1]?.split("?")[0] || ""
                );
                const filename = fullPath.replace(/^images\//, "");

                return (
                  <div className="photo-item" key={index}>
                    <div className="photo-detail">
                      <img src={imgUrl} alt={`shared-${index}`} />
                      <span title={filename}>
                        {filename.length > 10
                          ? filename.slice(0, 10) + "..."
                          : filename}
                      </span>
                    </div>
                    <img src="./download.png" alt="Download" className="icon" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
