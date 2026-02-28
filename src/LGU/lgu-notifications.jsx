import React, { useState, useEffect } from "react";
import { db, auth} from "src/firebase";
import styles from "src/LGU-CSS/lgu-notification.module.css";
import dilgLogo from "src/assets/dilg-po.png";
import dilgSeal from "src/assets/dilg-ph.png";
import { FiFilter,FiTrash2 , FiRotateCcw, FiSettings, FiLogOut, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ref, push, onValue, set, get } from "firebase/database";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function LGU() {
  const navigate = useNavigate();
  const [userAnswers, setUserAnswers] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [lastSavedDraft, setLastSavedDraft] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [allCategoriesData, setAllCategoriesData] = useState({
    financial: [],
    disaster: [],
    social: [],
    health: [],
    education: [],
    safety: [],
    environmental: [],
    youth: [],
    tourism: []
  });
  const [selectedYearDisplay, setSelectedYearDisplay] = useState("");
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
  const [userRole, setUserRole] = useState("user");
  const [attachments, setAttachments] = useState({});
  const [uploadingFile, setUploadingFile] = useState(false);
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


// Replace your current years useEffect with this debug version:
useEffect(() => {
  if (!auth.currentUser) return;

  const fetchYears = async () => {
    try {
      console.log("Fetching years...");
      
      // First, try to find an admin
      const profilesRef = ref(db, "profiles");
      const profilesSnapshot = await get(profilesRef);
      
      if (profilesSnapshot.exists()) {
        const profiles = profilesSnapshot.val();
        console.log("Profiles found:", profiles);
        
        // Try to find an admin first
        let targetUid = Object.keys(profiles).find(
          uid => profiles[uid]?.role === "admin"
        );
        
        // If no admin found, just use the first user that has years data
        if (!targetUid) {
          console.log("No admin found, checking for any user with years...");
          
          // Get all years nodes to see which users have years
          const yearsRootRef = ref(db, "years");
          const yearsRootSnapshot = await get(yearsRootRef);
          
          if (yearsRootSnapshot.exists()) {
            const yearsData = yearsRootSnapshot.val();
            console.log("Years root data:", yearsData);
            
            // Get the first UID that has years data
            targetUid = Object.keys(yearsData).find(uid => 
              yearsData[uid] && Object.keys(yearsData[uid]).length > 0
            );
            
            if (targetUid) {
              console.log("Found user with years:", targetUid);
            }
          }
        }
        
        if (targetUid) {
          console.log("Using UID:", targetUid);
          
          // Get years from that user's node
          const yearsRef = ref(db, `years/${targetUid}`);
          
          onValue(yearsRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              console.log("Raw years data from Firebase:", data);
              
              // Handle different data structures
              let yearsArray = [];
              
              if (Array.isArray(data)) {
                // If data is an array like ["2021", "2022", "2023"]
                yearsArray = data;
                console.log("Data is array:", yearsArray);
              } 
              else if (typeof data === "object" && data !== null) {
                // If data is an object like {2021: {...}, 2022: {...}}
                yearsArray = Object.keys(data);
                console.log("Data is object, keys:", yearsArray);
              }
              
              console.log("Final years array to display:", yearsArray);
              setYears(yearsArray);
            } else {
              console.log("No years data found for this user");
              setYears([]);
            }
          });
        } else {
          console.log("No target UID found");
          setYears([]);
        }
      }
    } catch (error) {
      console.error("Error fetching years:", error);
      setYears([]);
    }
  };

  fetchYears();
}, []);


// Add state for indicators
const [indicators, setIndicators] = useState([]);


// Fetch indicators from Firebase
useEffect(() => {
  if (!auth.currentUser || !selectedYearDisplay) return;

  // First, find the admin UID (same logic as years)
  const fetchIndicators = async () => {
    try {
      // Get all profiles to find admin
      const profilesRef = ref(db, "profiles");
      const profilesSnapshot = await get(profilesRef);
      
      if (profilesSnapshot.exists()) {
        const profiles = profilesSnapshot.val();
        
        // Find admin UID (same logic as your years fetch)
        let adminUid = Object.keys(profiles).find(
          uid => profiles[uid]?.role === "admin"
        );
        
        if (!adminUid) {
          // If no admin found, try to find any user with financial data
          const financialRootRef = ref(db, "financial");
          const financialRootSnapshot = await get(financialRootRef);
          
          if (financialRootSnapshot.exists()) {
            const financialData = financialRootSnapshot.val();
            adminUid = Object.keys(financialData).find(uid => 
              financialData[uid] && financialData[uid][selectedYearDisplay]
            );
          }
        }
        
        if (adminUid) {
          console.log("Using admin UID for indicators:", adminUid);
          
          // Reference to the financial indicators for the selected year and category
          const indicatorsRef = ref(
            db, 
            `financial/${adminUid}/${selectedYearDisplay}/financial-administration-and-sustainability/assessment`
          );
          
          onValue(indicatorsRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              console.log("Indicators data:", data);
              
              // Convert object to array with keys
              const indicatorsArray = Object.keys(data).map(key => ({
                firebaseKey: key,
                ...data[key]
              }));
              
              setIndicators(indicatorsArray);
            } else {
              console.log("No indicators found for this year");
              setIndicators([]);
            }
          });
        } else {
          console.log("No admin UID found");
          setIndicators([]);
        }
      }
    } catch (error) {
      console.error("Error fetching indicators:", error);
      setIndicators([]);
    }
  };

  fetchIndicators();
}, [selectedYearDisplay]);


// Handle answer changes
const handleAnswerChange = (indicatorKey, mainIndex, field, value) => {
  setUserAnswers(prev => ({
    ...prev,
    [`${indicatorKey}_${mainIndex}_${field}`]: {
      indicatorKey,
      mainIndex,
      field,
      value,
      timestamp: Date.now()
    }
  }));
};

// Save answers to Firebase using user's name
const handleSaveAnswers = async () => {
  if (!auth.currentUser || !selectedYearDisplay || hasSubmitted) return; // Prevent multiple submissions
  
  setSavingAnswers(true);
  
  try {
    // Get user's display name
    const userName = profileData.name || auth.currentUser.email || "Anonymous";
    // Clean the name to be Firebase-compatible (replace dots, etc.)
    const cleanName = userName.replace(/[.#$\[\]]/g, '_');
    
    // Find admin UID first
    const profilesRef = ref(db, "profiles");
    const profilesSnapshot = await get(profilesRef);
    
    if (profilesSnapshot.exists()) {
      const profiles = profilesSnapshot.val();
      let adminUid = Object.keys(profiles).find(
        uid => profiles[uid]?.role === "admin"
      );
      
      if (!adminUid) {
        const financialRootRef = ref(db, "financial");
        const financialRootSnapshot = await get(financialRootRef);
        
        if (financialRootSnapshot.exists()) {
          const financialData = financialRootSnapshot.val();
          adminUid = Object.keys(financialData).find(uid => 
            financialData[uid] && financialData[uid][selectedYearDisplay]
          );
        }
      }
      
      if (adminUid) {
        // Save user answers using user's NAME instead of UID
        const answersRef = ref(
          db,
          `answers/${selectedYearDisplay}/LGU/${cleanName}`
        );
        
        // Also save the user's UID for reference
        const answerData = {
          ...userAnswers,
          _metadata: {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            lastSaved: Date.now(),
            submitted: true
          }
        };
        
        await set(answersRef, answerData);
        
        // ===== SAVE ATTACHMENTS TO FIREBASE =====
        if (Object.keys(attachments).length > 0) {
          const attachmentsRef = ref(
            db,
            `attachments/${selectedYearDisplay}/LGU/${cleanName}`
          );
          await set(attachmentsRef, attachments);
          console.log("Attachments saved to Firebase");
        }
        
        setHasSubmitted(true); // Mark as submitted
        clearDraft(); // Clear localStorage draft
        alert("Answers and attachments submitted successfully!");
      }
    }
  } catch (error) {
    console.error("Error submitting answers:", error);
    alert("Failed to submit answers: " + error.message);
  } finally {
    setSavingAnswers(false);
  }
};

// Export Financial, Administrative and Sustainability as PDF
const exportFinancialPDF = async () => {
  if (!selectedYearDisplay) {
    alert("Please select a year first");
    return;
  }

  try {
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add header with logos (if needed)
    // You can add your DILG logos here if you want
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(26, 42, 108); // #1a2a6c
    doc.text("Financial Administration and Sustainability", pageWidth / 2, 20, { align: 'center' });
    
    // Year
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Year: ${selectedYearDisplay}`, pageWidth / 2, 30, { align: 'center' });
    
    // User info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Prepared by: ${profileData.name || auth.currentUser?.email || "User"}`, 14, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 45);
    
    let yPosition = 55;
    let rowCount = 0;
    
    // Loop through indicators
    for (const record of indicators) {
      // Main Indicators
      if (record.mainIndicators && record.mainIndicators.length > 0) {
        for (const main of record.mainIndicators) {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Main indicator title
          doc.setFontSize(12);
          doc.setTextColor(26, 42, 108);
          doc.setFont(undefined, 'bold');
          doc.text(main.title, 14, yPosition);
          yPosition += 7;
          
          // Get user's answer for this indicator
          const answerKey = `${record.firebaseKey}_${record.mainIndicators.indexOf(main)}_${main.title}`;
          const answer = userAnswers[answerKey];
          
          // Answer
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          
          let answerText = "";
          if (main.fieldType === "multiple" || main.fieldType === "checkbox") {
            if (answer) {
              answerText = `Answer: ${answer.value}`;
            } else {
              answerText = "Answer: Not answered";
            }
          } else {
            answerText = `Answer: ${answer?.value || "Not answered"}`;
          }
          
          doc.text(answerText, 20, yPosition);
          yPosition += 6;
          
          // Mode of Verification
          if (main.verification) {
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text(`Mode of Verification: ${main.verification}`, 20, yPosition);
            yPosition += 8;
          } else {
            yPosition += 4;
          }
          
          rowCount++;
        }
      }
      
      // Sub Indicators
      if (record.subIndicators && record.subIndicators.length > 0) {
        for (const sub of record.subIndicators) {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Sub indicator title (indented)
          doc.setFontSize(11);
          doc.setTextColor(80, 80, 80);
          doc.setFont(undefined, 'italic');
          doc.text(`• ${sub.title}`, 20, yPosition);
          yPosition += 6;
          
          // Get user's answer for this sub indicator
          const answerKey = `${record.firebaseKey}_sub_${record.subIndicators.indexOf(sub)}_${sub.title}`;
          const answer = userAnswers[answerKey];
          
          // Answer (further indented)
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          
          let answerText = "";
          if (sub.fieldType === "multiple" || sub.fieldType === "checkbox") {
            if (answer) {
              answerText = `  Answer: ${answer.value}`;
            } else {
              answerText = "  Answer: Not answered";
            }
          } else {
            answerText = `  Answer: ${answer?.value || "Not answered"}`;
          }
          
          doc.text(answerText, 25, yPosition);
          yPosition += 5;
          
          // Mode of Verification for sub indicators
          if (sub.verification) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`  Mode of Verification: ${sub.verification}`, 25, yPosition);
            yPosition += 6;
          } else {
            yPosition += 2;
          }
          
          rowCount++;
        }
      }
      
      // Add separator between records
      if (yPosition < 270) {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPosition, pageWidth - 14, yPosition);
        yPosition += 10;
      }
    }
    
    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} - Financial Administration and Sustainability Assessment ${selectedYearDisplay}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`Financial_Assessment_${selectedYearDisplay}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF");
  }
};



// Export All Areas PDF (all tabs)
const exportAllAreasPDF = async () => {
  if (!selectedYearDisplay) {
    alert("Please select a year first");
    return;
  }

  try {
    // Show loading message
    alert("Generating comprehensive report... This may take a moment.");
    
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // ===== COVER PAGE =====
    doc.setFontSize(24);
    doc.setTextColor(26, 42, 108); // #1a2a6c
    doc.text("Comprehensive LGU Assessment Report", pageWidth / 2, 60, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(`Year: ${selectedYearDisplay}`, pageWidth / 2, 80, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Prepared by: ${profileData.name || auth.currentUser?.email || "User"}`, pageWidth / 2, 100, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 110, { align: 'center' });
    
    // Add DILG logos or other branding if desired
    
    doc.addPage();
    
    // ===== FUNCTION TO EXPORT A CATEGORY =====
    const exportCategory = async (categoryData, categoryTitle, startY) => {
      let yPosition = startY;
      
      // Category Title
      doc.setFontSize(16);
      doc.setTextColor(26, 42, 108);
      doc.setFont(undefined, 'bold');
      doc.text(categoryTitle, 14, yPosition);
      yPosition += 10;
      
      if (!categoryData || categoryData.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.setFont(undefined, 'italic');
        doc.text("No indicators available for this category", 20, yPosition);
        yPosition += 15;
        return yPosition;
      }
      
      // Loop through records in this category
      for (const record of categoryData) {
        // Main Indicators
        if (record.mainIndicators && record.mainIndicators.length > 0) {
          for (const main of record.mainIndicators) {
            // Check if we need a new page
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Main indicator title
            doc.setFontSize(12);
            doc.setTextColor(26, 42, 108);
            doc.setFont(undefined, 'bold');
            doc.text(main.title, 14, yPosition);
            yPosition += 7;
            
            // Get user's answer for this indicator
            const answerKey = `${record.firebaseKey}_${record.mainIndicators.indexOf(main)}_${main.title}`;
            const answer = userAnswers[answerKey];
            
            // Answer
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            
            let answerText = "";
            if (main.fieldType === "multiple" || main.fieldType === "checkbox") {
              if (answer) {
                answerText = `Answer: ${answer.value}`;
              } else {
                answerText = "Answer: Not answered";
              }
            } else {
              answerText = `Answer: ${answer?.value || "Not answered"}`;
            }
            
            doc.text(answerText, 20, yPosition);
            yPosition += 6;
            
            // Mode of Verification
            if (main.verification) {
              doc.setFontSize(10);
              doc.setTextColor(80, 80, 80);
              doc.text(`Mode of Verification: ${main.verification}`, 20, yPosition);
              yPosition += 8;
            } else {
              yPosition += 4;
            }
          }
        }
        
        // Sub Indicators
        if (record.subIndicators && record.subIndicators.length > 0) {
          for (const sub of record.subIndicators) {
            // Check if we need a new page
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Sub indicator title (indented)
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            doc.setFont(undefined, 'italic');
            doc.text(`• ${sub.title}`, 20, yPosition);
            yPosition += 6;
            
            // Get user's answer for this sub indicator
            const answerKey = `${record.firebaseKey}_sub_${record.subIndicators.indexOf(sub)}_${sub.title}`;
            const answer = userAnswers[answerKey];
            
            // Answer (further indented)
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            
            let answerText = "";
            if (sub.fieldType === "multiple" || sub.fieldType === "checkbox") {
              if (answer) {
                answerText = `  Answer: ${answer.value}`;
              } else {
                answerText = "  Answer: Not answered";
              }
            } else {
              answerText = `  Answer: ${answer?.value || "Not answered"}`;
            }
            
            doc.text(answerText, 25, yPosition);
            yPosition += 5;
            
            // Mode of Verification for sub indicators
            if (sub.verification) {
              doc.setFontSize(9);
              doc.setTextColor(100, 100, 100);
              doc.text(`  Mode of Verification: ${sub.verification}`, 25, yPosition);
              yPosition += 6;
            } else {
              yPosition += 2;
            }
          }
        }
        
        // Add separator between records
        if (yPosition < 270) {
          doc.setDrawColor(200, 200, 200);
          doc.line(14, yPosition, pageWidth - 14, yPosition);
          yPosition += 10;
        }
      }
      
      return yPosition;
    };
    
    // ===== EXPORT EACH CATEGORY =====
    let currentY = 20;
    
    // Financial Administration and Sustainability
    if (indicators && indicators.length > 0) {
      currentY = await exportCategory(indicators, "Financial Administration and Sustainability", currentY);
    } else {
      currentY = await exportCategory([], "Financial Administration and Sustainability", currentY);
    }
    
    // Add page break between categories
    doc.addPage();
    currentY = 20;
    
    // Disaster Preparedness
    // Note: You need to fetch data for each category similarly
    // For now, we'll show placeholder
    doc.setFontSize(16);
    doc.setTextColor(26, 42, 108);
    doc.setFont(undefined, 'bold');
    doc.text("Disaster Preparedness", 14, currentY);
    currentY += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.setFont(undefined, 'italic');
    doc.text("Data for this category will be available soon", 20, currentY);
    currentY += 20;
    
    doc.addPage();
    currentY = 20;
    
    // Social Protection and Sensitivity
    doc.setFontSize(16);
    doc.setTextColor(26, 42, 108);
    doc.setFont(undefined, 'bold');
    doc.text("Social Protection and Sensitivity", 14, currentY);
    currentY += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.setFont(undefined, 'italic');
    doc.text("Data for this category will be available soon", 20, currentY);
    currentY += 20;
    
    // Continue for all 9 categories...
    // You'll need to fetch actual data for each tab
    
    // ===== ADD TABLE OF CONTENTS =====
    // Add table of contents at the beginning (after cover)
    const totalPages = doc.internal.getNumberOfPages();
    
    // Add page numbers and footers
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Skip footer on cover page (page 1)
      if (i > 1) {
        doc.text(
          `Page ${i-1} of ${totalPages-1} - Provincial Assessment ${selectedYearDisplay}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    }
    
    // Save the PDF
    doc.save(`Provincial_Assessment_${selectedYearDisplay}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    
    alert("Comprehensive report generated successfully!");
    
  } catch (error) {
    console.error("Error generating comprehensive PDF:", error);
    alert("Failed to generate comprehensive report: " + error.message);
  }
};

// Load user's previous answers using user's name
const loadUserAnswers = async () => {
  if (!auth.currentUser || !selectedYearDisplay) return;
  
  try {
    // Get user's display name
    const userName = profileData.name || auth.currentUser.email || "Anonymous";
    const cleanName = userName.replace(/[.#$\[\]]/g, '_');
    
    // Find admin UID
    const profilesRef = ref(db, "profiles");
    const profilesSnapshot = await get(profilesRef);
    
    if (profilesSnapshot.exists()) {
      const profiles = profilesSnapshot.val();
      let adminUid = Object.keys(profiles).find(
        uid => profiles[uid]?.role === "admin"
      );
      
      if (!adminUid) {
        const financialRootRef = ref(db, "financial");
        const financialRootSnapshot = await get(financialRootRef);
        
        if (financialRootSnapshot.exists()) {
          const financialData = financialRootSnapshot.val();
          adminUid = Object.keys(financialData).find(uid => 
            financialData[uid] && financialData[uid][selectedYearDisplay]
          );
        }
      }
      
      if (adminUid) {
        // Load answers using user's NAME
        const answersRef = ref(
          db,
          `answers/${selectedYearDisplay}/LGU/${cleanName}`
        );
        
        const snapshot = await get(answersRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const { _metadata, ...answers } = data;
          
          // Set answers first
          setUserAnswers(answers || {});
          
          // Then set submission status
          if (_metadata && _metadata.submitted === true) {
            setHasSubmitted(true);
            console.log("Found submitted answers");
          } else {
            setHasSubmitted(false);
            console.log("Found draft answers in Firebase");
          }
        } else {
          // No answers in Firebase
          setUserAnswers({});
          setHasSubmitted(false);
          console.log("No answers in Firebase");
        }
        
        // ===== LOAD ATTACHMENTS FROM FIREBASE =====
        const attachmentsRef = ref(
          db,
          `attachments/${selectedYearDisplay}/LGU/${cleanName}`
        );
        const attachmentsSnapshot = await get(attachmentsRef);
        
        if (attachmentsSnapshot.exists()) {
          setAttachments(attachmentsSnapshot.val());
          console.log("Attachments loaded from Firebase");
        } else {
          setAttachments({});
        }
      }
    }
  } catch (error) {
    console.error("Error loading answers:", error);
    setHasSubmitted(false);
  }
};

// Handle file upload for verification (supports multiple files)
const handleFileUpload = async (indicatorKey, mainIndex, field, file) => {
  if (!file) return;
  
  setUploadingFile(true);
  
  try {
    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const attachmentData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: reader.result, // base64 data
        uploadedAt: Date.now(),
        indicatorKey,
        mainIndex,
        field
      };
      
      // Generate a unique key for each file using timestamp
      const uniqueKey = `${indicatorKey}_${mainIndex}_${field}_${Date.now()}`;
      
      setAttachments(prev => ({
        ...prev,
        [uniqueKey]: attachmentData
      }));
      
      alert(`File "${file.name}" attached successfully!`);
      setUploadingFile(false);
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Error uploading file:", error);
    alert("Failed to upload file");
    setUploadingFile(false);
  }
};

// Trigger file input click
const triggerFileUpload = (indicatorKey, mainIndex, field) => {
  // Create hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
  fileInput.onchange = (e) => {
    if (e.target.files[0]) {
      handleFileUpload(indicatorKey, mainIndex, field, e.target.files[0]);
    }
  };
  fileInput.click();
};

// Remove attachment
const removeAttachment = (attachmentKey) => {
  if (window.confirm("Remove this attachment?")) {
    setAttachments(prev => {
      const newAttachments = { ...prev };
      delete newAttachments[attachmentKey];
      return newAttachments;
    });
  }
};

// Load answers when year changes
    useEffect(() => {
      const loadData = async () => {
        if (selectedYearDisplay) {
          // First check if already submitted from Firebase
          await loadUserAnswers();
        }
      };
      
      loadData();
    }, [selectedYearDisplay]); // Remove hasSubmitted from dependencies

    // Separate useEffect for loading draft after hasSubmitted is updated
    useEffect(() => {
      if (selectedYearDisplay && !hasSubmitted) {
        loadDraft();
      }
    }, [selectedYearDisplay, hasSubmitted]); // Now depends on hasSubmitted



  const [newRecord, setNewRecord] = useState({
    year: "",
    municipality: ""
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

const [years, setYears] = useState([]);



// Save draft to localStorage (not Firebase)
const handleSaveDraft = () => {
  if (!auth.currentUser || !selectedYearDisplay) return;
  
  try {
    // Create draft data
    const draftData = {
      answers: userAnswers,
      attachments: attachments, // Include attachments in draft
      year: selectedYearDisplay,
      userId: auth.currentUser.uid,
      userName: profileData.name || auth.currentUser.email || "Anonymous",
      lastUpdated: Date.now()
    };
    
    // Save to localStorage
    localStorage.setItem(
      `draft_${auth.currentUser.uid}_${selectedYearDisplay}`,
      JSON.stringify(draftData)
    );
    
    setIsDraft(true);
    setLastSavedDraft(new Date().toLocaleTimeString());
    
    // Show success message
    console.log("Draft saved locally with", Object.keys(attachments).length, "attachments");
    alert("Draft saved successfully!"); 
  } catch (error) {
    console.error("Error saving draft:", error);
    alert("Failed to save draft");
  }
};

// Load draft from localStorage
const loadDraft = () => {
  if (!auth.currentUser || !selectedYearDisplay) return;
  
  try {
    const savedDraft = localStorage.getItem(
      `draft_${auth.currentUser.uid}_${selectedYearDisplay}`
    );
    
    if (savedDraft) {
      const draftData = JSON.parse(savedDraft);
      console.log("Draft found for year:", selectedYearDisplay);
      
      // Load answers
      setUserAnswers(draftData.answers || {});
      
      // Load attachments if they exist in draft
      if (draftData.attachments) {
        setAttachments(draftData.attachments);
        console.log("Attachments loaded from draft:", Object.keys(draftData.attachments).length);
      }
      
      setIsDraft(true);
      setLastSavedDraft(new Date(draftData.lastUpdated).toLocaleTimeString());
    } else {
      console.log("No draft found for year:", selectedYearDisplay);
      setIsDraft(false);
    }
  } catch (error) {
    console.error("Error loading draft:", error);
  }
};

// Clear draft after successful submission
const clearDraft = () => {
  if (!auth.currentUser || !selectedYearDisplay) return;
  localStorage.removeItem(`draft_${auth.currentUser.uid}_${selectedYearDisplay}`);
  setIsDraft(false);
  // Don't clear attachments here - they're now in Firebase
};

// Load answers when year changes
// Load data when year changes - SINGLE SOURCE OF TRUTH
useEffect(() => {
  const loadDataForYear = async () => {
    if (!selectedYearDisplay) return;
    
    console.log("Loading data for year:", selectedYearDisplay);
    
    // Step 1: Load from Firebase (submitted answers)
    await loadUserAnswers();
    
    // Step 2: After we know submission status, load draft if not submitted
    // We need to wait a tiny bit for hasSubmitted to update from loadUserAnswers
    setTimeout(() => {
      if (!hasSubmitted) {
        console.log("No submission found, loading draft...");
        loadDraft();
      } else {
        console.log("Submission found, not loading draft");
      }
    }, 100);
  };
  
  loadDataForYear();
}, [selectedYearDisplay]); // Only depend on year change


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
            {openDropdown && (
              <div
                className="dropdown-overlay"
                onClick={() => setOpenDropdown(null)}
              ></div>
            )}
            <div className={styles.sidebarMenu}>
              <button
                className={styles.sidebarMenuItem}
                onClick={() => navigate("/lgu-assessment")}
              >
                <span className={styles.menuIcon}>📋</span>
                Assessment
              </button>

              <button
                className={`${styles.sidebarMenuItem} ${styles.active}`}
                onClick={() => navigate("/lgu-notification")}
              >
                <span className={styles.menuIcon}>🔔</span>
                Notification
              </button>
            </div>

            <div className={styles.sidebarBottom}>
              <button 
                className={`${styles.sidebarBtn} ${styles.settingsBtn}`} 
                onClick={handleSettings}
              >
                <FiSettings style={{ marginRight: "8px", fontSize: "18px" }} />
                Settings
              </button>

              <button 
                className={`${styles.sidebarBtn} ${styles.signoutBtn}`} 
                onClick={handleSignOut}
              >
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
          <div className="topbarLeft">
            <div className="topbarLeft">
            <h2>Notification {selectedYearDisplay && (<span style={{ fontSize: "24px", fontWeight: "bold", color: "#000000" }}>
                  {selectedYearDisplay}</span>
                )}
                </h2>

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
          </div>
        </div>

        {/* Assessment Content */}
        <div className={styles.assessmentContainer}>

{/* Form Section */}
<div className="lgunottable-box">
  <div className="scrollable-content">
    {/* Notification Table */}
    <div style={{ 
      backgroundColor: "white", 
      borderRadius: "8px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      overflow: "auto"
    }}>
      <table style={{ 
        width: "100%", 
        borderCollapse: "collapse", 
        fontSize: "14px",
        height:"10px"
      }}>
        <thead>
          <tr style={{ backgroundColor: "#0c1a4b", color: "white"}}>
            <th style={{ padding: "8px", textAlign: "left", width: "5%" }}>No.</th>
            <th style={{ padding: "8px", textAlign: "left", width: "35%" }}>Notification</th>
            <th style={{ padding: "8px", textAlign: "left", width: "45%" }}>Message</th>
            <th style={{ padding: "8px", textAlign: "left", width: "15%" }}>Date</th>
          </tr>
        </thead>
        
        <tbody>



        </tbody>
      </table>
    </div>
  </div>
</div>


        </div>
      </div>

      {/* Modals */}
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
                  setEditProfileData(profileData);
                  setShowEditProfileModal(false);
                }}
              >
                ✕
              </span>
            </div>
            <div className="modal-body">
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
);
}