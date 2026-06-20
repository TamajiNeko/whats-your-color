"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [displayLimit, setDisplayLimit] = useState(50);

  const [newRow, setNewRow] = useState({
    "รหัสนักศึกษา": "",
    "คำนำหน้า": "นาย",
    "ชื่อ": "",
    "นามสกุล": "",
    "สี": "ม่วง"
  });

  const [isVerified, setIsVerified] = useState(null);
  const [pinValues, setPinValues] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Fetch wrapper that automatically appends the PIN header
  const fetchWithPin = async (url, options = {}) => {
    const pin = typeof window !== 'undefined' ? sessionStorage.getItem("dashboard_pin") || "" : "";
    const headers = {
      ...options.headers,
      "x-dashboard-pin": pin
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem("dashboard_pin");
      }
      setIsVerified(false);
    }
    return res;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPin = sessionStorage.getItem("dashboard_pin");
      if (savedPin) {
        setIsVerified(true);
        fetchDashboardDataDirect(savedPin);
      } else {
        setIsVerified(false);
      }
    } else {
      setIsVerified(false);
    }
  }, []);

  const fetchDashboardDataDirect = async (pin) => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch("/api/dashboard", {
        headers: { "x-dashboard-pin": pin }
      });
      const data = await res.json();
      if (res.ok) {
        setSpreadsheets(data.spreadsheets || []);
        setActiveConfig(data.activeConfig);
        
        if (data.activeConfig && !selectedFile) {
          loadSpreadsheetDataDirect(data.activeConfig.activeUrl, data.activeConfig.activeName, pin);
        }
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem("dashboard_pin");
        }
        setIsVerified(false);
      }
    } catch (err) {
      console.error("การเชื่อมต่อกับเซิร์ฟเวอร์ผิดพลาด", err);
      setIsVerified(false);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const loadSpreadsheetDataDirect = async (url, name, pin) => {
    setIsLoadingData(true);
    setSelectedFile({ url, name });
    try {
      const res = await fetch(`/api/dashboard?url=${encodeURIComponent(url)}`, {
        headers: { "x-dashboard-pin": pin }
      });
      const data = await res.json();
      if (res.ok) {
        setRows(data.rows || []);
      } else {
        console.error(data.error || "โหลดเนื้อหาสเปรดชีตไม่สำเร็จ");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสเปรดชีต", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetchWithPin("/api/dashboard");
      const data = await res.json();
      if (res.ok) {
        setSpreadsheets(data.spreadsheets || []);
        setActiveConfig(data.activeConfig);
        
        if (data.activeConfig && !selectedFile) {
          loadSpreadsheetData(data.activeConfig.activeUrl, data.activeConfig.activeName);
        }
      } else if (res.status !== 401) {
        console.error(data.error || "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
      }
    } catch (err) {
      console.error("การเชื่อมต่อกับเซิร์ฟเวอร์ผิดพลาด", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const loadSpreadsheetData = async (url, name) => {
    setIsLoadingData(true);
    setSelectedFile({ url, name });
    try {
      const res = await fetchWithPin(`/api/dashboard?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (res.ok) {
        setRows(data.rows || []);
      } else if (res.status !== 401) {
        console.error(data.error || "โหลดเนื้อหาสเปรดชีตไม่สำเร็จ");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสเปรดชีต", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetchWithPin("/api/dashboard", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        fetchDashboardData();
        if (data.activeConfig) {
          loadSpreadsheetData(data.activeConfig.activeUrl, data.activeConfig.activeName);
        }
      } else if (res.status !== 401) {
        console.error(data.error || "อัปโหลดไฟล์ไม่สำเร็จ");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectActive = async (file) => {
    setIsLoadingFiles(true);
    try {
      const res = await fetchWithPin("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "select",
          url: file.url,
          name: file.name
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveConfig(data.activeConfig);
        loadSpreadsheetData(file.url, file.name);
      } else if (res.status !== 401) {
        console.error(data.error || "ไม่สามารถตั้งค่าสเปรดชีตที่ใช้งานอยู่ได้");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการตั้งค่าสเปรดชีตที่ใช้งานอยู่", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์ "${file.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;

    setIsLoadingFiles(true);
    try {
      const res = await fetchWithPin("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          url: file.url
        })
      });
      if (res.ok) {
        if (selectedFile?.url === file.url) {
          setSelectedFile(null);
          setRows([]);
        }
        fetchDashboardData();
      } else if (res.status !== 401) {
        const data = await res.json();
        console.error(data.error || "ลบไฟล์ไม่สำเร็จ");
        setIsLoadingFiles(false);
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการลบไฟล์", err);
      setIsLoadingFiles(false);
    }
  };

  const handleCellChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value
    };
    setRows(updatedRows);
  };

  const handleAddRow = (e) => {
    e.preventDefault();
    if (!newRow["รหัสนักศึกษา"] || !newRow["ชื่อ"] || !newRow["นามสกุล"]) {
      alert("กรุณากรอกรหัสนักศึกษา ชื่อ และนามสกุลให้ครบถ้วน");
      return;
    }
    
    setRows([newRow, ...rows]);
    setNewRow({
      "รหัสนักศึกษา": "",
      "คำนำหน้า": "นาย",
      "ชื่อ": "",
      "นามสกุล": "",
      "สี": "ม่วง"
    });
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...rows];
    updatedRows.splice(index, 1);
    setRows(updatedRows);
  };

  const handleSaveChanges = async () => {
    if (!selectedFile) return;
    setIsSaving(true);

    try {
      const res = await fetchWithPin("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          rows,
          filename: selectedFile.name
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchDashboardData();
        if (data.activeConfig) {
          setSelectedFile({
            url: data.activeConfig.activeUrl,
            name: data.activeConfig.activeName
          });
        }
      } else if (res.status !== 401) {
        console.error(data.error || "บันทึกการเปลี่ยนแปลงไม่สำเร็จ");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการบันทึกสเปรดชีต", err);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerVerify = async (enteredPin) => {
    setIsVerifying(true);
    setPinError("");
    try {
      const res = await fetch("/api/dashboard", {
        headers: {
          "x-dashboard-pin": enteredPin
        }
      });
      if (res.ok) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem("dashboard_pin", enteredPin);
        }
        setIsVerified(true);
        fetchDashboardData();
      } else {
        setPinError("รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPinValues(["", "", "", "", "", ""]);
        const firstInput = document.getElementById("pin-0");
        if (firstInput) firstInput.focus();
      }
    } catch (err) {
      console.error(err);
      setPinError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinChange = (index, value) => {
    const sanitized = value.slice(-1);
    const newPinValues = [...pinValues];
    newPinValues[index] = sanitized;
    setPinValues(newPinValues);

    if (newPinValues.every(val => val !== "")) {
      triggerVerify(newPinValues.join(""));
    } else if (sanitized && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      const newPinValues = [...pinValues];
      if (!newPinValues[index] && index > 0) {
        newPinValues[index - 1] = "";
        setPinValues(newPinValues);
        const prevInput = document.getElementById(`pin-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        newPinValues[index] = "";
        setPinValues(newPinValues);
      }
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    const newPinValues = [...pinValues];
    for (let i = 0; i < 6; i++) {
      newPinValues[i] = pastedData[i] || "";
    }
    setPinValues(newPinValues);

    if (newPinValues.every(val => val !== "")) {
      triggerVerify(newPinValues.join(""));
    } else {
      const focusIndex = Math.min(pastedData.length, 5);
      const targetInput = document.getElementById(`pin-${focusIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  const filteredRows = rows.filter(row => {
    const id = String(row["รหัสนักศึกษา"] || "").toLowerCase();
    const fname = String(row["ชื่อ"] || "").toLowerCase();
    const lname = String(row["นามสกุล"] || "").toLowerCase();
    const color = String(row["สี"] || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    return id.includes(search) || fname.includes(search) || lname.includes(search) || color.includes(search);
  });

  const getThaiColorBadgeClass = (color) => {
    switch (color) {
      case "ดำ": return "bg-gray-800 text-white";
      case "น้ำเงิน": return "bg-blue-600 text-white";
      case "น้ำตาล": return "bg-amber-900 text-white";
      case "เขียว": return "bg-emerald-600 text-white";
      case "ส้ม": return "bg-orange-500 text-white";
      case "ชมพู": return "bg-pink-500 text-white";
      case "ม่วง": return "bg-purple-600 text-white";
      case "แดง": return "bg-red-600 text-white";
      case "ฟ้า": return "bg-sky-400 text-slate-900";
      case "เหลือง": return "bg-yellow-400 text-slate-900";
      default: return "bg-slate-200 text-slate-800";
    }
  };

  if (isVerified === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
      </div>
    );
  }

  if (isVerified === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 relative overflow-hidden font-sans">
        {/* Soft Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none"></div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
          .shake-anim {
            animation: shake 0.3s ease-in-out;
          }
        `}</style>

        <div className="w-full max-w-md px-6 py-12 z-10">
          <div className={`bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xl rounded-3xl p-8 ${isShaking ? "shake-anim border-red-500/50" : ""}`}>
            <div className="flex flex-col items-center mb-6">
              <Link href="/" className="mb-4 active:scale-95 transition">
                <img src="/icon.png" alt="Logo" className="w-16 h-16 rounded-2xl object-contain" />
              </Link>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                Whats Your Color?
              </h1>
              <p className="text-xs font-semibold text-slate-400 mt-1 text-center">
                กรุณากรอกรหัส PIN 6 หลักเพื่อปลดล็อกแดชบอร์ด
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); triggerVerify(pinValues.join("")); }}>
              <div className="flex justify-between gap-2.5 my-6">
                {pinValues.map((val, i) => (
                  <input
                    key={i}
                    id={`pin-${i}`}
                    type="password"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    onPaste={handlePinPaste}
                    autoComplete="off"
                    className="w-12 h-14 font-mono text-xl font-bold text-center text-slate-800 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl transition duration-150 outline-none"
                  />
                ))}
              </div>

              {pinError && (
                <div className="text-red-500 text-xs font-bold text-center mb-6 flex justify-center">
                  {pinError}
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || pinValues.some(val => val === "")}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl transition duration-150 shadow-md shadow-emerald-600/10 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    ยืนยันรหัสผ่าน
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Header bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">น้องอยู่สีอะไร?</h1>
              <p className="text-sm font-bold text-slate-400 tracking-wider">แดชบอร์ดจัดการข้อมูล</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 bg-white hover:bg-slate-50 active:scale-98 text-slate-600 font-semibold text-sm rounded-xl border border-slate-200 transition flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-6 pb-8 lg:pb-10 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-8 lg:overflow-hidden lg:min-h-0">
        
        <section className="lg:col-span-4 flex flex-col gap-6 lg:h-full lg:overflow-hidden lg:min-h-0">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shrink-0">
            <div className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500 translate-y-[1.5px]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              อัปโหลดสเปรดชีต
            </div>

            {/* Upload Zone */}
            <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl py-8 px-4 text-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/10 relative overflow-hidden group ${isUploading ? "pointer-events-none opacity-50" : ""}`}>
              <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
                  <span className="text-xs font-semibold text-slate-500">กำลังอัปโหลดและประมวลผลไฟล์...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-600 rounded-xl flex items-center justify-center mb-3 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-700">เลือกไฟล์ Excel ใหม่</span>
                  <span className="text-[10px] text-slate-400 mt-1">รองรับไฟล์นามสกุล .xlsx</span>
                </div>
              )}
            </label>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex-1 flex flex-col lg:overflow-hidden lg:min-h-0">
            <div className="flex items-center justify-between mb-4 flex-nowrap gap-2 shrink-0">
              <div className="text-xl font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>
                คลังไฟล์บนคลาวด์
              </div>
              <button 
                onClick={fetchDashboardData} 
                disabled={isLoadingFiles}
                className="p-1.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLoadingFiles ? "animate-spin" : ""}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
            </div>

            {isLoadingFiles ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3"></div>
                <span className="text-xs text-slate-500 font-medium">กำลังดึงข้อมูลประวัติไฟล์...</span>
              </div>
            ) : spreadsheets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <p className="text-slate-400 text-xs">ยังไม่มีการอัปโหลดไฟล์</p>
                <p className="text-slate-500 text-[10px] mt-1">อัปโหลดไฟล์ XLSX ด้านบนเพื่อเริ่มใช้งาน</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto lg:max-h-none max-h-112.5 pr-1 flex flex-col gap-3">
                {spreadsheets.map((file, i) => {
                  const isActive = activeConfig?.activeUrl === file.url;
                  const isOpened = selectedFile?.url === file.url;

                  return (
                    <div 
                      key={i} 
                      className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                        isOpened
                          ? "bg-emerald-50/40 border-emerald-200" 
                          : "bg-slate-50/30 border-slate-100 hover:bg-slate-50/70 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50" : "bg-slate-100 text-slate-500"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-semibold truncate text-slate-800">
                              {file.name}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {isActive && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-bold rounded">
                            กำลังใช้งาน
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <button 
                          onClick={() => loadSpreadsheetData(file.url, file.name)}
                          disabled={isLoadingData && isOpened}
                          className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-[10px] transition flex items-center justify-center gap-1.5 border ${
                            isOpened 
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500" 
                              : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          แสดงไฟล์ Excel
                        </button>
                        
                        {!isActive && (
                          <button 
                            onClick={() => handleSelectActive(file)}
                            className="py-2 px-2.25 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-slate-400 border border-slate-200 rounded-lg transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                        )}

                        <a 
                          href={file.url} 
                          download={file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.25 bg-white hover:bg-slate-50 text-slate-400 border border-slate-200 rounded-lg transition flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </a>

                        <button 
                          onClick={() => handleDeleteFile(file)}
                          className="py-2 px-2.25 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-400 border border-slate-200 rounded-lg transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Spreadsheet Editor (8 cols) */}
        <section className="lg:col-span-8 lg:h-full lg:overflow-hidden lg:min-h-0">
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col lg:h-full lg:min-h-0">
            
            {/* Editor Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-1.5 shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xl font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500"><polygon points="14 2 18 6 7 17 3 17 3 13 14 2"/><line x1="12" y1="5" x2="16" y2="9"/></svg>
                  แก้ไขแถวข้อมูลสเปรดชีต
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="ค้นหาแถวข้อมูล..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48 h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-400 transition font-medium text-slate-800"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>

                    <button 
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          บันทึกการเปลี่ยนแปลง
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {selectedFile ? (
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  กำลังแก้ไข: <span className="text-emerald-600 font-bold">{selectedFile.name}</span> ({rows.length} รายการ)
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 font-semibold mt-1">ยังไม่ได้โหลดไฟล์ เลือกไฟล์จากเมนูด้านซ้าย</p>
              )}
            </div>

            {/* Editor Body */}
            {isLoadingData ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
                <span className="text-xs text-slate-500 font-semibold animate-pulse">กำลังโหลดข้อมูลแถวสเปรดชีต...</span>
              </div>
            ) : !selectedFile ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/10">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                </div>
                <h3 className="text-sm font-bold text-slate-700">ไม่ได้เปิดไฟล์ Excel อยู่</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                  เลือกไฟล์จากแผง "คลังไฟล์บนคลาวด์" ทางด้านซ้าย หรืออัปโหลดไฟล์ใหม่เพื่อแสดงแถวข้อมูลที่นี่
                </p>
              </div>
            ) : (
               <div className="flex-1 flex flex-col lg:min-h-0 overflow-hidden bg-white">
                
                {/* Add Row Form */}
                <form onSubmit={handleAddRow} className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">เพิ่มนักศึกษา:</span>
                  
                  <input 
                    type="text" 
                    placeholder="รหัสนักศึกษา" 
                    value={newRow["รหัสนักศึกษา"]}
                    onChange={e => setNewRow(prev => ({ ...prev, "รหัสนักศึกษา": e.target.value.replace(/[^0-9]/g, "") }))}
                    maxLength={10}
                    className="flex-1 min-w-30 h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-400 transition font-medium text-slate-800"
                    required
                  />

                  <select 
                    value={newRow["คำนำหน้า"]}
                    onChange={e => setNewRow(prev => ({ ...prev, "คำนำหน้า": e.target.value }))}
                    className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-400 transition font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="นาง">นาง</option>
                  </select>

                  <input 
                    type="text" 
                    placeholder="ชื่อจริง" 
                    value={newRow["ชื่อ"]}
                    onChange={e => setNewRow(prev => ({ ...prev, "ชื่อ": e.target.value }))}
                    className="flex-1 min-w-25 h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-400 transition font-medium text-slate-800"
                    required
                  />

                  <input 
                    type="text" 
                    placeholder="นามสกุล" 
                    value={newRow["นามสกุล"]}
                    onChange={e => setNewRow(prev => ({ ...prev, "นามสกุล": e.target.value }))}
                    className="flex-1 min-w-25 h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-400 transition font-medium text-slate-800"
                    required
                  />

                  <select 
                    value={newRow["สี"]}
                    onChange={e => setNewRow(prev => ({ ...prev, "สี": e.target.value }))}
                    className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-400 transition font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="แดง">แดง</option>
                    <option value="เหลือง">เหลือง</option>
                    <option value="น้ำตาล">น้ำตาล</option>
                    <option value="ดำ">ดำ</option>
                    <option value="น้ำเงิน">น้ำเงิน</option>
                    <option value="ชมพู">ชมพู</option>
                    <option value="ส้ม">ส้ม</option>
                    <option value="เขียว">เขียว</option>
                    <option value="ฟ้า">ฟ้า</option>
                    <option value="ม่วง">ม่วง</option>
                  </select>

                  <button 
                    type="submit"
                    className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-97 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    เพิ่ม
                  </button>
                </form>

                {/* Table Data */}
                 <div className="flex-1 overflow-x-auto overflow-y-auto lg:max-h-none max-h-125">
                  <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
                    <thead className="sticky top-0 bg-slate-50 backdrop-blur-sm border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
                      <tr>
                        <th className="py-3 px-4 w-15">Index</th>
                        <th className="py-3 px-4 w-41.25">Student ID</th>
                        <th className="py-3 px-4 w-25">Title</th>
                        <th className="py-3 px-4 w-40">First Name</th>
                        <th className="py-3 px-4 w-40">Last Name</th>
                        <th className="py-3 px-4 w-25">Color</th>
                        <th className="py-3 px-4 text-center w-25">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRows.slice(0, displayLimit).map((row, index) => {
                        const originalIndex = rows.indexOf(row);
                        
                        return (
                          <tr key={index} className="hover:bg-slate-50/50 group transition">
                            <td className="py-2.5 px-4 text-slate-400">{originalIndex + 1}</td>
                            <td className="py-2.5 px-4">
                              <input 
                                type="text"
                                value={row["รหัสนักศึกษา"] || ""}
                                onChange={e => handleCellChange(originalIndex, "รหัสนักศึกษา", e.target.value.replace(/[^0-9]/g, ""))}
                                className="w-full bg-transparent focus:bg-slate-50 border-none outline-none px-2 py-1 rounded transition text-slate-800 font-mono font-medium focus:ring-1 focus:ring-emerald-400/50"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <select 
                                value={row["คำนำหน้า"] || ""}
                                onChange={e => handleCellChange(originalIndex, "คำนำหน้า", e.target.value)}
                                className="bg-transparent focus:bg-slate-50 border-none outline-none px-1 py-1 rounded transition text-slate-800 cursor-pointer font-medium focus:ring-1 focus:ring-emerald-400/50"
                              >
                                <option className="bg-white text-slate-800" value="นาย">นาย</option>
                                <option className="bg-white text-slate-800" value="นางสาว">นางสาว</option>
                                <option className="bg-white text-slate-800" value="นาง">นาง</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-4">
                              <input 
                                type="text"
                                value={row["ชื่อ"] || ""}
                                onChange={e => handleCellChange(originalIndex, "ชื่อ", e.target.value)}
                                className="w-full bg-transparent focus:bg-slate-50 border-none outline-none px-2 py-1 rounded transition text-slate-800 font-medium focus:ring-1 focus:ring-emerald-400/50"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <input 
                                type="text"
                                value={row["นามสกุล"] || ""}
                                onChange={e => handleCellChange(originalIndex, "นามสกุล", e.target.value)}
                                className="w-full bg-transparent focus:bg-slate-50 border-none outline-none px-2 py-1 rounded transition text-slate-800 font-medium focus:ring-1 focus:ring-emerald-400/50"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <select 
                                value={row["สี"] || ""}
                                onChange={e => handleCellChange(originalIndex, "สี", e.target.value)}
                                className={`px-2 py-1 rounded font-bold cursor-pointer transition focus:ring-1 focus:ring-emerald-400/50 outline-none ${getThaiColorBadgeClass(row["สี"])}`}
                              >
                                <option className="bg-white text-red-500 font-bold" value="แดง">แดง</option>
                                <option className="bg-white text-yellow-600 font-bold" value="เหลือง">เหลือง</option>
                                <option className="bg-white text-amber-800 font-bold" value="น้ำตาล">น้ำตาล</option>
                                <option className="bg-white text-slate-800 font-bold" value="ดำ">ดำ</option>
                                <option className="bg-white text-blue-600 font-bold" value="น้ำเงิน">น้ำเงิน</option>
                                <option className="bg-white text-pink-500 font-bold" value="ชมพู">ชมพู</option>
                                <option className="bg-white text-orange-500 font-bold" value="ส้ม">ส้ม</option>
                                <option className="bg-white text-emerald-600 font-bold" value="เขียว">เขียว</option>
                                <option className="bg-white text-sky-500 font-bold" value="ฟ้า">ฟ้า</option>
                                <option className="bg-white text-purple-600 font-bold" value="ม่วง">ม่วง</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button 
                                onClick={() => handleDeleteRow(originalIndex)}
                                className="px-2 py-1 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition active:scale-95"
                              >
                                ลบ
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {filteredRows.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      ไม่พบข้อมูลที่ตรงกับคำค้นหา
                    </div>
                  )}
                </div>

                {/* Table Footer / Pagination helper */}
                {filteredRows.length > displayLimit && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>กำลังแสดง {displayLimit} รายการแรก จากทั้งหมด {filteredRows.length} รายการ</span>
                    <button 
                      onClick={() => setDisplayLimit(prev => prev + 100)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold rounded-lg transition"
                    >
                      โหลดข้อมูลเพิ่ม
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}