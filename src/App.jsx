import { useState, useEffect } from "react";

// ============================================================
// 🔧 הגדרות EmailJS — החלף את שלושת הערכים האלה בלבד!
// ============================================================
const EMAILJS_SERVICE_ID  = "service_XXXXXXX";
const EMAILJS_TEMPLATE_ID = "template_XXXXXXX";
const EMAILJS_PUBLIC_KEY  = "XXXXXXXXXXXXXXXXXXXX";
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

const HEBREW_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const HEBREW_DAYS = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];

// שעות מ-00:00 עד 23:30 בהפרש של חצי שעה
const REMINDER_TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

if (typeof window !== "undefined" && !window.emailjs) {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  script.onload = () => window.emailjs.init(EMAILJS_PUBLIC_KEY);
  document.head.appendChild(script);
}

async function sendEmailReminder(member, dateStr) {
  if (!member.email) return;
  if (!window.emailjs) return;
  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: member.email,
      to_name: member.name,
      visit_date: dateStr,
      app_link: window.location.href,
    });
  } catch (err) {
    console.error("שגיאה בשליחת מייל:", err);
  }
}

function checkAndSendReminders(visits, members) {
  const now = new Date();
  const today = todayStr();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  Object.entries(visits).forEach(([dk, visitors]) => {
    visitors.forEach(visitor => {
      const member = members.find(m => m.id === visitor.id);
      if (!member || !member.email) return;
      const rt = member.reminderTime || "09:00";
      if (currentTime < rt) return;
      const dateLabel = dk.split("-").reverse().join("/");
      const r = member.reminder || "same_day";
      if ((r === "day_before" || r === "both") && dk === tomorrowStr) {
        sendEmailReminder(member, `מחר (${dateLabel})`);
      }
      if ((r === "same_day" || r === "both") && dk === today) {
        sendEmailReminder(member, `היום (${dateLabel})`);
      }
    });
  });
}

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dkey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ===== סבא וסבתא חרדיים — SVG =====
function CharediGrandparents() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* סבא */}
      {/* גוף */}
      <rect x="18" y="62" width="34" height="42" rx="6" fill="#1a1a1a"/>
      {/* חולצה לבנה */}
      <rect x="24" y="64" width="22" height="30" rx="3" fill="white"/>
      {/* עניבה */}
      <polygon points="35,66 33,72 35,76 37,72" fill="#8B0000"/>
      {/* ראש */}
      <circle cx="35" cy="50" r="14" fill="#F5CBA7"/>
      {/* כובע שחור */}
      <ellipse cx="35" cy="37" rx="18" ry="4" fill="#1a1a1a"/>
      <rect x="27" y="30" width="16" height="10" rx="3" fill="#1a1a1a"/>
      {/* פאות */}
      <path d="M21 50 Q17 55 19 62" stroke="#8B6914" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M49 50 Q53 55 51 62" stroke="#8B6914" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* זקן */}
      <path d="M25 58 Q35 68 45 58 Q42 72 35 74 Q28 72 25 58Z" fill="#d4b896" opacity="0.8"/>
      {/* עיניים */}
      <circle cx="30" cy="50" r="2" fill="#4a3728"/>
      <circle cx="40" cy="50" r="2" fill="#4a3728"/>
      {/* חיוך */}
      <path d="M30 57 Q35 61 40 57" stroke="#c0906a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* ידיים */}
      <rect x="8" y="65" width="10" height="6" rx="3" fill="#1a1a1a"/>
      <rect x="52" y="65" width="10" height="6" rx="3" fill="#1a1a1a"/>

      {/* סבתא */}
      {/* גוף */}
      <rect x="108" y="62" width="34" height="42" rx="6" fill="#2c4a6e"/>
      {/* סינר / שמלה */}
      <path d="M112 75 Q125 72 138 75 L140 104 Q125 106 110 104Z" fill="#3a5f8a" opacity="0.5"/>
      {/* ראש */}
      <circle cx="125" cy="50" r="14" fill="#F5CBA7"/>
      {/* מטפחת */}
      <path d="M111 47 Q125 35 139 47 Q137 38 125 36 Q113 38 111 47Z" fill="#8B0000"/>
      <rect x="111" y="45" width="28" height="8" rx="2" fill="#8B0000"/>
      {/* שיער קצת נראה */}
      <path d="M113 50 Q111 55 113 60" stroke="#5a3a1a" strokeWidth="2" fill="none"/>
      <path d="M137 50 Q139 55 137 60" stroke="#5a3a1a" strokeWidth="2" fill="none"/>
      {/* עיניים */}
      <circle cx="120" cy="50" r="2" fill="#4a3728"/>
      <circle cx="130" cy="50" r="2" fill="#4a3728"/>
      {/* חיוך */}
      <path d="M120 57 Q125 62 130 57" stroke="#c0906a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* לחיים ורודות */}
      <circle cx="117" cy="54" r="3" fill="#FFB6C1" opacity="0.5"/>
      <circle cx="133" cy="54" r="3" fill="#FFB6C1" opacity="0.5"/>
      {/* ידיים */}
      <rect x="98" y="65" width="10" height="6" rx="3" fill="#2c4a6e"/>
      <rect x="142" y="65" width="10" height="6" rx="3" fill="#2c4a6e"/>

      {/* לב ביניהם */}
      <text x="72" y="90" fontSize="18" textAnchor="middle">💛</text>
    </svg>
  );
}

export default function App() {
  const today = new Date();
  const [view, setView] = useState("welcome"); // welcome | register | login | calendar | members
  const [currentUser, setCurrentUser] = useState(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [visits, setVisits] = useState(() => { try { return JSON.parse(localStorage.getItem("gp_visits") || "{}"); } catch { return {}; } });
  const [members, setMembers] = useState(() => { try { return JSON.parse(localStorage.getItem("gp_members") || "[]"); } catch { return []; } });
  const [regForm, setRegForm] = useState({ name: "", email: "", reminder: "same_day", reminderTime: "09:00", color: 0 });
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeOk, setCodeOk] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (members.length > 0 && Object.keys(visits).length > 0) {
      setTimeout(() => checkAndSendReminders(visits, members), 2000);
    }
  }, []); // eslint-disable-line

  useEffect(() => { try { localStorage.setItem("gp_visits", JSON.stringify(visits)); } catch {} }, [visits]);
  useEffect(() => { try { localStorage.setItem("gp_members", JSON.stringify(members)); } catch {} }, [members]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  function handleCodeSubmit() {
    if (codeInput.trim() === FAMILY_CODE) { setCodeOk(true); setCodeError(""); }
    else setCodeError("קוד שגוי, נסה שוב 🙈");
  }

  function handleRegister() {
    if (!regForm.name.trim()) return;
    if (members.find(m => m.name === regForm.name.trim())) {
      setLoginError("השם הזה כבר קיים — נסה להתחבר");
      setView("login");
      return;
    }
    const newMember = {
      id: Date.now(),
      name: regForm.name.trim(),
      email: regForm.email.trim(),
      reminder: regForm.reminder,
      reminderTime: regForm.reminderTime,
      colorIdx: regForm.color,
    };
    setMembers(prev => [...prev, newMember]);
    setCurrentUser(newMember);
    setView("calendar");
    showToast(`שלום ${newMember.name}! נרשמת בהצלחה 🎉`);
  }

  function handleLogin() {
    const found = members.find(m => m.name === loginName.trim());
    if (found) {
      setCurrentUser(found);
      setView("calendar");
      showToast(`ברוך הבא חזרה, ${found.name}! 👋`);
    } else {
      setLoginError("לא מצאנו אותך — אולי עוד לא נרשמת?");
    }
  }

  function saveSettings(updated) {
    setMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, ...updated } : m));
    setCurrentUser(prev => ({ ...prev, ...updated }));
    setShowSettings(false);
    showToast("ההגדרות נשמרו ✅");
  }

  function handleDayClick(day) {
    const key = dkey(year, month, day);
    if (key < todayStr()) return;
    setSelectedDay({ day, key });
    setShowDayModal(true);
  }

  function toggleVisit(key) {
    setVisits(prev => {
      const existing = prev[key] || [];
      const alreadyIn = existing.find(v => v.id === currentUser.id);
      if (alreadyIn) {
        const updated = existing.filter(v => v.id !== currentUser.id);
        showToast("הסרת את הביקור שלך 🗓️", "info");
        if (updated.length === 0) { const { [key]: _, ...rest } = prev; return rest; }
        return { ...prev, [key]: updated };
      } else {
        showToast("נרשמת לביקור! סבא וסבתא יהיו שמחים 💛");
        return { ...prev, [key]: [...existing, { id: currentUser.id, name: currentUser.name, colorIdx: currentUser.colorIdx }] };
      }
    });
    setShowDayModal(false);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const upcoming = Object.entries(visits).filter(([k]) => k >= todayStr()).sort(([a],[b]) => a.localeCompare(b)).slice(0, 8);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #FFF8F0 0%, #FFF0E8 50%, #FFF8F0 100%)", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>

      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#4CAF50" : "#2196F3", color: "#fff", padding: "12px 28px", borderRadius: 40, zIndex: 9999, fontWeight: 600, fontSize: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", whiteSpace: "nowrap" }}>{toast.msg}</div>
      )}

      {/* ===== WELCOME ===== */}
      {view === "welcome" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 28, padding: "48px 56px", boxShadow: "0 8px 60px rgba(255,140,60,0.13)", width: "100%", maxWidth: 480, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <CharediGrandparents />
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#2D1B00", margin: "0 0 8px" }}>ביקורים אצל סבא וסבתא</h1>
            <p style={{ color: "#999", fontSize: 15, marginBottom: 36 }}>תכנון ביקורים משפחתי משותף 💛</p>

            {!codeOk ? (
              <div>
                <p style={{ fontSize: 14, color: "#666", marginBottom: 14 }}>הזן את קוד הגישה המשפחתי</p>
                <input type="password" placeholder="קוד משפחתי..." value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCodeSubmit()}
                  style={inputStyle} />
                {codeError && <p style={{ color: "#f44336", fontSize: 13, margin: "4px 0 8px" }}>{codeError}</p>}
                <button onClick={handleCodeSubmit} style={btnPrimary}>כניסה ←</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={() => setView("register")} style={btnPrimary}>
                  👤 הרשמה ראשונית
                </button>
                <button onClick={() => { setLoginName(""); setLoginError(""); setView("login"); }} style={btnSecondary}>
                  🔑 כבר נרשמתי — כניסה
                </button>
              </div>
            )}
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
              <p style={{ color: "#999", fontSize: 14, margin: "6px 0 0" }}>מלא פעם אחת — ותמיד תיכנס בקלות</p>
            </div>

            <label style={labelStyle}>שם מלא *</label>
            <input style={inputStyle} placeholder="שם פרטי ומשפחה"
              value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} />

            <label style={labelStyle}>אימייל (לתזכורות)</label>
            <input style={inputStyle} type="email" placeholder="your@email.com"
              value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>מתי לשלוח תזכורת?</label>
                <select style={inputStyle} value={regForm.reminder}
                  onChange={e => setRegForm(p => ({ ...p, reminder: e.target.value }))}>
                  <option value="day_before">יום לפני</option>
                  <option value="same_day">באותו יום</option>
                  <option value="both">שניהם</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>באיזו שעה?</label>
                <select style={inputStyle} value={regForm.reminderTime}
                  onChange={e => setRegForm(p => ({ ...p, reminderTime: e.target.value }))}>
                  {REMINDER_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <label style={labelStyle}>צבע שלך בלוח</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              {COLORS.map((c, i) => (
                <div key={i} onClick={() => setRegForm(p => ({ ...p, color: i }))}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: c.bg, cursor: "pointer", border: regForm.color === i ? "3px solid #2D1B00" : "3px solid transparent", boxShadow: regForm.color === i ? `0 0 0 2px #fff, 0 0 0 4px ${c.bg}` : "none", transition: "all 0.2s" }} />
              ))}
            </div>

            <button onClick={handleRegister} style={{ ...btnPrimary, opacity: regForm.name.trim() ? 1 : 0.5 }}>
              הירשם 🎉
            </button>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#aaa" }}>
              כבר נרשמת?{" "}
              <span onClick={() => { setLoginName(""); setLoginError(""); setView("login"); }}
                style={{ color: "#FF6B35", cursor: "pointer", fontWeight: 700 }}>לחץ כאן לכניסה</span>
            </p>
          </div>
        </div>
      )}

      {/* ===== LOGIN ===== */}
      {view === "login" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 28, padding: "44px 52px", boxShadow: "0 8px 60px rgba(255,140,60,0.13)", width: "100%", maxWidth: 420, textAlign: "center" }}>
            <button onClick={() => setView("welcome")} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6B35", fontSize: 15, fontWeight: 700, marginBottom: 20, padding: 0, display: "block" }}>← חזרה</button>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔑</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#2D1B00", margin: "0 0 8px" }}>כניסה</h2>
            <p style={{ color: "#999", fontSize: 14, marginBottom: 28 }}>הכנס את שמך כפי שנרשמת</p>

            <div style={{ textAlign: "right" }}>
              <label style={labelStyle}>שם מלא</label>
              <input style={inputStyle} placeholder="שם פרטי ומשפחה"
                value={loginName}
                onChange={e => { setLoginName(e.target.value); setLoginError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
              {loginError && <p style={{ color: "#f44336", fontSize: 13, margin: "-8px 0 12px" }}>{loginError}</p>}
            </div>

            <button onClick={handleLogin} style={{ ...btnPrimary, opacity: loginName.trim() ? 1 : 0.5 }}>
              כניסה ←
            </button>

            <p style={{ marginTop: 16, fontSize: 13, color: "#aaa" }}>
              עוד לא נרשמת?{" "}
              <span onClick={() => setView("register")}
                style={{ color: "#FF6B35", cursor: "pointer", fontWeight: 700 }}>לחץ כאן להרשמה</span>
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
              <button onClick={() => { setView("welcome"); setCodeOk(false); setCodeInput(""); }} style={btnOutline}>יציאה</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 680px" }}>
              <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 4px 30px rgba(255,140,60,0.10)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px", background: "linear-gradient(135deg, #FF8C42, #FF6B35)" }}>
                  <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }}
                    style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: 22 }}>›</button>
                  <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: 0 }}>{HEBREW_MONTHS[month]} {year}</h2>
                  <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }}
                    style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: 22 }}>‹</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "16px 20px 6px" }}>
                  {HEBREW_DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#bbb", padding: "4px 0" }}>{d}</div>)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 20px 24px", gap: 6 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={"e"+i} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const key = dkey(year, month, day);
                    const dayVisits = visits[key] || [];
                    const isToday = key === todayStr();
                    const isPast = key < todayStr();
                    const isMyVisit = dayVisits.find(v => v.id === currentUser?.id);
                    return (
                      <div key={day} onClick={() => !isPast && handleDayClick(day)} style={{ minHeight: 72, borderRadius: 14, padding: "8px 6px", cursor: isPast ? "default" : "pointer", background: isMyVisit ? COLORS[currentUser.colorIdx].light : isToday ? "#FFF8F0" : "#FAFAFA", border: isToday ? "2px solid #FF8C42" : isMyVisit ? `2px solid ${COLORS[currentUser.colorIdx].bg}` : "2px solid transparent", opacity: isPast ? 0.35 : 1, transition: "all 0.15s" }}>
                        <div style={{ textAlign: "center", fontSize: 15, fontWeight: isToday ? 800 : 600, color: isToday ? "#FF6B35" : "#2D1B00", marginBottom: 4 }}>{day}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
                          {dayVisits.slice(0, 4).map((v, vi) => <div key={vi} style={{ width: 11, height: 11, borderRadius: "50%", background: COLORS[v.colorIdx]?.bg || "#999", border: "1.5px solid #fff" }} title={v.name} />)}
                          {dayVisits.length > 4 && <div style={{ fontSize: 9, color: "#999", fontWeight: 700 }}>+{dayVisits.length-4}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {members.length > 0 && (
                <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, padding: "14px 20px", boxShadow: "0 2px 15px rgba(0,0,0,0.05)", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>המשפחה:</span>
                  {members.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: COLORS[m.colorIdx]?.bg || "#999" }} />
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
                  const [y, m, d] = key.split("-");
                  return (
                    <div key={key} style={{ marginBottom: 12, padding: "10px 14px", background: "#FFF8F0", borderRadius: 12, borderRight: "4px solid #FF8C42" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2D1B00", marginBottom: 6 }}>{parseInt(d)} {HEBREW_MONTHS[parseInt(m)-1]} {y}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {vs.map((v, i) => <span key={i} style={{ background: COLORS[v.colorIdx]?.bg || "#999", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{v.name}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "linear-gradient(135deg, #FF8C42, #FF6B35)", borderRadius: 20, padding: 22, color: "#fff" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800 }}>הביקורים שלי</h3>
                <div style={{ fontSize: 40, fontWeight: 900, margin: "8px 0" }}>
                  {Object.entries(visits).filter(([k, vs]) => k >= todayStr() && vs.find(v => v.id === currentUser?.id)).length}
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
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                  תזכורת: {m.reminder === "day_before" ? "יום לפני" : m.reminder === "same_day" ? "באותו יום" : "שניהם"} בשעה {m.reminderTime || "09:00"}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: COLORS[m.colorIdx]?.bg }}>{Object.entries(visits).filter(([k, vs]) => vs.find(v => v.id === m.id)).length}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>ביקורים</div>
              </div>
            </div>
          ))}
          {members.length === 0 && <p style={{ color: "#bbb", textAlign: "center", padding: 40 }}>אין בני משפחה עדיין</p>}
        </div>
      )}

      {/* ===== SETTINGS MODAL ===== */}
      {showSettings && currentUser && (
        <SettingsModal user={currentUser} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}

      {/* ===== DAY MODAL ===== */}
      {showDayModal && selectedDay && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={() => setShowDayModal(false)}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 36, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#2D1B00", textAlign: "center" }}>{selectedDay.day} {HEBREW_MONTHS[month]} {year}</h3>
            <p style={{ textAlign: "center", color: "#999", margin: "0 0 24px", fontSize: 14 }}>מי מגיע?</p>
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
                <button onClick={() => toggleVisit(selectedDay.key)} style={{ width: "100%", padding: "14px 20px", background: isIn ? "#FEE2E2" : "linear-gradient(135deg, #FF8C42, #FF6B35)", color: isIn ? "#DC2626" : "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>
                  {isIn ? "❌ הסר את הביקור שלי" : "✅ אני מגיע/ה!"}
                </button>
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
  const [form, setForm] = useState({
    email: user.email || "",
    reminder: user.reminder || "same_day",
    reminderTime: user.reminderTime || "09:00",
    colorIdx: user.colorIdx ?? 0,
  });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 36, maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()} dir="rtl">
        <h3 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800, color: "#2D1B00" }}>⚙️ ההגדרות שלי</h3>
        <div style={{ background: "#FFF8F0", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 14, color: "#888" }}>
          <strong style={{ color: "#2D1B00" }}>שם:</strong> {user.name}
        </div>
        <label style={labelStyle}>אימייל</label>
        <input style={inputStyle} type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
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
              style={{ width: 36, height: 36, borderRadius: "50%", background: c.bg, cursor: "pointer", border: form.colorIdx === i ? "3px solid #2D1B00" : "3px solid transparent", boxShadow: form.colorIdx === i ? `0 0 0 2px #fff, 0 0 0 4px ${c.bg}` : "none", transition: "all 0.2s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onSave(form)} style={{ ...btnPrimary, flex: 1, marginTop: 0 }}>שמור שינויים ✅</button>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "14px 20px", background: "#f5f5f5", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#888" }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "13px 16px", border: "2px solid #E5E0D8", borderRadius: 12, fontSize: 15, marginBottom: 14, outline: "none", fontFamily: "inherit", background: "#FAFAFA", direction: "rtl" };
const btnPrimary = { width: "100%", padding: "14px 20px", background: "linear-gradient(135deg, #FF8C42, #FF6B35)", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 700, marginTop: 8 };
const btnSecondary = { width: "100%", padding: "14px 20px", background: "#fff", color: "#FF6B35", border: "2px solid #FF8C42", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 700, marginTop: 0 };
const btnOutline = { background: "transparent", border: "2px solid #e0d0c0", borderRadius: 12, padding: "9px 18px", cursor: "pointer", color: "#888", fontSize: 14, fontWeight: 600 };
const btnOutlineOrange = { background: "transparent", border: "2px solid #FBBF24", borderRadius: 12, padding: "9px 18px", cursor: "pointer", color: "#B45309", fontSize: 14, fontWeight: 600 };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 };
