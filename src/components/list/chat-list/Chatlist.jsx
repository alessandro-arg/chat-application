import { useEffect, useState } from "react";
import "./chat-list.css";
import AddUser from "./add-user/AddUser";
import useUserStore from "../../../lib/user-store";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";

const Chatlist = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);

  const { currentUser } = useUserStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (response) => {
        const items = response.data().chats;

        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.reciverId);
          const userDocSnap = await getDoc(userDocRef);

          const user = userDocSnap.data();

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

  return (
    <div className="chat-list">
      <div className="search">
        <div className="search-bar">
          <img src="./search.png" alt="" />
          <input type="text" placeholder="Search" />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {chats.map((chat) => {
        <div className="item" key={chat.chatId}>
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>Jane Doe</span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>;
      })}
      {addMode && <AddUser></AddUser>}
    </div>
  );
};

export default Chatlist;
