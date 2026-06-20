"use client";

import { useState, useEffect, useRef } from "react";
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
  const [studentsData, setStudentsData] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle");
  const [isSearching, setIsSearching] = useState(false);
  const [matchedStudent, setMatchedStudent] = useState(null);

  const [bubbleText, setBubbleText] = useState("");
  const [defaultTheme, setDefaultTheme] = useState({ eng: "red", hex: "#dc2626" });
  const [isDownloading, setIsDownloading] = useState(false);
  const [ticketUrl, setTicketUrl] = useState("");
  const ticketRef = useRef(null);

  useEffect(() => {
    fetch(`/api/students?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setStudentsData(data);
        setIsDataLoading(false);
      })
      .catch(err => {
        console.error("Failed to load students:", err);
        setIsDataLoading(false);
      });
  }, []);

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



  const convertToBase64 = async (url, targetSize = 150) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");
          
          ctx.clearRect(0, 0, targetSize, targetSize);
          
          const wrh = img.width / img.height;
          let newWidth = targetSize;
          let newHeight = targetSize;
          let x = 0;
          let y = 0;
          
          if (wrh > 1) {
            newHeight = targetSize / wrh;
            y = (targetSize - newHeight) / 2;
          } else {
            newWidth = targetSize * wrh;
            x = (targetSize - newWidth) / 2;
          }
          
          ctx.drawImage(img, x, y, newWidth, newHeight);
          
          const base64 = canvas.toDataURL("image/png");
          resolve(base64);
        } catch (err) {
          console.error("Failed to resize image in canvas:", err);
          resolve(url);
        }
      };
      img.onerror = () => {
        resolve(url);
      };
      img.src = url;
    });
  };

  const downloadTicket = async () => {
    if (isDownloading || !matchedStudent || !ticketRef.current) return;
    setIsDownloading(true);
    try {
      await toPng(ticketRef.current, { cacheBust: true });
      
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

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    const trimmedId = studentId.trim();
    if (trimmedId.length !== 10) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/students?id=${trimmedId}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Search request failed");
      const student = await res.json();

      if (student) {
        const base64Pic = await convertToBase64(student.profilePic);
        setMatchedStudent({ ...student, profilePic: base64Pic });
        setSearchStatus("result");
        
        const templates = bubbleConfig[student.gender] || bubbleConfig.m;
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        setBubbleText(randomTemplate.replace("{color}", student.colorThai));
      } else {
        setMatchedStudent(null);
        setSearchStatus("not_found");
        setBubbleText("");
      }
    } catch (err) {
      console.error("Search failed, falling back to cached local data:", err);
      const student = studentsData.find(
        (s) => s.studentId === trimmedId
      );

      if (student) {
        const base64Pic = await convertToBase64(student.profilePic);
        setMatchedStudent({ ...student, profilePic: base64Pic });
        setSearchStatus("result");
        
        const templates = bubbleConfig[student.gender] || bubbleConfig.m;
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        setBubbleText(randomTemplate.replace("{color}", student.colorThai));
      } else {
        setMatchedStudent(null);
        setSearchStatus("not_found");
        setBubbleText("");
      }
    } finally {
      setIsSearching(false);
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
              <button type="submit" className="btn-primary" disabled={isDataLoading || isSearching}>
                {isSearching ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    กำลังค้นหา...
                  </span>
                ) : isDataLoading ? (
                  "กำลังโหลดข้อมูล..."
                ) : (
                  "ค้นหาสีของน้อง"
                )}
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
                  padding: "0",
                  backgroundColor: "transparent" 
                }}
              >
                <div style={{ width: typeof window !== 'undefined' && window.innerWidth >= 640 ? "800px" : (typeof window !== 'undefined' ? `${Math.min(window.innerWidth - 32, 320)}px` : "100%") }}>
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
        <span> to Nong PSRU ♡</span>
      </div>
    </div>
  );
}
