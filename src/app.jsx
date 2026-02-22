import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./app.css";
import dilgLogo from "./assets/dilg-po.png";
import dilgSeal from "./assets/dilg-ph.png";
import { auth } from "src/firebase";
import { useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink 
} from "firebase/auth";


export default function App() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailLogin, setEmailLogin] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!userId || !password) {
      alert("Please enter User ID and Password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, userId, password);
      const user = userCredential.user;
      console.log("Logged in user:", user);
      localStorage.setItem("loggedIn", "true");
      navigate("/dashboard");

      // Clear login inputs
      setUserId("");
      setPassword("");
    } catch (error) {
      console.error(error);
      alert("Login Failed: Wrong User ID/Password" );

      // Reset inputs on failed login
      setUserId("");
      setPassword("");
    }
  };


    useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

const handleEmailLogin = async (email) => {
  if (!email || !email.includes("@")) {
    alert("Please enter a valid email address");
    return false;
  }

  if (cooldown > 0) return false;

  setSendingLink(true);

  const actionCodeSettings = {
    url: window.location.origin + "/dashboard",
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", email);
    alert("Check your email for the sign-in link!");
    setCooldown(60);
    return true; // success
  } catch (error) {
    console.error(error);
    alert(error.message);
    return false; // failed
  } finally {
    setSendingLink(false);
  }
};

  const handleRegister = async (email, password) => {
    if (!email || !password) {
      alert("Please enter all registration fields");
      return;
    }

    try {
      // Attempt to create a new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      alert("Registration Successful!");

      // Reset registration inputs
      setRegEmail("");
      setRegPassword("");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        // Email already exists
        alert("Registration Failed: This email is already registered. Please login instead.");
      } else if (error.code === "auth/invalid-email") {
        alert("Registration Failed: Invalid Email");
      } else if (error.code === "auth/weak-password") {
        alert("Registration Failed: Password is too weak");
      } else {
        alert("Registration Failed: No record found for the provided email");
      }

      // Reset registration inputs on failure
      setRegEmail("");
      setRegPassword("");
    }
  };

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        email = window.prompt("Please provide your email for confirmation");
      }
      signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          console.log("Logged in via email link:", result.user);
          window.localStorage.removeItem("emailForSignIn");
          alert("Login Successful via Email Link!");
          navigate("/dashboard");
        })
        .catch((error) => {
          console.error(error);
          alert("Failed to sign in via email link: " + error.message);
        });
    }
  }, []);


  return (
    <div className="app-container">
      <div className="left-panel">
        <div className="logo-top">
          <img src={dilgLogo} alt="Logo" className="top-logo" />
        </div>

        <h1 className="title">
          ONE{" "}
          <span className="highlight">
            MAR<span className="cyan">IND</span>
            <span className="red">UQUE</span>
          </span>
          <br />
          TRACKING SYSTEM
        </h1>
        <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent default page reload
              handleLogin();       // Trigger login function
            }}
          >
        <div className="form-group">
          <label>Email</label>
          <input
            type="text"
            placeholder="Email"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              {showPassword ? "⌣" : "👁"}
            </span>
          </div>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Log In
        </button>
</form>


        <button
          className="email-btn"
          onClick={() => setShowEmailModal(true)} // open modal
        >
          Continue with email
        </button>

{/* Email Login Modal */}
        {showEmailModal && (
          <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Login with Email</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEmailLogin(emailLogin);
                  setShowEmailModal(false);
                }}
              >
                <div className="register-form">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={emailLogin}
                    onChange={(e) => setEmailLogin(e.target.value)}
                    required
                  />
                </div>

                <button
                  className="register-btn"
                  type="submit"
                  disabled={sendingLink || cooldown > 0}
                >
                  {sendingLink
                    ? "Sending..."
                    : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Send Login Link"}
                </button>

                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setShowEmailModal(false)}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
{/* Register Modal */}
        {showRegisterModal && (
          <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Register</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister(regEmail, regPassword);
                  setShowRegisterModal(false);
                }}
              >
              <div className="register-form">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <div className="register-form">
                <label>Password</label>
                <div className="password-wrapper">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    placeholder="Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  <span
                    className="eye"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{ cursor: "pointer" }}
                  >
                    {showRegPassword ? "⌣" : "👁"}
                  </span>
                </div>
              </div>

              <button
                className="register-btn"
                onClick={() => {
                  handleRegister(regEmail, regPassword);
                  setShowRegisterModal(false); // close modal after registration
                }}
              >
                Register
              </button>

              <button
                className="close-btn"
                onClick={() => setShowRegisterModal(false)}
              >
                Cancel
              </button>
              </form>
            </div>
          </div>
        )}
        <p className="register-text">
          Don't have an account yet?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault(); // Prevent page jump
              setShowRegisterModal(true); // Open modal
            }}
          >
            Register Here
          </a>
        </p>
      </div>

      <div className="right-panel">
        <img src={dilgSeal} alt="DILG Logo" className="seal" />
      </div>
    </div>

    
  );
}
