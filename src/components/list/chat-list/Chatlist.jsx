import { useEffect, useState } from "react";
import "./chat-list.css";
import AddUser from "./add-user/AddUser";
import useUserStore from "../../../lib/user-store";
import useChatStore from "../../../lib/chat-store";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const Chatlist = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);

  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (response) => {
        const items = response.data()?.chats || [];

        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);

          const user = userDocSnap.exists() ? userDocSnap.data() : null;

          return { ...item, user };
        });

        const chatData = await Promise.all(promises);

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );
    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (error) {
      console.log(error);
    }
  };

  const handleMenuToggle = (e, chatId) => {
    e.stopPropagation();
    setMenuOpen((prev) => (prev === chatId ? null : chatId));
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  const handleDeleteChat = async (chatId) => {
    console.log("Delete chat", chatId);
  };

  const handleBlockUser = async (userId) => {
    console.log("Block user", userId);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    let date =
      typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp);

    const now = dayjs();
    const messageTime = dayjs(date);

    if (now.isSame(messageTime, "day")) {
      return messageTime.format("HH:mm");
    } else if (now.subtract(1, "day").isSame(messageTime, "day")) {
      return "Yesterday";
    } else if (now.diff(messageTime, "day") < 7) {
      return messageTime.format("dddd");
    } else {
      return messageTime.format("DD.MM.YY");
    }
  };

  return (
    <div className="chat-list">
      <div className="search">
        <div className="search-bar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.map((chat) => {
        const isBlocked = chat.user.blocked.includes(currentUser.id);

        return (
          <div
            className="item"
            key={chat.chatId}
            onClick={() => handleSelect(chat)}
            style={{
              backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
              position: "relative",
            }}
          >
            <img
              src={
                isBlocked ? "./avatar.png" : chat.user?.avatar || "./avatar.png"
              }
              alt=""
            />
            <div className="texts">
              <span>{isBlocked ? "User" : chat.user.username}</span>
              {chat?.lastMessage === "📷 Photo" ? (
                <p className="emoji-text">
                  <span className="camera-emoji" role="img" aria-label="camera">
                    📷
                  </span>
                  <span>Photo</span>
                </p>
              ) : (
                <p style={{ color: "#aaaaaa" }}>{chat.lastMessage}</p>
              )}
            </div>
            <div className="timestamp">
              {chat.updatedAt && formatTimestamp(chat.updatedAt)}
            </div>
            <div className="chat-actions">
              <img
                src="public/arrowDown.png"
                alt="Options"
                className="menu-icon"
                onClick={(e) => handleMenuToggle(e, chat.chatId)}
              />
              {menuOpen === chat.chatId && (
                <div className="dropdown-menu">
                  <div onClick={() => handleDeleteChat(chat.chatId)}>
                    Delete Chat
                  </div>
                  <div onClick={() => handleBlockUser(chat.user.id)}>
                    Block User
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {addMode && <AddUser></AddUser>}
    </div>
  );
};

export default Chatlist;
