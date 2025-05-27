import { db, auth } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";
import upload from "./upload";

export const updateUsername = async (newUsername) => {
  const userId = auth.currentUser.uid;
  await updateDoc(doc(db, "users", userId), {
    username: newUsername,
  });
};

export const updateProfilePicture = async (file) => {
  const userId = auth.currentUser.uid;
  const avatarURL = await upload(file);
  await updateDoc(doc(db, "users", userId), {
    avatar: avatarURL,
  });
  return avatarURL;
};
