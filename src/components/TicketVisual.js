"use client";

export const generateBarcodeLines = (studentId) => {
  if (!studentId) return { bars: [], totalWidth: 100 };
  const bars = [];
  let currentX = 0;
  const barcodeHeight = 18;
  const guardHeight = 22;

  bars.push(<rect key="s1" x={currentX} y="2" width="1.5" height={guardHeight} fill="#0f172a" />);
  currentX += 3;
  bars.push(<rect key="s2" x={currentX} y="2" width="1.5" height={guardHeight} fill="#0f172a" />);
  currentX += 3;

  for (let i = 0; i < studentId.length; i++) {
    const val = parseInt(studentId[i], 10) || 0;
    const w1 = (val % 3) * 0.75 + 1;
    const space = ((val + 2) % 3) * 0.75 + 1;
    const w2 = ((val + 1) % 3) * 0.75 + 1;
    const space2 = 1.5;

    bars.push(<rect key={`b-${i}-1`} x={currentX} y="2" width={w1} height={barcodeHeight} fill="#0f172a" />);
    currentX += w1 + space;

    bars.push(<rect key={`b-${i}-2`} x={currentX} y="2" width={w2} height={barcodeHeight} fill="#0f172a" />);
    currentX += w2 + space2;
  }

  bars.push(<rect key="e1" x={currentX} y="2" width="1.5" height={guardHeight} fill="#0f172a" />);
  currentX += 3;
  bars.push(<rect key="e2" x={currentX} y="2" width="1.5" height={guardHeight} fill="#0f172a" />);

  return { bars, totalWidth: currentX + 1.5 };
};

export default function TicketVisual({ student, ticketUrl, className = "", style = {} }) {
  const barcodeData = generateBarcodeLines(student.studentId);

  return (
    <div className={`ticket-container ${className}`} style={style}>
      {/* Main Ticket */}
      <div className="ticket-main">
        <div
          className="ticket-header-brand ticket-header-colored"
          style={{ backgroundColor: student.colorHex }}
        >
          <span
            className="brand-logo"
            style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.95)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v14" strokeDasharray="3 3" />
            </svg>
            ENG PSRU boarding pass
          </span>
          <span className="ticket-serial" style={{ color: "rgba(255,255,255,0.8)" }}>
            NO. {student.studentId}
          </span>
        </div>

        <div className="ticket-route">
          <div className="route-code">
            <h4>STU</h4>
            <span className="route-label">PASSENGER / นักศึกษา 69</span>
          </div>
          <div className="route-arrow">
            <div className="route-line"></div>
            <div className="route-plane">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: student.colorHex }}
              >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l7 2.5z" />
              </svg>
            </div>
          </div>
          <div className="route-code right-align">
            <h4>{student.colorEng.slice(0, 3).toUpperCase()}</h4>
            <span className="route-label">TEAM / สี{student.colorThai}</span>
          </div>
        </div>

        <div className="ticket-content-wrapper">
          <div className="ticket-passenger-section">
            <div className="avatar-frame">
              <img
                src={student.profilePic}
                className="profile-pic"
                alt={`${student.firstName} profile`}
                crossOrigin="anonymous"
              />
            </div>
            <div className="passenger-info">
              <span className="passenger-label">PASSENGER NAME / ชื่อผู้เดินทาง</span>
              <h3 className="passenger-name">
                {student.title}{student.firstName} {student.lastName}
              </h3>
              <span className="passenger-id">CLASS OF 69</span>
            </div>
          </div>

          <div className="ticket-details-grid">
            <div className="detail-box">
              <span className="detail-label">FACULTY / คณะ</span>
              <span className="detail-val">วิศวกรรมศาสตร์ฯ</span>
            </div>
            <div className="detail-box">
              <span className="detail-label">COLOR / กลุ่มสี</span>
              <span className="detail-val" style={{ color: student.colorHex }}>
                สี{student.colorThai} ({student.colorNameEng})
              </span>
            </div>
            <div className="detail-box">
              <span className="detail-label">FLIGHT EVENT / กิจกรรม</span>
              <span className="detail-val">รับน้องวิศวะ 69 มรพส.</span>
            </div>
            <div className="detail-box">
              <span className="detail-label">GATE / ประตูทางเข้า</span>
              <span className="detail-val" style={{ color: "#10b981" }}>VERIFIED PASS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Stub */}
      <div
        className="ticket-stub"
        style={{ backgroundColor: student.colorHex, borderColor: student.colorHex }}
      >
        <div className="stub-header" style={{ borderBottomColor: "rgba(255,255,255,0.25)" }}>
          <span style={{ color: "rgba(255,255,255,0.7)" }}>STUB</span>
          <span style={{ color: "#fff", fontWeight: 900 }}>
            TEAM-{student.colorEng.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
          {ticketUrl && (
            <div
              style={{
                padding: "4px",
                background: "#fff",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(ticketUrl)}`}
                alt="QR Code"
                width="70"
                height="70"
                crossOrigin="anonymous"
                style={{ display: "block" }}
              />
            </div>
          )}
          <div
            className="barcode-container"
            style={{ width: "80px", marginTop: 0, paddingTop: 0, border: "none" }}
          >
            <svg
              className="barcode-svg"
              viewBox={`0 0 ${barcodeData.totalWidth} 26`}
              style={{ width: "100%", height: "auto", filter: "brightness(0) invert(1)" }}
            >
              {barcodeData.bars}
            </svg>
            <span
              className="barcode-label"
              style={{
                fontSize: "0.55rem",
                letterSpacing: "0.05em",
                marginTop: "2px",
                paddingLeft: 0,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {student.studentId}
            </span>
          </div>
        </div>
        <div
          className="stub-footer"
          style={{ borderTopColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.8)" }}
        >
          <span>CLASS OF 69</span>
        </div>
      </div>
    </div>
  );
}
