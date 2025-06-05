import { useEffect, useState, useRef } from "react";
import "./chat-list.css";
import AddUser from "./add-user/AddUser";
import useUserStore from "../../../lib/user-store";
import useChatStore from "../../../lib/chat-store";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { arrayRemove, arrayUnion } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-toastify";
dayjs.extend(relativeTime);

const Chatlist = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRefs = useRef({});

  const { currentUser } = useUserStore();
  const {
    user,
    changeChat,
    isCurrentUserBlocked,
    isReceiverBlocked,
    changeBlock,
  } = useChatStore();

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuOpen &&
        menuRefs.current[menuOpen] &&
        !menuRefs.current[menuOpen].contains(e.target)
      ) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

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
    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      const userChatsSnap = await getDoc(userChatsRef);
      if (userChatsSnap.exists()) {
        const currentChats = userChatsSnap.data().chats || [];
        const updatedChats = currentChats.filter(
          (chat) => chat.chatId !== chatId
        );

        await updateDoc(userChatsRef, {
          chats: updatedChats,
        });

        if (user?.chatId === chatId) {
          changeChat(null, null);
        }
        toast.success("Chat deleted succesfully");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleBlock = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", currentUser.id);

    try {
      const userSnap = await getDoc(userDocRef);
      const blockedList = userSnap.data()?.blocked || [];
      const isBlocked = blockedList.includes(user.id);
      const updatedBlockedList = isBlocked
        ? arrayRemove(user.id)
        : arrayUnion(user.id);

      await updateDoc(userDocRef, {
        blocked: updatedBlockedList,
      });

      const refreshedSnap = await getDoc(userDocRef);
      const refreshedBlocked = refreshedSnap.data()?.blocked || [];
      const receiverIsBlocked = refreshedBlocked.includes(user.id);
      useChatStore.getState().setReceiverBlocked(receiverIsBlocked);
    } catch (error) {
      console.log("Error updating block status:", error);
    }
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
          onClick={() => setAddMode(true)}
        />
      </div>
      {filteredChats.map((chat) => {
        const isBlocked = chat.user.blocked.includes(currentUser.id);

        return (
          <div
            className="item"
            key={chat.chatId}
            onClick={() => handleSelect(chat)}
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
                <p className="last-message">{chat.lastMessage}</p>
              )}
            </div>
            <div className="timestamp-wrapper">
              <div
                className="timestamp"
                style={{
                  color: chat?.isSeen ? "#aaaaaa" : "#5183fe",
                }}
              >
                {chat.updatedAt && formatTimestamp(chat.updatedAt)}
                {!chat.isSeen && <div className="unseen-indicator" />}
              </div>
            </div>
            <div
              className="chat-actions"
              style={{ position: "absolute", right: "0", bottom: "-10px" }}
              ref={(el) => (menuRefs.current[chat.chatId] = el)}
            >
              <img
                src="/arrowDown.png"
                alt="Options"
                className="menu-icon"
                onClick={(e) => handleMenuToggle(e, chat.chatId)}
              />
              <div
                className={`dropdown-menu ${
                  menuOpen === chat.chatId ? "open" : ""
                }`}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.chatId);
                  }}
                >
                  Delete Chat
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBlock();
                  }}
                >
                  {isCurrentUserBlocked
                    ? "You are blocked"
                    : isReceiverBlocked
                    ? "User blocked"
                    : "Block user"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {addMode && <AddUser onClose={() => setAddMode(false)} />}
    </div>
  );
};

export default Chatlist;
