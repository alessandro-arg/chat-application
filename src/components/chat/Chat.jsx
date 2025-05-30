import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useEffect, useState, useRef } from "react";
import React from "react";
import {
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { onValue, ref as rtdbRef } from "firebase/database";
import { rtdb } from "../../lib/firebase";
import { db } from "../../lib/firebase";
import useUserStore from "../../lib/user-store";
import useChatStore from "../../lib/chat-store";
import upload from "../../lib/upload";
import { formatMessageMeta } from "../../lib/message-helper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-toastify";
dayjs.extend(relativeTime);

const Chat = ({ onToggleDetail }) => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [fullscreenImg, setFullscreenImg] = useState(null);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages]);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  useEffect(() => {
    if (!user?.id) return;

    const statusRef = rtdbRef(rtdb, `status/${user.id}`);

    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserStatus(snapshot.val());
      } else {
        setUserStatus(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const formatLastSeen = (timestamp) => {
    return dayjs(timestamp).fromNow();
  };

  const handleEmoji = (emoji) => {
    setText((prev) => prev + emoji.native);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text === "" && !img.file) return;

    let imgUrl = null;

    try {
      if (img.file) {
        setIsUploading(true);
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          id: currentUser.id + Date.now(),
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          userChatsData.chats[chatIndex].lastMessage = text || "📷 Photo";
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatRef, {
            chats: userChatsData.chats,
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
    setIsUploading(false);
    setImg({
      file: null,
      url: "",
    });
    setText("");
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
        console.error("Download failed:", error);
      });
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>
              <span
                className={`status-dot ${
                  userStatus?.state === "online" ? "online" : "offline"
                }`}
              ></span>
              {userStatus?.state === "online"
                ? " Online"
                : userStatus?.lastChanged
                ? ` Last seen ${formatLastSeen(userStatus.lastChanged)}`
                : " Offline"}
            </p>
          </div>
        </div>
        <div className="icons">
          <img src="./info.png" alt="" onClick={onToggleDetail} />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message, index) => {
          const { formattedTime, formattedDate, showDateSeparator } =
            formatMessageMeta(message, index, chat.messages);

          return (
            <React.Fragment key={message?.id}>
              {showDateSeparator && (
                <div className="date-separator">
                  <span>{formattedDate}</span>
                </div>
              )}
              <div
                className={
                  message.senderId === currentUser?.id
                    ? "message own"
                    : "message"
                }
              >
                <div className="texts">
                  {message.img && (
                    <img
                      src={message.img}
                      alt=""
                      onClick={() => setFullscreenImg(message.img)}
                      className="chat-img"
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                  <span
                    className={
                      message.senderId === currentUser?.id ? "time own" : "time"
                    }
                  >
                    {formattedTime}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {fullscreenImg && (
          <div
            className="image-viewer-overlay"
            onClick={() => setFullscreenImg(null)}
          >
            <div
              className="image-viewer-content"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={fullscreenImg} alt="fullscreen" />
              <div className="image-viewer-actions">
                <button onClick={() => setFullscreenImg(null)}>
                  <img src="./close.svg" alt="Close" />
                </button>
                <button onClick={() => handleDownload(fullscreenImg)}>
                  <img src="./download.png" alt="Download" />
                </button>
              </div>
            </div>
          </div>
        )}
        {img.url && (
          <div className="message own preview">
            <div className="texts">
              <div className="preview-wrapper">
                {isUploading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <img src={img.url} alt="preview" />
                    <button
                      className="remove-img"
                      onClick={() => setImg({ file: null, url: "" })}
                      disabled={isUploading}
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You can not send a message."
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div
          className={
            isCurrentUserBlocked || isReceiverBlocked
              ? "emoji blocked"
              : "emoji"
          }
        >
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
          {open && (
            <div className="picker">
              <Picker data={data} onEmojiSelect={handleEmoji} theme="light" />
            </div>
          )}
        </div>
        <button
          className="send-button"
          onClick={handleSend}
          disabled={isUploading || isCurrentUserBlocked || isReceiverBlocked}
        >
          {isUploading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
