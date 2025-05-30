import "./login.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { auth, db, storage } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import upload from "../../lib/upload";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  const [loading, setLoading] = useState(false);

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      await toast.promise(
        (async () => {
          const response = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

          let imgUrl = "./avatar.png";

          if (avatar?.file) {
            imgUrl = await upload(avatar.file);
          }

          await setDoc(doc(db, "users", response.user.uid), {
            username,
            email,
            avatar: imgUrl,
            id: response.user.uid,
            blocked: [],
          });

          await setDoc(doc(db, "userchats", response.user.uid), {
            chats: [],
          });
        })(),
        {
          pending: "Creating account...",
          success: "Account created successfully",
          error: "Something went wrong",
        }
      );
    } catch (err) {
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await toast.promise(
        (async () => {
          const response = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
        })(),
        {
          pending: "Loggin in...",
          success: "Succefully logged in",
          error: "Something went wrong",
        }
      );
    } catch (err) {
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome back</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading}>
            {loading ? "Loading.." : "Sign in"}
          </button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="" />
            Upload an image
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleAvatar}
          />
          <input type="text" placeholder="Username" name="username" />
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading}>
            {loading ? "Loading.." : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
