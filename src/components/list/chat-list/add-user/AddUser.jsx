import "./add-user.css";

const AddUser = () => {
  return (
    <div className="add-user">
      <form>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      <div className="user">
        <div className="detail">
          <img src="./avatar.png" alt="" />
          <span>Joea Doe</span>
        </div>
        <button>Add user</button>
      </div>
    </div>
  );
};

export default AddUser;
