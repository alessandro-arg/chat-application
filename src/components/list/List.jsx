import "./list.css";
import Userinfo from "./user-info/Userinfo";
import Chatlist from "./chat-list/Chatlist";

const List = () => {
  return (
    <div className="list">
      <Userinfo></Userinfo>
      <Chatlist></Chatlist>
    </div>
  );
};

export default List;
