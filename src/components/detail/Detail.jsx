import "./detail.css";
import useChatStore from "../../lib/chat-store";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useRef } from "react";

const Detail = ({ onClose }) => {
  const { user, chatId } = useChatStore();
  const [images, setImages] = useState([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [fullscreenImgIndex, setFullscreenImgIndex] = useState(null);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [pinChat, setPinChat] = useState(false);
  const settingsRef = useRef(null);
  const [height, setHeight] = useState("0px");

  useEffect(() => {
    if (showChatSettings && settingsRef.current) {
      setHeight(`${settingsRef.current.scrollHeight}px`);
    } else {
      setHeight("0px");
    }
  }, [showChatSettings]);

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

  const togglePhotos = () => {
    setShowPhotos((prev) => !prev);
  };

  const getFilenameFromUrl = (imgUrl) => {
    const fullPath = decodeURIComponent(
      imgUrl.split("/o/")[1]?.split("?")[0] || ""
    );
    const filenameWithTimestamp = fullPath.replace(/^images\//, "");
    const filenameMatch = filenameWithTimestamp.match(
      /[^/\\]*\.(jpg|jpeg|png|gif)$/i
    );
    return filenameMatch ? filenameMatch[0] : filenameWithTimestamp;
  };

  const handleDownload = (url) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `image-${timestamp}.jpg`;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
        toast.success("Image downloaded succesfully!");
      })
      .catch((error) => {
        toast.error("Download failed:", error);
      });
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      toast.success("Chat history cleared!");
    }
  };

  const handleNextImage = () => {
    setFullscreenImgIndex((prevIndex) =>
      prevIndex < images.length - 1 ? prevIndex + 1 : 0
    );
  };

  const handlePrevImage = () => {
    setFullscreenImgIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : images.length - 1
    );
  };

  const handleCloseFullscreen = () => {
    setFullscreenImgIndex(null);
  };

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
          <div
            className="title"
            onClick={() => setShowChatSettings((prev) => !prev)}
          >
            <div className="settings-wrapper">
              <img src="./settings.png" alt="" />
              <span>Chat settings</span>
            </div>
            <img
              src={showChatSettings ? "./arrowDown.png" : "./arrowUp.png"}
              alt=""
              className="toggle-arrow"
            />
          </div>
        </div>
        <div
          className="settings-content"
          ref={settingsRef}
          style={{
            height: height,
            opacity: showChatSettings ? 1 : 0,
            overflow: "hidden",
            transition:
              "height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease-in-out",
          }}
        >
          <div
            className="toggle-item"
            onClick={() => setMuteNotifications(!muteNotifications)}
          >
            <img src="./notifications.png" alt="" />
            <span>Mute notifications</span>
          </div>

          <div className="toggle-item" onClick={() => setPinChat(!pinChat)}>
            <img src="./pin.png" alt="" />
            <span>Pin this chat</span>
          </div>

          <div className="toggle-item clear-btn" onClick={handleClearChat}>
            <img src="./trash.png" alt="" />
            <span>Clear chat history</span>
          </div>
        </div>
        <div className="option">
          <div className="title">
            <div className="privacy-wrapper">
              <img src="./privacy&help.png" alt="" />
              <span>Privacy & help</span>
            </div>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option" onClick={togglePhotos}>
          <div className="title">
            <div className="photo-wrapper">
              <img src="./shared-img.png" alt="" />
              <span>Shared photos</span>
            </div>
            <img
              src={showPhotos ? "./arrowDown.png" : "./arrowUp.png"}
              alt=""
            />
          </div>
          <div
            className={`photos ${showPhotos ? "visible" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {images.length === 0 ? (
              <p className="no-images">No shared photos yet</p>
            ) : (
              images.map((imgUrl, index) => {
                const filename = getFilenameFromUrl(imgUrl);

                return (
                  <div className="photo-item" key={index}>
                    <div className="photo-detail">
                      <img
                        src={imgUrl}
                        alt={`shared-${index}`}
                        onClick={() => setFullscreenImgIndex(index)}
                      />
                      <span
                        title={filename}
                        onClick={() => setFullscreenImgIndex(index)}
                      >
                        {filename.length > 10
                          ? filename.slice(0, 10) + "..."
                          : filename}
                      </span>
                    </div>
                    <img
                      src="./download.png"
                      alt="Download"
                      className="icon"
                      onClick={() => handleDownload(images[fullscreenImgIndex])}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {fullscreenImgIndex !== null && (
        <div className="image-viewer-overlay" onClick={handleCloseFullscreen}>
          <div
            className="image-viewer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={images[fullscreenImgIndex]} alt="fullscreen" />
            <div className="image-viewer-actions">
              <button onClick={handleCloseFullscreen}>
                <img src="./close.svg" alt="Close" />
              </button>
              <button
                onClick={() => handleDownload(images[fullscreenImgIndex])}
              >
                <img src="./download.png" alt="Download" />
              </button>
            </div>
            <button className="nav-arrow left" onClick={handlePrevImage}>
              <img src="./arrowLeft.png" alt="" />
            </button>
            <button className="nav-arrow right" onClick={handleNextImage}>
              <img src="./arrowRight.png" alt="" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;
