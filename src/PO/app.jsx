import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "src/PO-CSS/app.css";
import dilgLogo from "src/assets/dilg-po.png";
import dilgSeal from "src/assets/dilg-ph.png";
import { auth } from "src/firebase";
import { getDatabase, ref, get, set, query, orderByChild, equalTo } from "firebase/database";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail ,
  fetchSignInMethodsForEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

export default function App() {
  const db = getDatabase();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Check if email exists in database whenever userId changes
  useEffect(() => {
    const checkEmailInDatabase = async () => {
      if (!userId || userId.trim() === "") {
        setIsGoogleEnabled(false);
        return;
      }

      setIsCheckingEmail(true);
      
      try {
        // Query the database to check if email exists
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          const users = snapshot.val();
          // Check if any user has this email
          const emailExists = Object.values(users).some(user => 
            user.email && user.email.toLowerCase() === userId.toLowerCase()
          );
          
          setIsGoogleEnabled(emailExists);
        } else {
          setIsGoogleEnabled(false);
        }
      } catch (error) {
        console.error("Error checking email in database:", error);
        setIsGoogleEnabled(false);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    // Debounce the check to avoid too many requests while typing
    const timeoutId = setTimeout(() => {
      checkEmailInDatabase();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [userId, db]);

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


  const handleForgotPassword = async () => {
    if (!userId) {
      alert('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, userId);
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error.code === 'auth/user-not-found') {
        alert('No account found with this email.');
      } else if (error.code === 'auth/invalid-email') {
        alert('Invalid email address.');
      } else {
        alert('Error sending reset email: ' + error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const snapshot = await get(ref(db, `users/${user.uid}`));
      const now = Date.now();
      
      if (!snapshot.exists()) {
        await set(ref(db, `users/${user.uid}`), {
          email: user.email,
          role: "user",
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          lastVerified: now
        });
      } else {
        const userData = snapshot.val();
        const FOUR_HOURS = 4 * 60 * 60 * 1000;
        const lastVerified = userData.lastVerified || 0;
        
        if (now - lastVerified > FOUR_HOURS) {
          await set(ref(db, `users/${user.uid}/lastVerified`), now);
        }
      }

      const roleSnapshot = await get(ref(db, `users/${user.uid}/role`));
      const role = roleSnapshot.val();

      if (role === 'admin') {
        navigate('/dashboard');
      } else if (role === 'user') {
        navigate('/lgu-assessment');
      } else {
        alert('No access assigned');
      }

    } catch (error) {
      console.error('Google Sign-In error:', error.message);
      alert('Failed to sign in with Google: ' + error.message);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

const handleRegister = async (email, password) => {
  if (!email || !password) {
    alert("Please enter all registration fields");
    return;
  }

  try {
    console.log("Attempting to register:", email);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User created in Auth:", user.uid);

    // Send verification email
    await sendEmailVerification(user);
    console.log("Verification email sent");

    // Save user data to Realtime Database
    await set(ref(db, `users/${user.uid}`), {
      email: email,
      role: "user",
      lastVerified: Date.now(),
      createdAt: new Date().toISOString()
    });
    console.log("User data saved to database");

    alert("Registration successful! Please verify your email before logging in.");
    setRegEmail("");
    setRegPassword("");
    setShowRegisterModal(false);

  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "auth/email-already-in-use") {
      alert("Registration Failed: Email already registered.");
    } else if (error.code === "auth/invalid-email") {
      alert("Invalid Email");
    } else if (error.code === "auth/weak-password") {
      alert("Weak Password - Password should be at least 6 characters");
    } else {
      alert("Registration Failed: " + error.message);
    }
  }
};

  const resendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        alert("Verification email sent! Please check your inbox.");
      } catch (error) {
        console.error("Error sending verification email:", error);
        alert("Failed to send verification email. Please try again.");
      }
    } else {
      alert("No user is currently logged in.");
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
            alert("Please verify your email first.");
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
              type="email"
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
          <div className="forgot-password">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                handleForgotPassword();
              }}
            >
              Forgot Password?
            </a>
          </div>
          <button className="login-btn" type="submit">
            Log In
          </button>
        </form>

        <button
          className={`email-btn ${!isGoogleEnabled ? 'disabled-btn' : ''}`}
          onClick={handleGoogleSignIn}
          disabled={!isGoogleEnabled || isCheckingEmail}
          title={!isGoogleEnabled ? 'Email not registered in system' : 'Sign in with Google'}
        >
          {isCheckingEmail ? 'Checking...' : 'Continue with Google'}
        </button>

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
                    setShowRegisterModal(false);
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
              e.preventDefault();
              setShowRegisterModal(true);
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