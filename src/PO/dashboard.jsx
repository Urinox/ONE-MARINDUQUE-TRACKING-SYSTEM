import React, { useState, useEffect } from "react";
import { db, auth} from "../firebase";
import "../PO-CSS/dashboard.css";
import dilgLogo from "../assets/dilg-po.png";
import dilgSeal from "../assets/dilg-ph.png";
import { FiFilter, FiRotateCcw, FiSettings, FiLogOut, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ref, push, onValue, set } from "firebase/database";



export default function Dashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const user = auth.currentUser;
  const displayName = user?.email || "User";
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
  name: "",
  email: displayName,
  image: ""
});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: displayName,
    image: ""
  });
  const [data, setData] = useState([]);

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
  if (!auth.currentUser) return;

  const yearsRef = ref(db, `years/${auth.currentUser.uid}`);

  onValue(yearsRef, (snapshot) => {
    if (snapshot.exists()) {
      setYears(snapshot.val());
    } else {
      // initialize default years once
      set(ref(db, `years/${auth.currentUser.uid}`), years);
    }
  });
}, []);
/*
useEffect(() => {
  const dataRef = ref(db, `financial/${auth.currentUser.uid}`);
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
*/


  const [newRecord, setNewRecord] = useState({
    year: "",
    municipality: ""
  });
  const [filters, setFilters] = useState({
    municipality: "",
    year: "",
    status: "",
  });


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



/*
const handleAddRecord = async () => {
  if (!newRecord.year || !newRecord.municipality) return alert("Please complete all fields.");

  const nextId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
  const today = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
  const newEntry = { id: nextId, lgu: "M", municipality: newRecord.municipality, year: newRecord.year, status: "Draft", submission: today, deadline: "-" };

  try {
    const newRef = push(ref(db, `financial/${auth.currentUser.uid}`)); // user-specific
    await set(newRef, newEntry); // Realtime Database push
    
    alert("Saved successfully!");
    setShowModal(false);
    setNewRecord({ year: "", municipality: "" });
  } catch (error) {
    console.error(error);
    alert("Write failed: " + error.message);
  }
};
*/  



  const handleExport = (item) => {
  console.log("Export:", item);
  };

  const handleView = (item) => {
    console.log("View:", item);
  };

  const handleCompletion = (item) => {
    console.log("Completion:", item);
  };


  const municipalities = ["Boac", "Mogpog", "Sta. Cruz", "Torrijos", "Buenavista", "Gasan"];
  const forms = ["LGU Profile", "Regional Assessment"];
  const [years, setYears] = useState(["2021","2022","2023","2024","2025","2026"]);
  
const handleAddYear = async () => {
  const newYear = prompt("Enter new year:");
  if (!newYear) return;

  if (years.includes(newYear)) {
    alert("Year already exists.");
    return;
  }

  const updatedYears = [...years, newYear].sort();
  setYears(updatedYears);

  if (auth.currentUser) {
    await set(ref(db, `years/${auth.currentUser.uid}`), updatedYears);
  }
};

const handleDeleteYear = async (yearToDelete) => {
  if (!window.confirm(`Delete year ${yearToDelete}?`)) return;

  const updatedYears = years.filter((y) => y !== yearToDelete);
  setYears(updatedYears);

  // Persist deletion in Firebase
  if (auth.currentUser) {
    await set(ref(db, `years/${auth.currentUser.uid}`), updatedYears);
  }

  // Reset selected value if deleted
  if (newRecord.year === yearToDelete) {
    setNewRecord({ ...newRecord, year: "" });
  }
};
  
  const statuses = ["Verified", "Draft", "Incomplete"];

  const updateFilter = (type, value) => {
    setFilters({ ...filters, [type]: value });
    setOpenDropdown(null);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      municipality: "",
      year: "",
      status: "",
    });
    setCurrentPage(1);
  };

  const filteredData = data.filter((item) => {
    return (
      (!filters.municipality || item.municipality === filters.municipality) &&
      (!filters.year || item.year === filters.year) &&
      (!filters.status || item.status === filters.status) &&
      (item.municipality.toLowerCase().includes(search.toLowerCase()) ||
        item.year.toLowerCase().includes(search.toLowerCase()))
    );
  });

  /* Pagination Logic */
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const renderDropdown = (type, list) => (
    <div className="dropdown">
      {list.map((item, i) => (
        <div key={i} className="dropdown-item" onClick={() => updateFilter(type, item)}>
          {item}
        </div>
      ))}
    </div>
  );

const handleSettings = () => {
  navigate("/settings");
};

const handleSignOut = () => {
  const confirmLogout = window.confirm("Are you sure you want to sign out?");
  if (confirmLogout) {
    navigate("/login");
  }
};

  return (
    <div className="dashboard-scale">
      <div className="dashboard">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-header">
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
              <p className="filter-title">
                <FiFilter style={{ marginRight: "10px", verticalAlign: "middle" }} />
                FILTER
                <button className="clear-icon-btn" onClick={clearFilters} aria-label="Clear Filters">
                <FiRotateCcw />
              </button>
              </p>
  
              {/* Dropdown Overlay */}
              {openDropdown && (
                <div
                  className="dropdown-overlay"
                  onClick={() => setOpenDropdown(null)}
                ></div>
              )}

              <div className="filter-item">
                <div
                  className="filter-btn"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "municipality" ? null : "municipality")
                  }
                >
                  Municipality {filters.municipality && `: ${filters.municipality}`}
                  <span className="arrow" style={{ pointerEvents: "none" }}>
                    {openDropdown === "municipality" ? "▲" : "▼"}
                  </span>
                </div>
                {openDropdown === "municipality" && renderDropdown("municipality", municipalities)}
              </div>

              <div className="filter-item">
                <div
                  className="filter-btn"
                  onClick={() => setOpenDropdown(openDropdown === "year" ? null : "year")}
                >
                  Year {filters.year && `: ${filters.year}`}
                  <span className="arrow" style={{ pointerEvents: "none" }}>
                    {openDropdown === "year" ? "▲" : "▼"}
                  </span>
                </div>
                {openDropdown === "year" && renderDropdown("year", years)}
              </div>

              <div className="filter-item">
                <div
                  className="filter-btn"
                  onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
                >
                  Status {filters.status && `: ${filters.status}`}
                  <span className="arrow" style={{ pointerEvents: "none" }}>
                    {openDropdown === "status" ? "▲" : "▼"}
                  </span>
                </div>
                {openDropdown === "status" && renderDropdown("status", statuses)}
              </div>
                <div className="sidebar-bottom">
                <button className="sidebar-btn settings-btn" onClick={handleSettings}>
                  <FiSettings style={{ marginRight: "8px", fontSize: "18px" }} />
                  Settings
                </button>

                <button className="sidebar-btn signout-btn" onClick={handleSignOut}>
                  <FiLogOut style={{ marginRight: "8px", fontSize: "18px" }} />
                  Sign Out
                </button>
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
                <h2>Provincial Assessment</h2>
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



            </div>
          </div>

<div className="action-bar">
  <button className="financial-btn" onClick={() => setShowModal(true)}>

    {/* Pencil Icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3
      17.25zm18-11.5a1.003 1.003 0 0 0 0-1.42l-2.34-2.34
      a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75
      1.84-1.82z"/>
    </svg>
    Create
  </button>
</div>

          {/* Table */}
          <div className="table-box">
            <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>LGU TYPE</th>
                  <th>MUNICIPALITY</th>
                  <th>YEAR</th>
                  <th>STATUS</th>
                  <th>Submission</th>
                  <th>Encoding Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.lgu}</td>
                    <td>{item.municipality}</td>
                    <td>{item.year}</td>
                    <td>
                      <span className={`status ${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.submission}</td>
                    <td>{item.deadline}</td>
                    <td className="actions">
                      <button className="btn export" onClick={() => handleExport(item)}>
                        Export
                      </button>
                      <button className="btn view" onClick={() => handleView(item)}>
                        View
                      </button>
                      <button className="btn completion" onClick={() => handleCompletion(item)}>
                        Completion
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            {/* Accurate Pagination like the image */}
            <div className="table-footer">
              {filteredData.length === 0 ? (
                "Showing 0–0 of 0 items"
              ) : (
                <>
                  Showing {indexOfFirstRow + 1}–
                  {Math.min(indexOfLastRow, filteredData.length)} of {filteredData.length} items
                </>
              )}
              <div className="page-buttons">
                {/* LEFT ARROW */}
                  <button
                    disabled={filteredData.length === 0 || currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                  ◀
                </button>

                {/* PAGE INPUT */}
                  <input
                    max={totalPages || 1}
                    value={filteredData.length === 0 ? 0 : currentPage}
                    disabled={filteredData.length === 0}
                    onChange={(e) => {
                      if (filteredData.length === 0) return;

                      let value = Number(e.target.value);

                      if (value < 1) value = 1;
                      if (value > totalPages) value = totalPages;

                      setCurrentPage(value);
                    }}
                    className="page-input"
                  />

                <span>of {totalPages}</span>

                {/* RIGHT ARROW */}
                  <button
                    disabled={filteredData.length === 0 || currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  >
                  ▶
                </button>
              </div>
            
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="add-record-modal">
              
              {/* Header */}
              <div className="modal-header">
                <div className="modal-title">
                  <FiFileText className="modal-icon" />
                <h3>ADD NEW RECORD</h3>
                </div>
                <span className="close-x" onClick={() => setShowModal(false)}>✕</span>
              </div>  
              

              {/* Body */}
              <div className="modal-body">
                {/* Year Dropdown */}
<div className="modal-field">
  <label>Year:</label>

  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <select
     style={{ width: "70%" }}
      value={newRecord.year}
      onChange={(e) =>
        setNewRecord({ ...newRecord, year: e.target.value })
      }
    >
      <option value="">Select Year</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>

    {/* Add Year */}
    <button
      type="button"
      onClick={handleAddYear}
      style={{
        background: "#081a4b",
        color: "#fff",
        border: "none",
        padding: "10px 10px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px"
      }}
    >
      + Add
    </button>

    {/* Delete Selected Year */}
    <button
      type="button"
      disabled={!newRecord.year}
      onClick={() => handleDeleteYear(newRecord.year)}
      style={{
        background: "transparent",
        color: "red",
        border: "1px solid red",
        padding: "10px 10px",
        borderRadius: "4px",
        cursor: newRecord.year ? "pointer" : "not-allowed",
        fontSize: "12px"
      }}
    >
      Remove
    </button>
  </div>
</div>

                {/* Footer Button */}
                <div className="modal-footer">
                  <button className="proceed-btn"
                    onClick={() => {
                    if (!newRecord.year) {
                      alert("Please select a year first.");
                      return;
                    }

  navigate("/financial-administration-and-sustainability", {
    state: { year: newRecord.year }
  });
}}>
                    Proceed ➜
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
}
