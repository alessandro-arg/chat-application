import "./detail.css";
import useChatStore from "../../lib/chat-store";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const Detail = ({ onClose }) => {
  const { user, chatId } = useChatStore();
  const [images, setImages] = useState([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [fullscreenImgIndex, setFullscreenImgIndex] = useState(null);

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
        <div className="option" onClick={togglePhotos}>
          <div className="title">
            <span>Shared photos</span>
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
