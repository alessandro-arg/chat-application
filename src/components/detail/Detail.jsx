import { auth, db } from "../../lib/firebase";
import "./detail.css";
import useUserStore from "../../lib/user-store";
import useChatStore from "../../lib/chat-store";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { rtdb } from "../../lib/firebase";
import { ref as rtdbRef, set } from "firebase/database";
import { toast } from "react-toastify";

const Detail = ({ onClose }) => {
  const { currentUser } = useUserStore();
  const { user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } =
    useChatStore();

  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = async () => {
    try {
      const statusRef = rtdbRef(rtdb, `status/${currentUser.id}`);
      await set(statusRef, {
        state: "offline",
        lastChanged: Date.now(),
      });
      await auth.signOut();
      toast.success("Correctly logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
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
        <div className="option">
          <div className="title">
            <span>Shared photos</span>
            <img src="./arrowDown.png" alt="" />
          </div>
          <div className="photos">
            <div className="photo-item">
              <div className="photo-detail">
                <img src="./favicon.png" alt="" />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
            <div className="photo-item">
              <div className="photo-detail">
                <img src="./favicon.png" alt="" />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
            <div className="photo-item">
              <div className="photo-detail">
                <img src="./favicon.png" alt="" />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
            <div className="photo-item">
              <div className="photo-detail">
                <img src="./favicon.png" alt="" />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
            <div className="photo-item">
              <div className="photo-detail">
                <img src="./favicon.png" alt="" />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
            <div className="photo-item">
              <div className="photo-detail">
                <img src="./favicon.png" alt="" />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared files</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
      </div>
      <button className="block-button" onClick={handleBlock}>
        {isCurrentUserBlocked
          ? "You are blocked"
          : isReceiverBlocked
          ? "User blocked"
          : "Block user"}
      </button>
    </div>
  );
};

export default Detail;
