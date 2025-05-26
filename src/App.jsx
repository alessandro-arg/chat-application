import List from "./components/list/List";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, rtdb } from "./lib/firebase";
import { ref, set, onDisconnect, serverTimestamp } from "firebase/database";
import useUserStore from "./lib/user-store";
import useChatStore from "./lib/chat-store";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);

      if (user) {
        const statusRef = ref(rtdb, `status/${user.uid}`);

        const isOfflineForRTDB = {
          state: "offline",
          lastChanged: serverTimestamp(),
        };

        const isOnlineForRTDB = {
          state: "online",
          lastChanged: serverTimestamp(),
        };

        onDisconnect(statusRef)
          .set(isOfflineForRTDB)
          .then(() => {
            set(statusRef, isOnlineForRTDB);
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
