import List from "./components/list/List";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { rtdb, db, auth } from "./lib/firebase";
import {
  getDatabase,
  ref,
  onDisconnect,
  onValue,
  set,
  serverTimestamp,
} from "firebase/database";
import { db as firestore } from "./lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import useUserStore from "./lib/user-store";
import useChatStore from "./lib/chat-store";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const db = getDatabase();
    const connectedRef = ref(db, ".info/connected");
    const unSub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserInfo(user.uid);

        const userStatusRef = ref(db, `/status/${user.uid}`);
        const firestoreUserRef = doc(firestore, "users", user.uid);

        onValue(connectedRef, async (snap) => {
          if (snap.val() === false) {
            await updateDoc(firestoreUserRef, {
              isOnline: false,
              lastSeen: Date.now(),
            });
            return;
          }

          onDisconnect(userStatusRef)
            .set({ isOnline: false, lastSeen: Date.now() })
            .then(() => {
              set(userStatusRef, {
                isOnline: true,
                lastSeen: Date.now(),
              });

              updateDoc(firestoreUserRef, {
                isOnline: true,
                lastSeen: Date.now(),
              });
            });
        });
      }
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List></List>
          {chatId && <Chat></Chat>}
          {chatId && <Detail></Detail>}
        </>
      ) : (
        <Login></Login>
      )}
      <Notification></Notification>
    </div>
  );
};

export default App;
