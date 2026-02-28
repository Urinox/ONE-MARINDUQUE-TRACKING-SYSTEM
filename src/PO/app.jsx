import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "src/PO-CSS/app.css";
import dilgLogo from "src/assets/dilg-po.png";
import dilgSeal from "src/assets/dilg-ph.png";
import { auth } from "src/firebase";
import { useEffect } from "react";
import { getDatabase, ref, get, set } from "firebase/database";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendEmailVerification 
} from "firebase/auth";


export default function App() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const db = getDatabase();
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

async function handleLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🚫 Require OTP verification (email verified)
    if (!user.emailVerified) {
      alert("Please verify your email (OTP) before logging in.");
      return;
    }

    const uid = user.uid;
    const snapshot = await get(ref(db, `users/${uid}/role`));
    const role = snapshot.val();

    if (role === 'admin') {
      navigate('/dashboard');
    } else if (role === 'user') {
      navigate('/lgu-assessment');
    } else {
      alert('No access assigned');
    }
  } catch (error) {
    console.error('Login error:', error.message);
  }
}


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
          // Create user
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // 🔐 Send OTP-style verification email
          await sendEmailVerification(user);

          // Save role
          await set(ref(db, `users/${user.uid}`), {
            email: email,
            role: "user"
          });

          alert("Registration successful! Please verify your email before logging in.");
          setRegEmail("");
          setRegPassword("");

        } catch (error) {
          console.error(error);

          if (error.code === "auth/email-already-in-use") {
            alert("Registration Failed: Email already registered.");
          } else if (error.code === "auth/invalid-email") {
            alert("Invalid Email");
          } else if (error.code === "auth/weak-password") {
            alert("Weak Password");
          } else {
            alert("Registration Failed");
          }

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
              const user = result.user;

              if (!user.emailVerified) {
                alert("Please verify your email (OTP) first.");
                return;
              }

              window.localStorage.removeItem("emailForSignIn");
              alert("Login Successful via Email Link!");
              navigate("/dashboard");
            })
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
                e.preventDefault();
                handleLogin(userId, password);
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

        <button className="login-btn" type="submit">
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
