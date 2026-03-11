import { useState, useEffect, useMemo } from "react";
import { HDate, months } from "@hebcal/core";
import { saveVisits, saveMembers, getMembers, saveOTP, verifyOTP, subscribeToVisits, subscribeToMembers } from "./firebase";

// ============================================================
// 🔧 EmailJS — החלף את הערכים!
// ============================================================
const EMAILJS_SERVICE_ID  = "moore2026!";
const EMAILJS_TEMPLATE_ID = "template_e8nu0ve";
const EMAILJS_PUBLIC_KEY  = "MStQyUFQG4G9wZge_";
const EMAILJS_PRIVATE_KEY = "bh69CO2GfgFozc_EqMLUT";
// ============================================================

const FAMILY_CODE = "mishpacha2024";

const COLORS = [
  { bg: "#FF6B6B", light: "#FFE5E5" },
  { bg: "#4ECDC4", light: "#E5F9F8" },
  { bg: "#45B7D1", light: "#E5F4FA" },
  { bg: "#96CEB4", light: "#EBF7F1" },
  { bg: "#FFEAA7", light: "#FFFBEB" },
  { bg: "#DDA0DD", light: "#F8EFF8" },
  { bg: "#F0A500", light: "#FEF3D7" },
  { bg: "#FF8B94", light: "#FFE8EA" },
];

const HEB_MONTH_NAMES = {
  [months.TISHREI]: "תשרי", [months.CHESHVAN]: "חשוון", [months.KISLEV]: "כסלו",
  [months.TEVET]: "טבת", [months.SHVAT]: "שבט", [months.ADAR_I]: "אדר א׳",
  [months.ADAR_II]: "אדר ב׳", [months.NISAN]: "ניסן", [months.IYAR]: "אייר",
  [months.SIVAN]: "סיוון", [months.TAMUZ]: "תמוז", [months.AV]: "אב", [months.ELUL]: "אלול",
};
const GREG_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const DAYS_SHORT = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];
const REMINDER_TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i/2)).padStart(2,"0")}:${i%2===0?"00":"30"}`);

// ===== תיקון ניווט חודשים עבריים =====
function getMonthOrder(hYear) {
  // סדר חודשים נכון לפי השנה (מעוברת/רגילה)
  const leap = HDate.isLeapYear(hYear);
  return [
    months.TISHREI, months.CHESHVAN, months.KISLEV, months.TEVET, months.SHVAT,
    ...(leap ? [months.ADAR_I, months.ADAR_II] : [months.NISAN]),
    ...(leap ? [months.IYAR] : [months.IYAR]),
    months.SIVAN, months.TAMUZ, months.AV, months.ELUL,
    ...(leap ? [] : []),
  ].filter((v, i, a) => a.indexOf(v) === i); // הסר כפילויות
}

function getValidMonthForYear(hMonth, hYear) {
  const order = getMonthOrder(hYear);
  // אם חודש לא קיים בשנה (כגון אדר א' בשנה רגילה) — החזר ניסן
  if (!order.includes(hMonth)) {
    if (hMonth === months.ADAR_I || hMonth === months.ADAR_II) return months.NISAN;
    return order[0];
  }
  return hMonth;
}

function nextHMonth(hMonth, hYear) {
  const order = getMonthOrder(hYear);
  const idx = order.indexOf(hMonth);
  if (idx === -1) return { hMonth: order[0], hYear: hYear + 1 };
  if (idx < order.length - 1) return { hMonth: order[idx + 1], hYear };
  // עבר לשנה הבאה — תשרי
  return { hMonth: months.TISHREI, hYear: hYear + 1 };
}

function prevHMonth(hMonth, hYear) {
  const order = getMonthOrder(hYear);
  const idx = order.indexOf(hMonth);
  if (idx > 0) return { hMonth: order[idx - 1], hYear };
  // חזר לשנה הקודמת — אלול
  return { hMonth: months.ELUL, hYear: hYear - 1 };
}

function getHebrewMonthDays(hYear, hMonth) {
  const validMonth = getValidMonthForYear(hMonth, hYear);
  const daysInMonth = HDate.daysInMonth(validMonth, hYear);
  return Array.from({ length: daysInMonth }, (_, i) => {
    const hd = new HDate(i + 1, validMonth, hYear);
    const gDate = hd.greg();
    return { hDay: i + 1, hDate: hd, gDate, dow: gDate.getDay() };
  });
}

function numToHebrew(n) {
  const t = ["","א","ב","ג","ד","ה","ו","ז","ח","ט","י","יא","יב","יג","יד","טו","טז","יז","יח","יט","כ","כא","כב","כג","כד","כה","כו","כז","כח","כט","ל"];
  return t[n] || n.toString();
}

function gKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function buildGcalLink(gDate) {
  const p = n => String(n).padStart(2,'0');
  const ds = `${gDate.getFullYear()}${p(gDate.getMonth()+1)}${p(gDate.getDate())}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("ביקור אצל סבא וסבתא 💛")}&dates=${ds}/${ds}&sf=true&output=xml`;
}

// שלח OTP דרך EmailJS
async function sendOTPEmail(email, code, name) {
  await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: email,
        to_name: name || email,
        visit_date: `קוד הכניסה שלך: ${code} (בתוקף ל-10 דקות)`,
      },
    }),
  });
}

function CharediGrandparents({ size = 140 }) {
  return (
    <svg width={size} height={size*0.75} viewBox="0 0 160 120" fill="none">
      <rect x="18" y="62" width="34" height="42" rx="6" fill="#1a1a1a"/>
      <rect x="24" y="64" width="22" height="30" rx="3" fill="white"/>
      <polygon points="35,66 33,72 35,76 37,72" fill="#8B0000"/>
      <circle cx="35" cy="50" r="14" fill="#F5CBA7"/>
      <ellipse cx="35" cy="37" rx="18" ry="4" fill="#1a1a1a"/>
      <rect x="27" y="30" width="16" height="10" rx="3" fill="#1a1a1a"/>
      <path d="M21 50 Q17 55 19 62" stroke="#8B6914" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M49 50 Q53 55 51 62" stroke="#8B6914" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M25 58 Q35 68 45 58 Q42 72 35 74 Q28 72 25 58Z" fill="#d4b896" opacity="0.8"/>
      <circle cx="30" cy="50" r="2" fill="#4a3728"/><circle cx="40" cy="50" r="2" fill="#4a3728"/>
      <path d="M30 57 Q35 61 40 57" stroke="#c0906a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <rect x="8" y="65" width="10" height="6" rx="3" fill="#1a1a1a"/>
      <rect x="52" y="65" width="10" height="6" rx="3" fill="#1a1a1a"/>
      <rect x="108" y="62" width="34" height="42" rx="6" fill="#2c4a6e"/>
      <circle cx="125" cy="50" r="14" fill="#F5CBA7"/>
      <path d="M111 47 Q125 35 139 47 Q137 38 125 36 Q113 38 111 47Z" fill="#8B0000"/>
      <rect x="111" y="45" width="28" height="8" rx="2" fill="#8B0000"/>
      <circle cx="120" cy="50" r="2" fill="#4a3728"/><circle cx="130" cy="50" r="2" fill="#4a3728"/>
      <path d="M120 57 Q125 62 130 57" stroke="#c0906a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="117" cy="54" r="3" fill="#FFB6C1" opacity="0.5"/>
      <circle cx="133" cy="54" r="3" fill="#FFB6C1" opacity="0.5"/>
      <rect x="98" y="65" width="10" height="6" rx="3" fill="#2c4a6e"/>
      <rect x="142" y="65" width="10" height="6" rx="3" fill="#2c4a6e"/>
      <text x="72" y="90" fontSize="18" textAnchor="middle">💛</text>
    </svg>
  );
}

export default function App() {
  const todayHD = new HDate();
  const [view, setView] = useState("welcome");
  const [currentUser, setCurrentUser] = useState(() => { try { return JSON.parse(localStorage.getItem("gp_currentUser") || "null"); } catch { return null; } });
  const [hYear, setHYear] = useState(todayHD.getFullYear());
  const [hMonth, setHMonth] = useState(todayHD.getMonth());
  const [visits, setVisits] = useState({});
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  // מצבי כניסה
  const [codeInput, setCodeInput] = useState("");
  const [codeOk, setCodeOk] = useState(false);
  const [codeError, setCodeError] = useState("");
  // מצבי OTP
  const [loginEmail, setLoginEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  // מצבי הרשמה
  const [regForm, setRegForm] = useState({ name: "", email: "", reminder: "same_day", reminderTime: "09:00", color: 0 });

  useEffect(() => {
    const unsubV = subscribeToVisits(v => { setVisits(v); setLoading(false); });
    const unsubM = subscribeToMembers(m => setMembers(m));
    return () => { unsubV(); unsubM(); };
  }, []);

  useEffect(() => {
    if (currentUser) setView("calendar");
  }, []); // eslint-disable-line

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function login(user) {
    setCurrentUser(user);
    localStorage.setItem("gp_currentUser", JSON.stringify(user));
    setView("calendar");
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("gp_currentUser");
    setView("welcome");
    setCodeOk(false);
    setCodeInput("");
    setOtpSent(false);
    setLoginEmail("");
    setOtpCode("");
  }

  // שלח OTP
  async function handleSendOTP() {
    const email = loginEmail.trim().toLowerCase();
    if (!email) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      const allMembers = await getMembers();
      const member = allMembers.find(m => m.email?.toLowerCase() === email);
      if (!member) {
        setOtpError("לא מצאנו אימייל זה — אולי עוד לא נרשמת?");
        setOtpLoading(false);
        return;
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await saveOTP(email, code);
      await sendOTPEmail(email, code, member.name);
      setOtpSent(true);
      showToast(`קוד נשלח ל-${email} 📧`);
    } catch (e) {
      setOtpError("שגיאה בשליחת קוד, נסה שוב");
    }
    setOtpLoading(false);
  }

  // אמת OTP
  async function handleVerifyOTP() {
    const email = loginEmail.trim().toLowerCase();
    setOtpLoading(true);
    setOtpError("");
    try {
      const valid = await verifyOTP(email, otpCode.trim());
      if (!valid) { setOtpError("קוד שגוי או פג תוקף, נסה שוב"); setOtpLoading(false); return; }
      const allMembers = await getMembers();
      const member = allMembers.find(m => m.email?.toLowerCase() === email);
      login(member);
      showToast(`ברוך הבא, ${member.name}! 👋`);
    } catch (e) {
      setOtpError("שגיאה, נסה שוב");
    }
    setOtpLoading(false);
  }

  async function handleRegister() {
    if (!regForm.name.trim() || !regForm.email.trim()) return;
    const allMembers = await getMembers();
    if (allMembers.find(m => m.name === regForm.name.trim())) {
      setOtpError("השם כבר קיים — נסה להתחבר");
      setView("login"); return;
    }
    if (allMembers.find(m => m.email?.toLowerCase() === regForm.email.trim().toLowerCase())) {
      setOtpError("האימייל כבר קיים — נסה להתחבר");
      setView("login"); return;
    }
    const newMember = {
      id: Date.now(), name: regForm.name.trim(), email: regForm.email.trim().toLowerCase(),
      reminder: regForm.reminder, reminderTime: regForm.reminderTime, colorIdx: regForm.color,
    };
    await saveMembers([...allMembers, newMember]);
    login(newMember);
    showToast(`שלום ${newMember.name}! נרשמת בהצלחה 🎉`);
  }

  async function handleSaveSettings(updated) {
    const updatedMembers = members.map(m => m.id === currentUser.id ? { ...m, ...updated } : m);
    await saveMembers(updatedMembers);
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    localStorage.setItem("gp_currentUser", JSON.stringify(updatedUser));
    setShowSettings(false);
    showToast("ההגדרות נשמרו ✅");
  }

  async function toggleVisit(key) {
    const existing = visits[key] || [];
    const alreadyIn = existing.find(v => v.id === currentUser.id);
    let updated;
    if (alreadyIn) {
      const filtered = existing.filter(v => v.id !== currentUser.id);
      updated = { ...visits };
      if (!filtered.length) delete updated[key]; else updated[key] = filtered;
      showToast("הסרת את הביקור 🗓️", "info");
    } else {
      updated = { ...visits, [key]: [...existing, { id: currentUser.id, name: currentUser.name, colorIdx: currentUser.colorIdx }] };
      showToast("נרשמת לביקור! 💛");
    }
    await saveVisits(updated);
    setShowDayModal(false);
  }

  // תיקון: ודא שהחודש תקין לשנה הנוכחית
  const validMonth = useMemo(() => getValidMonthForYear(hMonth, hYear), [hMonth, hYear]);
  const monthDays = useMemo(() => getHebrewMonthDays(hYear, validMonth), [hYear, validMonth]);
  const firstDow = monthDays[0]?.dow ?? 0;
  const todayKey = todayStr();
  const upcoming = Object.entries(visits).filter(([k]) => k >= todayKey).sort(([a],[b]) => a.localeCompare(b)).slice(0, 8);

  function goNext() { const n = nextHMonth(validMonth, hYear); setHMonth(n.hMonth); setHYear(n.hYear); }
  function goPrev() { const p = prevHMonth(validMonth, hYear); setHMonth(p.hMonth); setHYear(p.hYear); }

  const monthGregLabel = useMemo(() => {
    try { const gd = new HDate(1, validMonth, hYear).greg(); return `${GREG_MONTHS[gd.getMonth()]} ${gd.getFullYear()}`; } catch { return ""; }
  }, [validMonth, hYear]);

  if (loading && view === "calendar") {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF8F0" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>⏳</div><p style={{ color: "#FF8C42", fontWeight: 700, fontSize: 18 }}>טוען...</p></div>
    </div>;
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #FFF8F0, #FFF0E8, #FFF8F0)", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {toast && <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#4CAF50" : "#2196F3", color: "#fff", padding: "12px 28px", borderRadius: 40, zIndex: 9999, fontWeight: 600, fontSize: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", whiteSpace: "nowrap" }}>{toast.msg}</div>}

      {/* ===== WELCOME ===== */}
      {view === "welcome" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 28, padding: "48px 56px", boxShadow: "0 8px 60px rgba(255,140,60,0.13)", width: "100%", maxWidth: 480, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><CharediGrandparents /></div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#2D1B00", margin: "0 0 8px" }}>ביקורים אצל סבא וסבתא</h1>
            <p style={{ color: "#999", fontSize: 15, marginBottom: 36 }}>תכנון ביקורים משפחתי משותף 💛</p>
            {!codeOk ? (
              <div>
                <p style={{ fontSize: 14, color: "#666", marginBottom: 14 }}>הזן את קוד הגישה המשפחתי</p>
                <input type="password" placeholder="קוד משפחתי..." value={codeInput}
                  onChange={e => setCodeInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (codeInput.trim() === FAMILY_CODE ? (setCodeOk(true), setCodeError("")) : setCodeError("קוד שגוי 🙈"))} style={inputStyle} />
                {codeError && <p style={{ color: "#f44336", fontSize: 13 }}>{codeError}</p>}
                <button onClick={() => codeInput.trim() === FAMILY_CODE ? (setCodeOk(true), setCodeError("")) : setCodeError("קוד שגוי 🙈")} style={btnPrimary}>כניסה ←</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={() => setView("register")} style={btnPrimary}>👤 הרשמה ראשונית</button>
                <button onClick={() => { setOtpSent(false); setLoginEmail(""); setOtpCode(""); setOtpError(""); setView("login"); }} style={btnSecondary}>🔑 כבר נרשמתי — כניסה</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== LOGIN (OTP) ===== */}
      {view === "login" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 28, padding: "44px 52px", boxShadow: "0 8px 60px rgba(255,140,60,0.13)", width: "100%", maxWidth: 440, textAlign: "center" }}>
            <button onClick={() => setView("welcome")} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6B35", fontSize: 15, fontWeight: 700, marginBottom: 20, padding: 0, display: "block" }}>← חזרה</button>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{otpSent ? "📨" : "🔑"}</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#2D1B00", margin: "0 0 8px" }}>{otpSent ? "הזן קוד" : "כניסה"}</h2>
            <p style={{ color: "#999", fontSize: 14, marginBottom: 28 }}>
              {otpSent ? `קוד נשלח ל-${loginEmail}` : "הכנס את האימייל שלך לקבלת קוד"}
            </p>
            {!otpSent ? (
              <div style={{ textAlign: "right" }}>
                <label style={labelStyle}>אימייל</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={loginEmail}
                  onChange={e => { setLoginEmail(e.target.value); setOtpError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSendOTP()} />
                {otpError && <p style={{ color: "#f44336", fontSize: 13, margin: "-8px 0 12px" }}>{otpError}</p>}
                <button onClick={handleSendOTP} disabled={otpLoading || !loginEmail.trim()} style={{ ...btnPrimary, opacity: !loginEmail.trim() || otpLoading ? 0.5 : 1 }}>
                  {otpLoading ? "שולח..." : "שלח קוד 📧"}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "right" }}>
                <label style={labelStyle}>קוד בן 6 ספרות</label>
                <input style={{ ...inputStyle, fontSize: 22, textAlign: "center", letterSpacing: 8 }}
                  type="text" inputMode="numeric" maxLength={6} placeholder="------"
                  value={otpCode} onChange={e => { setOtpCode(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOTP()} />
                {otpError && <p style={{ color: "#f44336", fontSize: 13, margin: "-8px 0 12px" }}>{otpError}</p>}
                <button onClick={handleVerifyOTP} disabled={otpLoading || otpCode.length !== 6} style={{ ...btnPrimary, opacity: otpCode.length !== 6 || otpLoading ? 0.5 : 1 }}>
                  {otpLoading ? "מאמת..." : "כניסה ←"}
                </button>
                <button onClick={() => { setOtpSent(false); setOtpCode(""); setOtpError(""); }} style={{ width: "100%", padding: "10px", marginTop: 8, background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: 14 }}>
                  שלח קוד מחדש
                </button>
              </div>
            )}
            <p style={{ marginTop: 16, fontSize: 13, color: "#aaa" }}>
              עוד לא נרשמת?{" "}<span onClick={() => setView("register")} style={{ color: "#FF6B35", cursor: "pointer", fontWeight: 700 }}>לחץ כאן להרשמה</span>
            </p>
          </div>
        </div>
      )}

      {/* ===== REGISTER ===== */}
      {view === "register" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 28, padding: "44px 52px", boxShadow: "0 8px 60px rgba(255,140,60,0.13)", width: "100%", maxWidth: 540 }}>
            <button onClick={() => setView("welcome")} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6B35", fontSize: 15, fontWeight: 700, marginBottom: 20, padding: 0 }}>← חזרה</button>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#2D1B00", margin: 0 }}>הרשמה ראשונית</h2>
              <p style={{ color: "#999", fontSize: 14, margin: "6px 0 0" }}>מלא פעם אחת — ותיכנס בקלות בכל פעם דרך האימייל</p>
            </div>
            <label style={labelStyle}>שם מלא *</label>
            <input style={inputStyle} placeholder="שם פרטי ומשפחה" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} />
            <label style={labelStyle}>אימייל * (לכניסה ותזכורות)</label>
            <input style={inputStyle} type="email" placeholder="your@email.com" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>מתי לשלוח תזכורת?</label>
                <select style={inputStyle} value={regForm.reminder} onChange={e => setRegForm(p => ({ ...p, reminder: e.target.value }))}>
                  <option value="day_before">יום לפני</option>
                  <option value="same_day">באותו יום</option>
                  <option value="both">שניהם</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>באיזו שעה?</label>
                <select style={inputStyle} value={regForm.reminderTime} onChange={e => setRegForm(p => ({ ...p, reminderTime: e.target.value }))}>
                  {REMINDER_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <label style={labelStyle}>צבע שלך בלוח</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              {COLORS.map((c, i) => (
                <div key={i} onClick={() => setRegForm(p => ({ ...p, color: i }))}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: c.bg, cursor: "pointer", border: regForm.color === i ? "3px solid #2D1B00" : "3px solid transparent", boxShadow: regForm.color === i ? `0 0 0 2px #fff,0 0 0 4px ${c.bg}` : "none", transition: "all .2s" }} />
              ))}
            </div>
            <button onClick={handleRegister} style={{ ...btnPrimary, opacity: regForm.name.trim() && regForm.email.trim() ? 1 : 0.5 }}>הירשם 🎉</button>
            <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#aaa" }}>
              כבר נרשמת?{" "}<span onClick={() => { setOtpSent(false); setLoginEmail(""); setOtpCode(""); setOtpError(""); setView("login"); }} style={{ color: "#FF6B35", cursor: "pointer", fontWeight: 700 }}>לחץ כאן לכניסה</span>
            </p>
          </div>
        </div>
      )}

      {/* ===== CALENDAR ===== */}
      {view === "calendar" && (
        <div style={{ padding: "24px 32px", maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CharediGrandparents />
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#2D1B00", margin: 0 }}>ביקורים אצל סבא וסבתא</h1>
                <p style={{ margin: 0, color: "#999", fontSize: 14 }}>שלום {currentUser?.name}! 👋</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setShowSettings(true)} style={btnOutline}>⚙️ ההגדרות שלי</button>
              <button onClick={() => setView("members")} style={btnOutlineOrange}>👨‍👩‍👧‍👦 המשפחה</button>
              <button onClick={logout} style={btnOutline}>יציאה</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 680px" }}>
              <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 4px 30px rgba(255,140,60,0.10)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", background: "linear-gradient(135deg, #FF8C42, #FF6B35)" }}>
                  <button onClick={goPrev} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: 22 }}>›</button>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>{HEB_MONTH_NAMES[validMonth]} {hYear}</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>{monthGregLabel}</div>
                  </div>
                  <button onClick={goNext} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: 22 }}>‹</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "14px 16px 4px" }}>
                  {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#bbb", padding: "4px 0" }}>{d}</div>)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 16px 20px", gap: 5 }}>
                  {Array.from({ length: firstDow }).map((_, i) => <div key={"e"+i} />)}
                  {monthDays.map((dayObj) => {
                    const key = gKey(dayObj.gDate);
                    const dv = visits[key] || [];
                    const isToday = key === todayKey, isPast = key < todayKey;
                    const isMe = currentUser && dv.find(v => v.id === currentUser.id);
                    return (
                      <div key={key} onClick={() => !isPast && (setSelectedDay({ ...dayObj, key }), setShowDayModal(true))}
                        style={{ minHeight: 76, borderRadius: 14, padding: "6px 5px", cursor: isPast ? "default" : "pointer", background: isMe ? COLORS[currentUser.colorIdx].light : isToday ? "#FFF8F0" : "#FAFAFA", border: isToday ? "2px solid #FF8C42" : isMe ? `2px solid ${COLORS[currentUser.colorIdx].bg}` : "2px solid transparent", opacity: isPast ? 0.35 : 1, transition: "all .15s" }}>
                        <div style={{ textAlign: "center", fontSize: 15, fontWeight: isToday ? 800 : 700, color: isToday ? "#FF6B35" : "#2D1B00", lineHeight: 1.1 }}>{numToHebrew(dayObj.hDay)}</div>
                        <div style={{ textAlign: "center", fontSize: 10, color: "#bbb", marginTop: 1, marginBottom: 3 }}>{dayObj.gDate.getDate()}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
                          {dv.slice(0,4).map((v, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS[v.colorIdx]?.bg || "#999", border: "1px solid #fff" }} title={v.name} />)}
                          {dv.length > 4 && <div style={{ fontSize: 8, color: "#999", fontWeight: 700 }}>+{dv.length-4}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {members.length > 0 && (
                <div style={{ marginTop: 14, background: "#fff", borderRadius: 16, padding: "12px 20px", boxShadow: "0 2px 15px rgba(0,0,0,0.05)", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>המשפחה:</span>
                  {members.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 13, height: 13, borderRadius: "50%", background: COLORS[m.colorIdx]?.bg || "#999" }} />
                      <span style={{ fontSize: 13, color: "#444", fontWeight: m.id === currentUser?.id ? 700 : 400 }}>{m.name}{m.id === currentUser?.id ? " (אני)" : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: "0 0 260px", minWidth: 220 }}>
              <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: 22, marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#2D1B00", fontWeight: 800 }}>📅 ביקורים קרובים</h3>
                {upcoming.length === 0 && <p style={{ color: "#bbb", fontSize: 13 }}>עוד לא שובצו ביקורים</p>}
                {upcoming.map(([key, vs]) => {
                  const gd = new Date(key), hd = new HDate(gd);
                  return (
                    <div key={key} style={{ marginBottom: 12, padding: "10px 14px", background: "#FFF8F0", borderRadius: 12, borderRight: "4px solid #FF8C42" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B00" }}>{numToHebrew(hd.getDate())} {HEB_MONTH_NAMES[hd.getMonth()]}</div>
                      <div style={{ fontSize: 11, color: "#bbb", marginBottom: 6 }}>{gd.getDate()}/{gd.getMonth()+1}/{gd.getFullYear()}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {vs.map((v, i) => <span key={i} style={{ background: COLORS[v.colorIdx]?.bg || "#999", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{v.name}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "linear-gradient(135deg, #FF8C42, #FF6B35)", borderRadius: 20, padding: 22, color: "#fff" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800 }}>הביקורים שלי</h3>
                <div style={{ fontSize: 40, fontWeight: 900, margin: "8px 0" }}>
                  {Object.entries(visits).filter(([k, vs]) => k >= todayKey && vs.find(v => v.id === currentUser?.id)).length}
                </div>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>ביקורים מתוכננים</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MEMBERS ===== */}
      {view === "members" && (
        <div style={{ padding: "24px 32px", maxWidth: 700, margin: "0 auto" }}>
          <button onClick={() => setView("calendar")} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6B35", fontSize: 16, fontWeight: 700, marginBottom: 20, padding: 0 }}>← חזרה ללוח</button>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#2D1B00", margin: "0 0 20px" }}>👨‍👩‍👧‍👦 בני המשפחה</h2>
          {members.map(m => (
            <div key={m.id} style={{ background: "#fff", borderRadius: 16, padding: "18px 22px", marginBottom: 12, boxShadow: "0 2px 15px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 16, borderRight: `4px solid ${COLORS[m.colorIdx]?.bg || "#999"}` }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: COLORS[m.colorIdx]?.bg || "#999", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 20 }}>{m.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#2D1B00" }}>{m.name} {m.id === currentUser?.id ? "(אני)" : ""}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{m.email && `📧 ${m.email}`}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>תזכורת: {m.reminder === "day_before" ? "יום לפני" : m.reminder === "same_day" ? "באותו יום" : "שניהם"} בשעה {m.reminderTime || "09:00"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: COLORS[m.colorIdx]?.bg }}>{Object.entries(visits).filter(([, vs]) => vs.find(v => v.id === m.id)).length}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>ביקורים</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== SETTINGS MODAL ===== */}
      {showSettings && currentUser && <SettingsModal user={currentUser} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />}

      {/* ===== DAY MODAL ===== */}
      {showDayModal && selectedDay && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowDayModal(false)}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#2D1B00" }}>{numToHebrew(selectedDay.hDay)} {HEB_MONTH_NAMES[selectedDay.hDate?.getMonth() ?? validMonth]}</div>
              <div style={{ fontSize: 14, color: "#bbb", marginTop: 4 }}>{selectedDay.gDate?.getDate()}/{(selectedDay.gDate?.getMonth()||0)+1}/{selectedDay.gDate?.getFullYear()}</div>
            </div>
            {(visits[selectedDay.key] || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: "#888", marginBottom: 10, fontWeight: 600 }}>מגיעים ביום הזה:</p>
                {(visits[selectedDay.key] || []).map((v, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 12px", background: COLORS[v.colorIdx]?.light, borderRadius: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS[v.colorIdx]?.bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{v.name[0]}</div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{v.name}</span>
                    {v.id === currentUser?.id && <span style={{ color: "#999", fontSize: 12 }}>(אני)</span>}
                  </div>
                ))}
              </div>
            )}
            {(() => {
              const isIn = (visits[selectedDay.key] || []).find(v => v.id === currentUser?.id);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => toggleVisit(selectedDay.key)} style={{ width: "100%", padding: "14px 20px", background: isIn ? "#FEE2E2" : "linear-gradient(135deg, #FF8C42, #FF6B35)", color: isIn ? "#DC2626" : "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>
                    {isIn ? "❌ הסר את הביקור שלי" : "✅ אני מגיע/ה!"}
                  </button>
                  <a href={buildGcalLink(selectedDay.gDate)} target="_blank" rel="noopener noreferrer"
                    style={{ width: "100%", padding: "13px 20px", background: "#fff", color: "#1a73e8", border: "2px solid #1a73e8", borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#1a73e8" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round"/><rect x="7" y="14" width="4" height="4" rx="1" fill="#1a73e8"/></svg>
                    הוסף ליומן גוגל 📅
                  </a>
                </div>
              );
            })()}
            <button onClick={() => setShowDayModal(false)} style={{ width: "100%", padding: "10px", marginTop: 8, background: "transparent", border: "none", cursor: "pointer", color: "#aaa", fontSize: 14 }}>סגור</button>
          </div>
        </div>
      )}
      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  );
}

function SettingsModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({ email: user.email || "", reminder: user.reminder || "same_day", reminderTime: user.reminderTime || "09:00", colorIdx: user.colorIdx ?? 0 });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 36, maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()} dir="rtl">
        <h3 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800, color: "#2D1B00" }}>⚙️ ההגדרות שלי</h3>
        <div style={{ background: "#FFF8F0", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 14, color: "#888" }}>
          <strong style={{ color: "#2D1B00" }}>שם:</strong> {user.name}
        </div>
        <label style={labelStyle}>אימייל</label>
        <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>מתי לשלוח תזכורת?</label>
            <select style={inputStyle} value={form.reminder} onChange={e => setForm(p => ({ ...p, reminder: e.target.value }))}>
              <option value="day_before">יום לפני</option>
              <option value="same_day">באותו יום</option>
              <option value="both">שניהם</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>באיזו שעה?</label>
            <select style={inputStyle} value={form.reminderTime} onChange={e => setForm(p => ({ ...p, reminderTime: e.target.value }))}>
              {REMINDER_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <label style={labelStyle}>צבע בלוח</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          {COLORS.map((c, i) => (
            <div key={i} onClick={() => setForm(p => ({ ...p, colorIdx: i }))}
              style={{ width: 36, height: 36, borderRadius: "50%", background: c.bg, cursor: "pointer", border: form.colorIdx === i ? "3px solid #2D1B00" : "3px solid transparent", boxShadow: form.colorIdx === i ? `0 0 0 2px #fff,0 0 0 4px ${c.bg}` : "none", transition: "all .2s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onSave(form)} style={{ ...btnPrimary, flex: 1, marginTop: 0 }}>שמור ✅</button>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "14px 20px", background: "#f5f5f5", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#888" }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

const REMINDER_TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i/2)).padStart(2,"0")}:${i%2===0?"00":"30"}`);
const inputStyle = { width: "100%", padding: "13px 16px", border: "2px solid #E5E0D8", borderRadius: 12, fontSize: 15, marginBottom: 14, outline: "none", fontFamily: "inherit", background: "#FAFAFA", direction: "rtl" };
const btnPrimary = { width: "100%", padding: "14px 20px", background: "linear-gradient(135deg, #FF8C42, #FF6B35)", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 700, marginTop: 8 };
const btnSecondary = { width: "100%", padding: "14px 20px", background: "#fff", color: "#FF6B35", border: "2px solid #FF8C42", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 700 };
const btnOutline = { background: "transparent", border: "2px solid #e0d0c0", borderRadius: 12, padding: "9px 18px", cursor: "pointer", color: "#888", fontSize: 14, fontWeight: 600 };
const btnOutlineOrange = { background: "transparent", border: "2px solid #FBBF24", borderRadius: 12, padding: "9px 18px", cursor: "pointer", color: "#B45309", fontSize: 14, fontWeight: 600 };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 };
