import "./user-info.css";
import { useEffect, useRef, useState } from "react";
import useUserStore from "../../../lib/user-store";
import { toast } from "react-toastify";
import { updateUsername, updateProfilePicture } from "../../../lib/user-utils";

const Userinfo = () => {
  const { currentUser, setCurrentUser } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editUsernameModalOpen, setEditUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser.username);
  const menuWrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuWrapperRef.current &&
        !menuWrapperRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleEditUsername = () => {
    setNewUsername(currentUser.username);
    setEditUsernameModalOpen(true);
    setMenuOpen(false);
  };

  const confirmUsernameUpdate = async () => {
    if (newUsername && newUsername !== currentUser.username) {
      try {
        setLoading(true);
        await updateUsername(newUsername);
        setCurrentUser({ ...currentUser, username: newUsername });
        toast.success("Username updated successfully!");
      } catch (err) {
        console.error("Failed to update username", err);
        toast.error("Failed to update username.");
      } finally {
        setLoading(false);
      }
    }
    setEditUsernameModalOpen(false);
  };

  // const handleEditUsername = async () => {
  //   const newUsername = prompt("Enter new username", currentUser.username);
  //   if (newUsername && newUsername !== currentUser.username) {
  //     try {
  //       setLoading(true);
  //       await updateUsername(newUsername);
  //       setCurrentUser({ ...currentUser, username: newUsername });
  //     } catch (err) {
  //       console.error("Failed to update username", err);
  //       toast.error("Failed to update username.");
  //     } finally {
  //       toast.success("Username updated successfully!");
  //       setLoading(false);
  //     }
  //   }
  //   setMenuOpen(false);
  // };

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
          toast.error("Failed to update profile picture.");
        } finally {
          toast.success("Profile picture updated!");
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
      <div
        className="icons"
        style={{ position: "relative" }}
        ref={menuWrapperRef}
      >
        <img src="./more.png" alt="" onClick={handleToggleMenu} />
        <div className={`dropdown-menu ${menuOpen ? "open" : ""}`}>
          <div onClick={handleEditUsername}>Edit Username</div>
          <div onClick={handleEditAvatar}>Edit Profile Picture</div>
        </div>
      </div>

      {editUsernameModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Username</h3>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={() => setEditUsernameModalOpen(false)}>
                Cancel
              </button>
              <button onClick={confirmUsernameUpdate}>Save</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div>Updating image...</div>
            <div className="spinner"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Userinfo;
