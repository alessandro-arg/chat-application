import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useState, useRef } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import useChatStore from "../../lib/chat-store";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const { chatId } = useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  console.log(chat);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>Jane Does</span>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat
              dolore molestiae corrupti at modi dicta, rerum quae adipisci et
              optio!
            </p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        <div className="message">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero
              adipisci quae incidunt inventore velit nisi pariatur asperiores
              fugiat sint obcaecati neque tempore, cupiditate corrupti
              aspernatur impedit ipsum quia corporis temporibus.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message own">
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero
              adipisci quae incidunt inventore velit nisi pariatur asperiores
              fugiat sint obcaecati neque tempore, cupiditate corrupti
              aspernatur impedit ipsum quia corporis temporibus.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero
              adipisci quae incidunt inventore velit nisi pariatur asperiores
              fugiat sint obcaecati neque tempore, cupiditate corrupti
              aspernatur impedit ipsum quia corporis temporibus.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message own">
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero
              adipisci quae incidunt inventore velit nisi pariatur asperiores
              fugiat sint obcaecati neque tempore, cupiditate corrupti
              aspernatur impedit ipsum quia corporis temporibus.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <img src="./Porsche-911-GT3-RS-4K-Wallpaper.jpg" alt="" />
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero
              adipisci quae incidunt inventore velit nisi pariatur asperiores
              fugiat sint obcaecati neque tempore, cupiditate corrupti
              aspernatur impedit ipsum quia corporis temporibus.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <img src="./img.png" alt="" />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji}></EmojiPicker>
          </div>
        </div>
        <button className="send-button">Send</button>
      </div>
    </div>
  );
};

export default Chat;
