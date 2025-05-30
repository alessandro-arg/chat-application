import "./user-info.css";
import { useEffect, useRef, useState } from "react";
import useUserStore from "../../../lib/user-store";
import { toast } from "react-toastify";
import { updateUsername, updateProfilePicture } from "../../../lib/user-utils";
import { updateDoc, doc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";

const Userinfo = () => {
  const { currentUser, setCurrentUser } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editUsernameModalOpen, setEditUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser.username);
  const [backgroundModalOpen, setBackgroundModalOpen] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false);
  const menuWrapperRef = useRef(null);

  const DEFAULT_AVATAR = "./avatar.png";

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

  const handleDeleteAvatar = async () => {
    if (currentUser.avatar === DEFAULT_AVATAR) return;

    try {
      if (currentUser.avatar.includes("firebasestorage.googleapis.com")) {
        const decodedUrl = decodeURIComponent(currentUser.avatar);
        const match = decodedUrl.match(/\/o\/(.+)\?alt=media/);
        if (match && match[1]) {
          const filePath = match[1];
          const fileRef = ref(storage, filePath);
          await deleteObject(fileRef);
        }
      }
      await updateDoc(doc(db, "users", currentUser.id), {
        avatar: DEFAULT_AVATAR,
      });
      setCurrentUser({ ...currentUser, avatar: DEFAULT_AVATAR });
      toast.success("Profile picture removed.");
    } catch (err) {
      console.error("Failed to delete avatar", err);
      toast.error("Failed to remove profile picture.");
    } finally {
      setMenuOpen(false);
    }
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
          <div
            onClick={handleDeleteAvatar}
            disabled={currentUser.avatar === DEFAULT_AVATAR}
            className={currentUser.avatar === DEFAULT_AVATAR ? "disabled" : ""}
          >
            Remove Profile Picture
          </div>
          <div onClick={() => setBackgroundModalOpen(true)}>
            Change Background
          </div>
          <div>Logout</div>
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

      {backgroundModalOpen && (
        <div className="bg-modal-overlay">
          <div className="bg-modal">
            <h3>Select a Background</h3>
            <div className="background-options">
              {["bg1.jpg", "bg2.jpg", "bg3.jpg", "bg4.jpg"].map((bg, index) => (
                <img
                  key={index}
                  src={`./backgrounds/${bg}`}
                  alt={`Background ${index + 1}`}
                  onClick={() => {
                    setSelectedBackground(bg);
                    setConfirmPopupOpen(true);
                  }}
                  className="background-thumb"
                />
              ))}
            </div>
            <div className="bg-modal-buttons">
              <button onClick={() => setBackgroundModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmPopupOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Apply this background?</h3>
            <img
              src={`./backgrounds/${selectedBackground}`}
              alt="Preview"
              style={{ width: "100%", borderRadius: "10px" }}
            />
            <div className="modal-buttons">
              <button onClick={() => setConfirmPopupOpen(false)}>No</button>
              <button
                onClick={() => {
                  document.body.style.backgroundImage = `url('./backgrounds/${selectedBackground}')`;
                  document.body.style.backgroundSize = "cover";
                  document.body.style.backgroundRepeat = "no-repeat";
                  setConfirmPopupOpen(false);
                  setBackgroundModalOpen(false);
                }}
              >
                Yes
              </button>
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
