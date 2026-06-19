"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import studentsData from "../../data/students.json";
import TicketVisual, { generateBarcodeLines } from "../../components/TicketVisual";

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

function TicketContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [searchStatus, setSearchStatus] = useState("loading"); // loading, result, not_found, idle
  const [shareUrl, setShareUrl] = useState("");
  const [defaultTheme, setDefaultTheme] = useState({ eng: "red", hex: "#dc2626" });

  const randomizeDefaultTheme = () => {
    const randomIndex = Math.floor(Math.random() * defaultColors.length);
    setDefaultTheme(defaultColors[randomIndex]);
  };

  useEffect(() => {
    randomizeDefaultTheme();
  }, []);


  const convertToBase64 = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to convert image to base64:", err);
      return url;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }

    if (!id) {
      setSearchStatus("idle");
      setMatchedStudent(null);
      return;
    }

    const trimmedId = id.trim();
    const student = studentsData.find(
      (s) => s.studentId === trimmedId
    );

    if (student) {
      convertToBase64(student.profilePic).then((base64Pic) => {
        setMatchedStudent({ ...student, profilePic: base64Pic });
        setSearchStatus("result");
      });
    } else {
      setMatchedStudent(null);
      setSearchStatus("not_found");
    }
  }, [id]);

  const getBgClass = () => {
    if (searchStatus === "result" && matchedStudent) {
      return `bg-theme-${matchedStudent.colorEng}`;
    }
    if (searchStatus === "not_found") {
      return "bg-theme-black";
    }
    return `bg-theme-${defaultTheme.eng}`;
  };

  const getThemeStyles = () => {
    const color = (searchStatus === "result" && matchedStudent)
      ? matchedStudent.colorHex
      : searchStatus === "not_found"
        ? "#1e293b"
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

  const voidBarcodeData = generateBarcodeLines(id);

  return (
    <div className={`transition-all duration-700 ease-in-out main-layout min-h-screen ${getBgClass()}`} style={getThemeStyles()}>
      {searchStatus === "idle" && (
        <div className="animate-fade-in card-wrapper">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 5v2"/>
              <path d="M15 11v2"/>
              <path d="M15 17v2"/>
              <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/>
            </svg>
          </div>
          <h2>ตรวจสอบด้วย Ticket Link</h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: 1.5 }}>
            กรุณาใช้งานผ่านลิงก์ที่มีรหัสนักศึกษา เช่น <br />
            <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", color: "#e11d48", fontSize: "0.85rem", display: "inline-block", marginTop: "6px", fontWeight: "bold" }}>
              /ticket?id=รหัสนักศึกษา
            </code>
          </p>
          <Link href="/" className="btn-primary text-center" style={{ textDecoration: "none", display: "block" }}>
            ไปหน้าค้นหาหลัก
          </Link>
        </div>
      )}

      {searchStatus === "loading" && (
        <div className="card-wrapper text-center py-12">
          <p style={{ color: "#64748b", fontSize: "1rem", fontWeight: 600 }}>กำลังตรวจสอบข้อมูล...</p>
        </div>
      )}

      {searchStatus === "result" && matchedStudent && (
        <>
          <TicketVisual student={matchedStudent} ticketUrl={shareUrl} className="animate-fade-in" />

          <div className="action-buttons animate-fade-in" style={{ width: "100%", maxWidth: "420px", justifyContent: "center" }}>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.85rem 1.5rem",
                background: matchedStudent.colorHex,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.92rem",
                borderRadius: "14px",
                letterSpacing: "0.02em",
                boxShadow: `0 4px 20px ${matchedStudent.colorHex}55`,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${matchedStudent.colorHex}77`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${matchedStudent.colorHex}55`; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/>
                <path d="m12 5-7 7 7 7"/>
              </svg>
              กลับไปหน้าค้นหา
            </Link>
          </div>
        </>
      )}

      {searchStatus === "not_found" && (
        <>
          <div className="ticket-container animate-fade-in">
            {/* Main Ticket */}
            <div className="ticket-main">
              <div className="void-stamp">VOID</div>
              
              <div className="ticket-header-brand ticket-header-colored" style={{ backgroundColor: "#ef4444" }}>
                <span className="brand-logo" style={{ color: "rgba(255,255,255,0.95)", display: "inline-flex", alignItems: "center", gap: "6px", lineHeight: 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span style={{ display: "inline-block", lineHeight: 1 }}>ENG PSRU ERROR PASS</span>
                </span>
                <span className="ticket-serial" style={{ color: "rgba(255,255,255,0.8)" }}>NO. 0000000000</span>
              </div>

              <div className="ticket-route">
                <div className="route-code">
                  <h4>STU</h4>
                  <span className="route-label">PASSENGER / นิสิตนักศึกษา</span>
                </div>
                <div className="route-arrow">
                  <div className="route-line" style={{ borderColor: "#ef4444" }}></div>
                  <div className="route-plane">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#ef4444" }}>
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l7 2.5z"/>
                    </svg>
                  </div>
                </div>
                <div className="route-code right-align">
                  <h4 style={{ color: "#ef4444" }}>ERR</h4>
                  <span className="route-label" style={{ color: "#ef4444" }}>TEAM / ไม่พบสี</span>
                </div>
              </div>
              
              <div className="ticket-content-wrapper">
                <div className="ticket-passenger-section">
                  <div className="avatar-frame">
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    </div>
                  </div>
                  <div className="passenger-info">
                    <span className="passenger-label" style={{ color: "#ef4444" }}>INVALID TICKET / บัตรไม่ถูกต้อง</span>
                    <h3 className="passenger-name" style={{ color: "#ef4444" }}>
                      ไม่พบข้อมูลในระบบ
                    </h3>
                    <span className="passenger-id">ID: {id}</span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="ticket-details-grid" style={{ opacity: 0.5 }}>
                  <div className="detail-box">
                    <span className="detail-label">FACULTY / คณะ</span>
                    <span className="detail-val">UNKNOWN / ไม่ระบุ</span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">COLOR / สี</span>
                    <span className="detail-val">N/A</span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">FLIGHT EVENT / กิจกรรม</span>
                    <span className="detail-val">รับน้อง 69 มรพส.</span>
                  </div>
                  <div className="detail-box">
                    <span className="detail-label">GATE / ประตูทางเข้า</span>
                    <span className="detail-val" style={{ color: "#ef4444" }}>FAILED</span>
                  </div>
                </div>
              </div>

            </div>



            {/* Ticket Stub */}
            <div className="ticket-stub" style={{ opacity: 0.5 }}>
              <div className="stub-header">
                <span style={{ color: "#ef4444" }}>VOID</span>
                <span>TEAM-NONE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                {shareUrl && (
                  <div style={{ padding: "4px", background: "#fff", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.06)", filter: "grayscale(100%)", opacity: 0.8 }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(shareUrl)}`}
                      alt="QR Code"
                      width="70"
                      height="70"
                      style={{ display: "block" }}
                    />
                  </div>
                )}
                <div className="barcode-container" style={{ width: "80px", marginTop: 0, paddingTop: 0, border: "none", opacity: 0.8 }}>
                  <svg className="barcode-svg" viewBox={`0 0 ${voidBarcodeData.totalWidth} 26`} style={{ width: "100%", height: "auto" }}>
                    {voidBarcodeData.bars}
                  </svg>
                  <span className="barcode-label" style={{ fontSize: "0.55rem", letterSpacing: "0.05em", marginTop: "2px", paddingLeft: 0, textDecoration: "line-through" }}>
                    {id}
                  </span>
                </div>
              </div>
              <div className="stub-footer">
                <span style={{ color: "#ef4444" }}>ACCESS DENIED</span>
              </div>
            </div>
          </div>

          <div className="action-buttons animate-fade-in" style={{ width: "100%", maxWidth: "420px", justifyContent: "center" }}>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.85rem 1.5rem",
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.92rem",
                borderRadius: "14px",
                letterSpacing: "0.02em",
                boxShadow: "0 4px 20px rgba(15,23,42,0.35)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(15,23,42,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(15,23,42,0.35)"; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/>
                <path d="m12 5-7 7 7 7"/>
              </svg>
              กลับไปหน้าค้นหา
            </Link>
          </div>
        </>
      )}

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

export default function TicketPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#64748b" }}>กำลังโหลดตั๋ว...</p>
      </div>
    }>
      <TicketContent />
    </Suspense>
  );
}
