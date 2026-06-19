"use client";

import TicketCard from "./TicketCard";

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
  const ticketIcon = (
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
  );

  const avatarElement = (
    <img
      src={student.profilePic}
      className="profile-pic"
      alt={`${student.firstName} profile`}
      crossOrigin="anonymous"
    />
  );

  return (
    <TicketCard
      className={className}
      style={style}
      header={{
        icon: ticketIcon,
        title: "ENG PSRU boarding pass",
        serial: `NO. ${student.studentId}`,
        bgColor: student.colorHex,
      }}
      route={{
        fromCode: "STU",
        fromLabel: "PASSENGER / นักศึกษา 69",
        toCode: student.colorEng.slice(0, 3).toUpperCase(),
        toLabel: `TEAM / สี${student.colorThai}`,
        accentColor: student.colorHex,
      }}
      passenger={{
        avatar: avatarElement,
        label: "PASSENGER NAME / ชื่อผู้เดินทาง",
        name: `${student.title}${student.firstName} ${student.lastName}`,
        subtitle: "CLASS OF 69",
      }}
      details={[
        { label: "FACULTY / คณะ", value: "วิศวกรรมศาสตร์ฯ" },
        {
          label: "COLOR / กลุ่มสี",
          value: `สี${student.colorThai} (${student.colorNameEng})`,
          valueStyle: { color: student.colorHex },
        },
        { label: "FLIGHT EVENT / กิจกรรม", value: "รับน้องวิศวะ 69 มรพส." },
        {
          label: "GATE / ประตูทางเข้า",
          value: "VERIFIED PASS",
          valueStyle: { color: "#10b981" },
        },
      ]}
      stub={{
        headerLeft: "STUB",
        headerLeftStyle: { color: "rgba(255,255,255,0.7)" },
        headerRight: `TEAM-${student.colorEng.replace("_", " ").toUpperCase()}`,
        headerRightStyle: { color: "#fff", fontWeight: 900 },
        qrUrl: ticketUrl,
        barcodeId: student.studentId,
        barcodeLabel: student.studentId,
        barcodeFilter: "brightness(0) invert(1)",
        barcodeLabelStyle: { color: "rgba(255,255,255,0.85)" },
        footerText: "CLASS OF 69",
        footerStyle: { color: "rgba(255,255,255,0.8)" },
        bgColor: student.colorHex,
      }}
    />
  );
}
