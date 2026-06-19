"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import studentsData from "../../data/students.json";
import TicketVisual from "../../components/TicketVisual";
import TicketCard from "../../components/TicketCard";

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
          
          // Clear canvas (transparent background)
          ctx.clearRect(0, 0, targetSize, targetSize);
          
          // Fit image (like object-fit: contain)
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



  return (
    <div className={`transition-all duration-700 ease-in-out main-layout min-h-screen ${getBgClass()}`} style={getThemeStyles()}>
      {searchStatus === "idle" && (
        <>
          <TicketCard
            className="animate-fade-in"
            overlay={<div className="void-stamp">VOID</div>}
            header={{
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                  <path d="M15 5v2"/>
                  <path d="M15 11v2"/>
                  <path d="M15 17v2"/>
                  <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/>
                </svg>
              ),
              title: "ENG PSRU BOARDING PASS",
              serial: "NO. 0000000000",
              bgColor: "#94a3b8",
            }}
            route={{
              fromCode: "STU",
              fromLabel: "PASSENGER / นิสิตนักศึกษา",
              toCode: "---",
              toLabel: "TEAM / ไม่มีข้อมูล",
              accentColor: "#94a3b8",
              toStyle: { color: "#94a3b8" },
            }}
            passenger={{
              avatar: (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 5v2"/>
                    <path d="M15 11v2"/>
                    <path d="M15 17v2"/>
                    <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/>
                  </svg>
                </div>
              ),
              label: "NO TICKET / ไม่มีตั๋ว",
              labelStyle: { color: "#94a3b8" },
              name: "กรุณาใช้ลิงก์ที่มีรหัสนักศึกษา",
              nameStyle: { color: "#94a3b8" },
              subtitle: "/ticket?id=รหัสนักศึกษา",
            }}
            details={[
              { label: "FACULTY / คณะ", value: "UNKNOWN / ไม่ระบุ" },
              { label: "COLOR / สี", value: "N/A" },
              { label: "FLIGHT EVENT / กิจกรรม", value: "รับน้อง 69 มรพส." },
              { label: "GATE / ประตูทางเข้า", value: "VOID", valueStyle: { color: "#94a3b8" } },
            ]}
            detailsStyle={{ opacity: 0.5 }}
            stub={{
              headerLeft: "VOID",
              headerLeftStyle: { color: "#94a3b8" },
              headerRight: "TEAM-NONE",
              headerRightStyle: {},
              qrUrl: typeof window !== "undefined" ? window.location.href : "",
              qrWrapperStyle: { filter: "grayscale(100%)", opacity: 0.8, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" },
              barcodeId: "0000000000",
              barcodeLabel: "NO-ID",
              barcodeLabelStyle: { textDecoration: "line-through" },
              barcodeContainerStyle: { opacity: 0.8 },
              footerText: "NO ACCESS",
              footerStyle: { color: "#94a3b8" },
              stubStyle: { opacity: 0.5 },
            }}
          />

          <div className="action-buttons animate-fade-in" style={{ width: "100%", maxWidth: "320px", justifyContent: "center" }}>
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
                background: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.92rem",
                borderRadius: "14px",
                letterSpacing: "0.02em",
                boxShadow: "0 4px 20px rgba(100,116,139,0.35)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(100,116,139,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(100,116,139,0.35)"; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/>
                <path d="m12 5-7 7 7 7"/>
              </svg>
              ไปหน้าค้นหาหลัก
            </Link>
          </div>
        </>
      )}

      {searchStatus === "loading" && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(148,163,184,0.25)",
            borderTopColor: "#94a3b8",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {searchStatus === "result" && matchedStudent && (
        <>
          <TicketVisual student={matchedStudent} ticketUrl={shareUrl} className="animate-fade-in" />

          <div className="action-buttons animate-fade-in" style={{ width: "100%", maxWidth: "320px", justifyContent: "center" }}>
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
          <TicketCard
            className="animate-fade-in"
            overlay={<div className="void-stamp">VOID</div>}
            header={{
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ),
              title: "ENG PSRU ERROR PASS",
              serial: "NO. 0000000000",
              bgColor: "#ef4444",
            }}
            route={{
              fromCode: "STU",
              fromLabel: "PASSENGER / นิสิตนักศึกษา",
              toCode: "ERR",
              toLabel: "TEAM / ไม่พบสี",
              accentColor: "#ef4444",
              toStyle: { color: "#ef4444" },
            }}
            passenger={{
              avatar: (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
              ),
              label: "INVALID TICKET / บัตรไม่ถูกต้อง",
              labelStyle: { color: "#ef4444" },
              name: "ไม่พบข้อมูลในระบบ",
              nameStyle: { color: "#ef4444" },
              subtitle: `ID: ${id}`,
            }}
            details={[
              { label: "FACULTY / คณะ", value: "UNKNOWN / ไม่ระบุ" },
              { label: "COLOR / สี", value: "N/A" },
              { label: "FLIGHT EVENT / กิจกรรม", value: "รับน้อง 69 มรพส." },
              { label: "GATE / ประตูทางเข้า", value: "FAILED", valueStyle: { color: "#ef4444" } },
            ]}
            detailsStyle={{ opacity: 0.5 }}
            stub={{
              headerLeft: "VOID",
              headerLeftStyle: { color: "#ef4444" },
              headerRight: "TEAM-NONE",
              headerRightStyle: {},
              qrUrl: shareUrl,
              qrWrapperStyle: { filter: "grayscale(100%)", opacity: 0.8, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" },
              barcodeId: id,
              barcodeLabel: id,
              barcodeLabelStyle: { textDecoration: "line-through" },
              barcodeContainerStyle: { opacity: 0.8 },
              footerText: "ACCESS DENIED",
              footerStyle: { color: "#ef4444" },
              stubStyle: { opacity: 0.5 },
            }}
          />

          <div className="action-buttons animate-fade-in" style={{ width: "100%", maxWidth: "320px", justifyContent: "center" }}>
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
