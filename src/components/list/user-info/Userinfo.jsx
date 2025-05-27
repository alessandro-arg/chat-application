import "./user-info.css";
import { useState } from "react";
import useUserStore from "../../../lib/user-store";
import { updateUsername, updateProfilePicture } from "../../../lib/user-utils";

const Userinfo = () => {
  const { currentUser, setCurrentUser } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEditUsername = async () => {
    const newUsername = prompt("Enter new username", currentUser.username);
    if (newUsername && newUsername !== currentUser.username) {
      try {
        setLoading(true);
        await updateUsername(newUsername);
        setCurrentUser({ ...currentUser, username: newUsername });
      } catch (err) {
        console.error("Failed to update username", err);
      } finally {
        setLoading(false);
      }
    }
    setMenuOpen(false);
  };

  const handleEditAvatar = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          setLoading(true);
          const newAvatarURL = await updateProfilePicture(file);
          setCurrentUser({ ...currentUser, avatar: newAvatarURL });
        } catch (err) {
          console.error("Failed to update avatar", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fileInput.click();
    setMenuOpen(false);
  };

  return (
    <div className="user-info">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons" style={{ position: "relative" }}>
        <img
          src="./more.png"
          alt=""
          onClick={() => setMenuOpen((prev) => !prev)}
        />
        {menuOpen && (
          <div className="dropdown-menu">
            <div onClick={handleEditUsername}>Edit Username</div>
            <div onClick={handleEditAvatar}>Edit Profile Picture</div>
          </div>
        )}
      </div>
      {loading && <div className="loading-overlay">Updating...</div>}
    </div>
  );
};

export default Userinfo;
