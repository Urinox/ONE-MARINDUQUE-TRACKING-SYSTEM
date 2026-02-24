import React, { useState, useEffect } from "react";
import { db, auth} from "./firebase";
import "./encode.css";
import dilgLogo from "./assets/dilg-po.png";
import dilgSeal from "./assets/dilg-ph.png";
import { FiSave } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ref, push, onValue, set } from "firebase/database";



export default function Encode() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const user = auth.currentUser;
  const displayName = user?.email || "User";
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [subFieldType, setSubFieldType] = useState("");
  const [choices, setChoices] = useState([]);
  const [editProfileData, setEditProfileData] = useState({
  name: "",
  email: displayName,
  image: ""
});
  const [profileData, setProfileData] = useState({
    name: "",
    email: displayName,
    image: ""
  });
  const [data, setData] = useState([]);



  // Add Main Indicator
const addMainIndicator = () => {
  setMainIndicators((prev) => [
    ...prev,
    {
      id: prev.length + 1,
      title: "",
      fieldType: "",
      choices: [],
      verification: "",
    },
  ]);
};

// Update Main Indicator
const updateMainIndicator = (id, field, value) => {
  setMainIndicators((prev) =>
    prev.map((main) =>
      main.id === id ? { ...main, [field]: value } : main
    )
  );
};

// Update Main Choices
const updateMainChoice = (mainId, index, value) => {
  setMainIndicators((prev) =>
    prev.map((main) => {
      if (main.id === mainId) {
        const updatedChoices = [...main.choices];
        updatedChoices[index] = value;
        return { ...main, choices: updatedChoices };
      }
      return main;
    })
  );
};

// Add Main Choice
const addMainChoice = (mainId) => {
  setMainIndicators((prev) =>
    prev.map((main) =>
      main.id === mainId
        ? { ...main, choices: [...main.choices, ""] }
        : main
    )
  );
};

// Remove Main Choice
const removeMainChoice = (mainId, index) => {
  setMainIndicators((prev) =>
    prev.map((main) => {
      if (main.id === mainId) {
        const filtered = main.choices.filter((_, i) => i !== index);
        return { ...main, choices: filtered };
      }
      return main;
    })
  );
};

useEffect(() => {
  if (!auth.currentUser) return;

  const profileRef = ref(db, `profiles/${auth.currentUser.uid}`);
  onValue(profileRef, (snapshot) => {
    if (snapshot.exists()) {
      const profile = snapshot.val();
      setProfileData(profile);

      // If the profile has no name, force edit modal
      if (!profile.name) {
        setShowEditProfileModal(true);
      }
    } else {
      // No profile exists yet, open edit modal
      setShowEditProfileModal(true);
    }
  });
}, []);

useEffect(() => {
  const dataRef = ref(db, `encode/${auth.currentUser.uid}`);
  onValue(dataRef, (snapshot) => {
    const records = [];
    let counter = 1; // start IDs from 1
    snapshot.forEach((childSnapshot) => {
      const record = childSnapshot.val();
      records.push({ ...record, id: counter++, firebaseKey: childSnapshot.key });
    });
    setData(records);
  });
}, []);


const [mainIndicators, setMainIndicators] = useState([
  {
    id: 1,
    title: "",
    fieldType: "",
    choices: [],
    verification: "",
  },
]);


const handleSaveProfile = async () => {
  if (!auth.currentUser) return;

  try {
    setSavingProfile(true);

    await set(ref(db, `profiles/${auth.currentUser.uid}`), {
      ...editProfileData,
      email: auth.currentUser.email
    });

setProfileData(editProfileData); // update visible profile

    alert("Profile updated successfully!");
    setShowEditProfileModal(false);
  } catch (error) {
    console.error(error);
    alert("Failed to save profile");
  } finally {
    setSavingProfile(false);
  }
};

const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    setEditProfileData({ ...editProfileData, image: reader.result });
  };
  reader.readAsDataURL(file);
};


  /* Pagination Logic */
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

const handleSignOut = () => {
  const confirmLogout = window.confirm("Are you sure you want to sign out?");
  if (confirmLogout) {
    navigate("/login");
  }
};



// State for all sub-indicators
  const [subIndicators, setSubIndicators] = useState([
    {
      id: 1,
      title: "",
      fieldType: "",
      choices: [],
      verification: "",
    },
  ]);

  // Handler to add a new blank sub-indicator
  const addSubIndicator = () => {
    setSubIndicators((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        title: "",
        fieldType: "",
        choices: [],
        verification: "",
      },
    ]);
  };

  // Handler to update a sub-indicator property by id
  const updateSubIndicator = (id, field, value) => {
    setSubIndicators((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, [field]: value } : sub
      )
    );
  };

  // Handler to update choices for multiple or checkbox types
  const updateChoice = (subId, index, value) => {
    setSubIndicators((prev) =>
      prev.map((sub) => {
        if (sub.id === subId) {
          const updatedChoices = [...sub.choices];
          updatedChoices[index] = value;
          return { ...sub, choices: updatedChoices };
        }
        return sub;
      })
    );
  };

  // Add new choice for multiple or checkbox
  const addChoice = (subId) => {
    setSubIndicators((prev) =>
      prev.map((sub) =>
        sub.id === subId
          ? { ...sub, choices: [...sub.choices, ""] }
          : sub
      )
    );
  };

  // Remove a choice
  const removeChoice = (subId, index) => {
    setSubIndicators((prev) =>
      prev.map((sub) => {
        if (sub.id === subId) {
          const filteredChoices = sub.choices.filter(
            (_, i) => i !== index
          );
          return { ...sub, choices: filteredChoices };
        }
        return sub;
      })
    );
  };

  return (
    <div className="dashboard-scale">
      <div className="dashboard">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="encodesidebar-header">
            {sidebarOpen && (
              <>
              <img src={dilgSeal} alt="DILG Seal" style={{ height: "50px", width: "auto" }} />
              <img src={dilgLogo} alt="DILG Logo" style={{ height: "50px", width: "auto" }} />
              <h3>ONE <span className="yellow">MAR</span><span className="cyan">IND</span>
              <span className="red">UQUE</span> TRACKING SYSTEM</h3>
              <div className="sidebar-divider"></div>
              </>
            )}
          </div>


                {sidebarOpen && (
                <>
                    <button className="encodeback-btn" onClick={() => navigate("/dashboard")}>
                    ⬅ BACK
                    </button>

                    <div className="sidebar-menu">

                    <div className="sidebar-item">
                        Financial Administration and Sustainability
                    </div>

                    <div className="sidebar-item">
                        Disaster Preparedness
                    </div>

                    <div className="sidebar-item">
                        Social Protection and Sensitivity
                    </div>

                    <div className="sidebar-item">
                        Health Compliance and Responsiveness
                    </div>

                    <div className="sidebar-item">
                        Sustainable Education
                    </div>

                    <div className="sidebar-item">
                        Business-Friendliness and Competitiveness
                    </div>

                    <div className="sidebar-item">
                        Safety, Peace and Order
                    </div>

                    <div className="sidebar-item">
                        Environmental Management
                    </div>

                    <div className="sidebar-item">
                        Tourism, Heritage Development, Culture and Arts
                    </div>

                    <div className="sidebar-item">
                        Youth Development
                    </div>

                    </div>

                </>
                )}
        </div>


        {/* Main */}
        <div className="main">
          <div className="topbar">
            <button
              className="toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ cursor: "pointer" }}
            >
              {sidebarOpen ? "☰" : "✖"}
            </button>
            <div className="topbar-left">
            <div className="topbar-left">
                  <h2>Provincial Assessment</h2>
                </div>
              </div>

              <div className="top-right">

                
<div className="profile-container">
    <div
      className="profile"
      onClick={() => setShowProfileModal(true)}
      style={{ cursor: "pointer" }}
    >
      <div className="avatar">
        {profileData.image ? (
          <img
            src={profileData.image}
            alt="avatar"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "7px solid #0c1a4b",
            }}
          />
        ) : (
          "👤"
        )}
      </div>
      <span>{profileData.name || displayName}</span>
    </div>
  </div>


{showProfileModal && (
  <div className="modal-overlay">
    <div className="profile-view-modal">

      <div className="profile-view-header">
        <span className="back-btn" onClick={() => setShowProfileModal(false)}>←</span>
        <h3>Profile</h3>
      </div>

      <div className="profile-view-body">
        <div className="profile-view-avatar">
          {profileData.image ? (
            <img src={profileData.image} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">👤</div>
          )}
        </div>

        <h2>{profileData.name || "No Name"}</h2>
        <p className="profile-email">{profileData.email}</p>
        <div className="profile-action-buttons">
          <button
            className="profile-btn"
            onClick={() => {
              setShowProfileModal(false);
              setEditProfileData(profileData); // copy saved data
              setShowEditProfileModal(true);
            }}
          >
            Edit Profile
          </button>

          <button
            className="profile-btn signout"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>

    </div>
  </div>
)}
{showEditProfileModal && (
  <div className="modal-overlay">
    <div className="add-record-modal profile-modal">

      <div className="modal-header">
        <h3>Edit Profile</h3>
          <span
            className="close-x"
            onClick={() => {
              setEditProfileData(profileData); // reset changes
              setShowEditProfileModal(false);  // close modal
            }}
          >
            ✕
          </span>
      </div>

      <div className="modal-body">

        {/* Profile Image */}
        <div className="modal-field">
          <label>Profile Image:</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>

        {editProfileData.image && (
          <div className="profile-preview">
            <img src={editProfileData.image} alt="Preview" />
            <button
              type="button"
              className="remove-photo-btn"
              onClick={() =>
                setEditProfileData({ ...editProfileData, image: "" })
              }
            >
              Remove
            </button>
          </div>
        )}

        {/* Name */}
        <div className="modal-field">
          <label>Name:</label>
          <input
            type="text"
            value={editProfileData.name}
            onChange={(e) =>
              setEditProfileData({ ...editProfileData, name: e.target.value })
            }
          />
        </div>

        {/* Email (Read Only) */}
        <div className="modal-field">
          <label>Email:</label>
          <input
            type="text"
            value={auth.currentUser?.email || ""}
            disabled
            style={{ background: "#f1f1f1", cursor: "not-allowed" }}
          />
        </div>

        <div className="modal-footer">
          <button
            className="save-profile-btn"
            onClick={handleSaveProfile}
            disabled={savingProfile || !editProfileData.name.trim()}
          >
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  </div>
)}
{showModal && (
  <div className="modal-overlay">
    <div className="indicator-modal">

      {/* HEADER */}
      <div className="indicator-header">
        <div className="indicator-title">
          <span className="plus-icon">＋</span>
          <span>NEW INDICATOR</span>
        </div>
        <span className="close-x" onClick={() => setShowModal(false)}>✕</span>
      </div>
      {/* BODY */}
      <div className="indicator-body">

        {/* INDICATOR SECTION */}
        <div className="indicator-section">
          <h4>INDICATOR</h4>

{mainIndicators.map((main) => (
  <div key={main.id} className="main-card">

    <div className="main-header">

      {/* LEFT COLUMN */}
      <div className="main-left">

        {/* TITLE */}
        <input
          type="text"
          placeholder="Title here . . . ."
          value={main.title}
          onChange={(e) =>
            updateMainIndicator(main.id, "title", e.target.value)
          }
        />


        {/* DATE */}
        {main.fieldType === "date" && (
          <input
            type="date"
            className="date-field"
            onChange={(e) =>
              updateMainIndicator(main.id, "value", e.target.value)
            }
          />
        )}


        {/* MULTIPLE */}
        {main.fieldType === "multiple" && (
          <div className="multiple-wrapper">

            {main.choices.map((choice, index) => (

              <div key={index} className="choice-row">

                <input type="radio" disabled />

                <input
                  type="text"
                  placeholder="Enter choice"
                  value={choice}
                  onChange={(e) =>
                    updateMainChoice(main.id, index, e.target.value)
                  }
                />

                <button
                  type="button"
                  className="remove-choice-btn"
                  onClick={() => removeMainChoice(main.id, index)}
                >
                  ✕
                </button>

              </div>

            ))}


            <button
              type="button"
              className="add-choice-btn"
              onClick={() => addMainChoice(main.id)}
            >
              <input type="radio" disabled className="add-radio"/>
              <span>+ Add Option</span>
            </button>

          </div>
        )}


        {/* CHECKBOX */}
        {main.fieldType === "checkbox" && (

          <div className="multiple-wrapper">

            {main.choices.map((choice, index) => (

              <div key={index} className="choice-row">

                <input type="checkbox" disabled />

                <input
                  type="text"
                  placeholder="Enter choice"
                  value={choice}
                  onChange={(e) =>
                    updateMainChoice(main.id, index, e.target.value)
                  }
                />

                <button
                  type="button"
                  className="remove-choice-btn"
                  onClick={() => removeMainChoice(main.id, index)}
                >
                  ✕
                </button>
              </div>
            ))}


            <button
              type="button"
              className="add-choice-btn"
              onClick={() => addMainChoice(main.id)}
            >
              <input type="checkbox" disabled className="add-radio"/>
              <span>+ Add Option</span>
            </button>
          </div>
        )}


        {/* SHORT */}
        {main.fieldType === "short" && (
          <div className="short-wrapper">
            <textarea
              className="short-field"
              placeholder="Empty Field"
            />
          </div>
        )}

        {/* INTEGER */}
        {main.fieldType === "integer" && (
          <div className="integer-wrapper">
            <input
              type="number"
              className="integer-field"
              placeholder="Empty Field"
            />
          </div>
        )}
      </div>

      {/* RIGHT SELECT */}
      <select
        value={main.fieldType}
        onChange={(e) =>
          updateMainIndicator(main.id, "fieldType", e.target.value)
        }
      >

        <option value="" disabled hidden>
          Choose field
        </option>
        <option value="integer">
          Integer/Value
        </option>
        <option value="short">
          Short Answer
        </option>
        <option value="multiple">
          Multiple Choice
        </option>
        <option value="checkbox">
          Checkboxes
        </option>
        <option value="date">
          Date
        </option>
      </select>
    </div>
  </div>
))}
        </div>

        {/* main INDICATOR SECTION */}
        <div className="sub-section">
          <h4>SUB-INDICATOR/S</h4>

{subIndicators.map((sub) => (
  <div key={sub.id} className="sub-card">
    <div className="sub-header">

      {/* LEFT COLUMN */}
      <div className="sub-left">

        {/* Title */}
        <input
          type="text"
          placeholder="Title here . . . ."
          value={sub.title}
          onChange={(e) =>
            updateSubIndicator(sub.id, "title", e.target.value)
          }
        />

        {/* Dynamic Field Rendering */}
        {sub.fieldType === "date" && (
          <input
            type="date"
            className="date-field"
            onChange={(e) =>
              updateSubIndicator(sub.id, "value", e.target.value)
            }
          />
        )}

        {sub.fieldType === "multiple" && (
          <div className="multiple-wrapper">

            {sub.choices.map((choice, index) => (
              <div key={index} className="choice-row">
                <input type="radio" disabled />
                <input
                  type="text"
                  placeholder="Enter choice"
                  value={choice}
                  onChange={(e) =>
                    updateChoice(sub.id, index, e.target.value)
                  }
                />
                <button
                  type="button"
                  className="remove-choice-btn"
                  onClick={() => removeChoice(sub.id, index)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              className="add-choice-btn"
              onClick={() => addChoice(sub.id)}
            >
              <input type="radio" disabled className="add-radio" />
              <span>+ Add Option</span>
            </button>

          </div>
        )}

        {sub.fieldType === "checkbox" && (
          <div className="multiple-wrapper">
            {sub.choices.map((choice, index) => (
              <div key={index} className="choice-row">
                <input type="checkbox" disabled />
                <input
                  type="text"
                  placeholder="Enter choice"
                  value={choice}
                  onChange={(e) =>
                    updateChoice(sub.id, index, e.target.value)
                  }
                />
                <button
                  type="button"
                  className="remove-choice-btn"
                  onClick={() => removeChoice(sub.id, index)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              className="add-choice-btn"
              onClick={() => addChoice(sub.id)}
            >
              <input type="checkbox" disabled className="add-radio" />
              <span>+ Add Option</span>
            </button>

          </div>
        )}

        {sub.fieldType === "short" && (
          <div className="short-wrapper">
            <textarea
              className="short-field"
              placeholder="Empty Field"
            />
          </div>
        )}

        {sub.fieldType === "integer" && (
          <div className="integer-wrapper">
            <input
              type="number"
              className="integer-field"
              placeholder="Empty Field"
            />
          </div>
        )}

        <div className="verification">
          <strong>Mode of Verification:</strong>
        </div>
      </div>

      {/* RIGHT SIDE SELECT */}
      <select
        value={sub.fieldType}
        onChange={(e) =>
          updateSubIndicator(sub.id, "fieldType", e.target.value)
        }
      >
        <option value="" disabled hidden>
          Choose field
        </option>
        <option value="integer">Integer/Value</option>
        <option value="short">Short Answer</option>
        <option value="multiple">Multiple Choice</option>
        <option value="checkbox">Checkboxes</option>
        <option value="date">Date</option>
      </select>

    </div>
  </div>
))}
        </div>

        {/* FOOTER */}
        <div className="indicator-footer">
            <button className="new-sub-btn" onClick={addSubIndicator}>
              <span className="subplus-icon">＋</span>
              New Sub-Indicator
            </button>
          <button className="add-indicator-btn">
            ADD
          </button>
        </div>
      </div>
    </div>
  </div>
)}
            </div>
          </div>

          <div className="action-bar">
          <button className="savechanges-btn" onClick={() => setShowModal(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2
                2 0 0 0 2-2V7l-4-4zM12 19a3 3 0 1 1 0-6 3 3 0 0 1
                0 6zM6 8V5h9v3H6z"/>
            </svg>
            Save Changes
          </button>
          </div>

          {/* Table */}
<div className="encodetable-box">
  <div className="encodetable-header">
    <h3 className="table-title">
      Financial Administration and Sustainability
    </h3>
  </div>
  <button className="btn-new" onClick={() => setShowModal(true)}>
    <span style={{ fontSize: "20px", fontWeight: "bold" }}>＋</span>
    New Indicator
  </button>

  <div className="scrollable-content">

  </div>
</div>
        </div>
        </div>
    </div>
  );
}
