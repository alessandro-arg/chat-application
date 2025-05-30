import "./add-user.css";
import { useEffect, useState, useRef } from "react";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import useUserStore from "../../../../lib/user-store";

const AddUser = ({ onClose }) => {
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [existingChatUserIds, setExistingChatUserIds] = useState([]);
  const { currentUser } = useUserStore();
  const [isOpen, setIsOpen] = useState(true);
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchUserChats = async () => {
      try {
        const userChatsDoc = await getDoc(doc(db, "userchats", currentUser.id));
        if (userChatsDoc.exists()) {
          const chats = userChatsDoc.data().chats || [];
          const receiverIds = chats.map((c) => c.receiverId);
          setExistingChatUserIds(receiverIds);
        }
      } catch (error) {
        console.log("Error fetching user chats:", error);
      }
    };

    fetchUserChats();
  }, [currentUser.id]);

  useEffect(() => {
    if (input.trim() === "") {
      setUsers([]);
      return;
    }
    searchUsers(input.trim());
  }, [input]);

  const handleClose = () => {
    onClose();
  };

  const searchUsers = async (username) => {
    try {
      const userRef = collection(db, "users");
      const q = query(
        userRef,
        where("username", ">=", username),
        where("username", "<=", username + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);

      const foundUsers = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((u) => u.id !== currentUser.id);

      setUsers(foundUsers);
    } catch (error) {
      console.log("Error searching users:", error);
    }
  };

  const handleAdd = async (user) => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      setExistingChatUserIds((prev) => [...prev, user.id]);
    } catch (error) {
      console.log("Error adding user:", error);
    }
  };

  return isOpen ? (
    <div className="search-overlay">
      <div className="search-modal" ref={modalRef}>
        <div className="button-wrapper">
          <button onClick={handleClose}>
            <img src="./close.svg" alt="Close" />
          </button>
          <h3>Search users</h3>
        </div>

        <input
          type="text"
          placeholder="Username"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="user-list">
          {users.length === 0 && input.trim() !== "" && <p>No users found!</p>}
          {users.map((user) => (
            <div className="user" key={user.id}>
              <div className="detail">
                <img src={user.avatar || "./avatar.png"} alt="" />
                <span>{user.username}</span>
              </div>
              {!existingChatUserIds.includes(user.id) ? (
                <button onClick={() => handleAdd(user)}>Add user</button>
              ) : (
                <span className="already-added">Already in chat</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;
};

export default AddUser;
