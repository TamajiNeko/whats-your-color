"use client";

import { useState, useEffect, useRef } from "react";

import studentsData from "../data/students.json";
import { bubbleConfig } from "../config/bubbleConfig";
import TicketVisual from "../components/TicketVisual";
import { toPng } from "html-to-image";

const defaultColors = [
  { eng: "red", hex: "#dc2626" },
  { eng: "yellow", hex: "#eab308" },
  { eng: "brown", hex: "#78350f" },
  { eng: "black", hex: "#1e293b" },
  { eng: "blue", hex: "#1d4ed8" },
  { eng: "pink", hex: "#db2777" },
  { eng: "orange", hex: "#ea580c" },
  { eng: "green", hex: "#15803d" },
  { eng: "sky_blue", hex: "#0284c7" },
  { eng: "purple", hex: "#a855f7" }
];

export default function Home() {
  const [studentId, setStudentId] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle");
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [defaultTheme, setDefaultTheme] = useState({ eng: "red", hex: "#dc2626" });
  const [isDownloading, setIsDownloading] = useState(false);
  const [ticketUrl, setTicketUrl] = useState("");
  const ticketRef = useRef(null);

  const randomizeDefaultTheme = () => {
    const randomIndex = Math.floor(Math.random() * defaultColors.length);
    setDefaultTheme(defaultColors[randomIndex]);
  };

  useEffect(() => {
    randomizeDefaultTheme();
  }, []);

  useEffect(() => {
    if (matchedStudent && typeof window !== "undefined") {
      setTicketUrl(`${window.location.origin}/ticket?id=${matchedStudent.studentId}`);
    }
  }, [matchedStudent]);

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const downloadTicket = async () => {
    if (isDownloading || !matchedStudent || !ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        style: { transform: 'none' }
      });
      const link = document.createElement("a");
      link.download = `ticket-${matchedStudent.studentId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= 10) {
      setStudentId(val);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    
    const trimmedId = studentId.trim();
    if (trimmedId.length !== 10) return;

    const student = studentsData.find(
      (s) => s.studentId === trimmedId
    );

    if (student) {
      setMatchedStudent(student);
      setSearchStatus("result");
      
      const templates = bubbleConfig[student.gender] || bubbleConfig.m;
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      setBubbleText(randomTemplate.replace("{color}", student.colorThai));
    } else {
      setMatchedStudent(null);
      setSearchStatus("not_found");
      setBubbleText("");
    }
  };

  const handleReset = () => {
    setStudentId("");
    setMatchedStudent(null);
    setSearchStatus("idle");
    setBubbleText("");
    randomizeDefaultTheme();
  };

  const getBgClass = () => {
    if (searchStatus === "result" && matchedStudent) {
      return `bg-theme-${matchedStudent.colorEng}`;
    }
    return `bg-theme-${defaultTheme.eng}`;
  };

  const getThemeStyles = () => {
    const color = (searchStatus === "result" && matchedStudent)
      ? matchedStudent.colorHex
      : defaultTheme.hex;

    return {
      "--theme-primary": color,
      "--theme-shadow-color": `${color}26`,
      "--theme-gradient": `linear-gradient(135deg, ${color}dd 0%, ${color}ff 100%)`,
      "--theme-shadow-btn": `${color}40`,
      "--theme-shadow-btn-hover": `${color}59`,
      "--theme-bubble-bg": color,
      "--theme-shadow-bubble": `${color}4d`,
    };
  };

  return (
    <div className={`transition-all duration-700 ease-in-out main-layout min-h-screen ${getBgClass()}`} style={getThemeStyles()}>
      <div className={`toast ${toastVisible ? "show" : ""}`}>
        {toastMessage}
      </div>

      <div className="card-wrapper">
          {searchStatus === "idle" && (
            <form onSubmit={handleSearch} className="animate-fade-in" id="search-section">
              <h2>น้องอยู่สีอะไร?</h2>
              <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem", fontWeight: 500 }}>
                กรอกรหัสนักศึกษาของน้อง เพื่อตรวจสอบสี
              </p>
              
              <div className="input-group">
                <input
                  type="text"
                  id="inputId"
                  placeholder="กรอกรหัสนักศึกษา 10 หลัก..."
                  value={studentId}
                  onChange={handleInputChange}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                ค้นหาสีของน้อง
              </button>
            </form>
          )}

          {searchStatus === "result" && matchedStudent && (
            <div className="animate-fade-in" id="result-section">
              <div className="profile-card">
                <div className="avatar-wrapper">
                  <img
                    src={matchedStudent.profilePic}
                    className="profile-pic"
                  />
                  <div className="speech-bubble">
                    {bubbleText}
                  </div>
                </div>
                <h3 className="user-name">
                  <span className="name-block">{matchedStudent.title}{matchedStudent.firstName}</span>
                  {" "}
                  <span className="name-block">{matchedStudent.lastName}</span>
                </h3>
                <p className="user-id">รหัสนักศึกษา: {matchedStudent.studentId}</p>
              </div>


              <div className="action-buttons" style={{ flexDirection: "column", gap: "0.75rem" }}>
                <button
                  onClick={downloadTicket}
                  disabled={isDownloading}
                  className="btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    opacity: isDownloading ? 0.7 : 1,
                    cursor: isDownloading ? "not-allowed" : "pointer",
                  }}
                >
                  {isDownloading ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      กำลังดาวน์โหลด...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      ดาวโหลดตั๋ว
                    </>
                  )}
                </button>
                <button className="btn-theme-outline" onClick={handleReset}>
                  ค้นหาอีกครั้ง
                </button>
              </div>
            </div>
          )}

          {/* Hidden TicketVisual for html-to-image capture */}
          {searchStatus === "result" && matchedStudent && (
            <div style={{ position: "absolute", left: "-9999px", top: 0, pointerEvents: "none" }}>
              <div 
                ref={ticketRef} 
                style={{ 
                  display: "inline-block", 
                  width: "fit-content",
                  padding: "0", // removed padding to prevent extra space around the ticket
                  backgroundColor: "transparent" 
                }}
              >
                <div style={{ width: typeof window !== 'undefined' && window.innerWidth >= 640 ? "800px" : (typeof window !== 'undefined' ? `${Math.min(window.innerWidth - 32, 420)}px` : "100%") }}>
                  <TicketVisual student={matchedStudent} ticketUrl={ticketUrl} style={{ margin: 0 }} />
                </div>
              </div>
            </div>
          )}

          {searchStatus === "not_found" && (
            <div className="animate-fade-in" id="not-found-section">
              <div className="profile-card" style={{ padding: "3rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <h3 className="user-name" style={{ color: "#ef4444" }}>
                  ไม่พบข้อมูลสีของน้อง
                </h3>
                <p className="user-id" style={{ marginTop: "0.5rem" }}>
                  รหัสนักศึกษา: {studentId}
                </p>
                <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "1rem", lineHeight: 1.5 }}>
                  รหัสนักศึกษาน้องถูกหรือเปล่าคะดูดีๆนะ
                </p>
              </div>

              <div className="action-buttons">
                <button className="btn-primary" style={{ background: "#475569" }} onClick={handleReset}>
                  ค้นหาใหม่
                </button>
              </div>
            </div>
          )}
        </div>

      <div className="copyright">
        &copy; {new Date().getFullYear()}{" "}
        <a href="https://www.instagram.com/neko_0739" target="_blank" rel="noopener noreferrer">
          Neko
        </a>
        {" & "}
        <a href="https://www.instagram.com/zero_wa_o" target="_blank" rel="noopener noreferrer">
          Zero
        </a>
        <span> to Nong 69 ♡</span>
      </div>
    </div>
  );
}
