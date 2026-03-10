import { useState, useEffect } from "react";

// ============================================================
// 🔧 הגדרות EmailJS — החלף את שלושת הערכים האלה בלבד!
// ============================================================
const EMAILJS_SERVICE_ID  = "service_XXXXXXX";
const EMAILJS_TEMPLATE_ID = "template_XXXXXXX";
const EMAILJS_PUBLIC_KEY  = "XXXXXXXXXXXXXXXXXXXX";
// ============================================================

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
  const today = todayStr();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
  const currentHour = new Date().getHours();

  Object.entries(visits).forEach(([dk, visitors]) => {
    visitors.forEach(visitor => {
      const member = members.find(m => m.id === visitor.id);
      if (!member || !member.email) return;
      const reminderHour = parseInt(member.reminderHour || "9");
      if (currentHour < reminderHour) return;
      const dateLabel = dk.split("-").reverse().join("/");
      const r = member.reminder;
      if ((r === "day_before" || r === "both") && dk === tomorrowStr) {
        sendEmailReminder(member, `מחר (${dateLabel})`);
      }
      if ((r === "same_day" || r === "both") && dk === today) {
        sendEmailReminder(member, `היום (${dateLabel})`);
      }
    });
  });
}

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
const REMINDER_HOURS = ["6","7","8","9","10","11","12"];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export default function App() {
  const today = new Date();
  const [view, setView] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [visits, setVisits] = useState(() => { try { return JSON.parse(localStorage.getItem("gp_visits") || "{}"); } catch { return {}; } });
  const [members, setMembers] = useState(() => { try { return JSON.parse(localStorage.getItem("gp_members") || "[]"); } catch { return []; } });
  const [loginForm, setLoginForm] = useState({ name: "", email: "", reminder: "same_day", reminderHour: "9", color: 0 });
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState("code");

  useEffect(() => {
    if (members.length > 0 && Object.keys(visits).length > 0) {
      setTimeout(() => checkAndSendReminders(visits, members), 2000);
    }
  }, []); // eslint-disable-line

  useEffect(() => { try { localStorage.setItem("gp_visits", JSON.stringify(visits)); } catch {} }, [visits]);
  useEffect(() => { try { localStorage.setItem("gp_members", JSON.stringify(members)); } catch {} }, [members]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleCodeSubmit() {
    if (codeInput === FAMILY_CODE) { setStep("form"); setCodeError(""); }
    else setCodeError("קוד שגוי, נסה שוב 🙈");
  }

  function handleRegister() {
    if (!loginForm.name.trim()) return;
    const existing = members.find(m => m.name === loginForm.name.trim());
    if (existing) {
      setCurrentUser(existing);
      setView("calendar");
      showToast(`ברוך הבא חזרה, ${existing.name}! 👋`);
      return;
    }
    const newMember = {
      id: Date.now(),
      name: loginForm.name.trim(),
      email: loginForm.email.trim(),
      reminder: loginForm.reminder,
      reminderHour: loginForm.reminderHour,
      colorIdx: loginForm.color,
    };
    setMembers(prev => [...prev, newMember]);
    setCurrentUser(newMember);
    setView("calendar");
    showToast(`שלום ${newMember.name}! נרשמת בהצלחה 🎉`);
  }

  function saveSettings(updated) {
    setMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, ...updated } : m));
    setCurrentUser(prev => ({ ...prev, ...updated }));
    setShowSettings(false);
    showToast("ההגדרות נשמרו ✅");
  }

  function handleDayClick(day) {
    const key = dateKey(year, month, day);
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

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#4CAF50" : "#2196F3", color: "#fff", padding: "12px 28px", borderRadius: 40, zIndex: 9999, fontWeight: 600, fontSize: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", whiteSpace: "nowrap" }}>{toast.msg}</div>
      )}

      {/* ===== LOGIN ===== */}
      {view === "login" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 28, padding: "48px 56px", boxShadow: "0 8px 60px rgba(255,140,60,0.13)", width: "100%", maxWidth: 540, textAlign: "center" }}>
            <div style={{ fontSize: 72, marginBottom: 12 }}>👴👵</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#2D1B00", margin: "0 0 8px" }}>ביקורים אצל סבא וסבתא</h1>
            <p style={{ color: "#999", fontSize: 16, marginBottom: 36 }}>תכנון ביקורים משפחתי משותף 💛</p>

            {step === "code" && (
              <div>
                <p style={{ fontSize: 15, color: "#666", marginBottom: 16 }}>הזן את קוד הגישה המשפחתי</p>
                <input type="password" placeholder="קוד משפחתי..." value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCodeSubmit()}
                  style={inputStyle} />
                {codeError && <p style={{ color: "#f44336", fontSize: 13, margin: "8px 0 0" }}>{codeError}</p>}
                <button onClick={handleCodeSubmit} style={btnPrimary}>כניסה ←</button>
              </div>
            )}

            {step === "form" && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 15, color: "#666", marginBottom: 24, textAlign: "center" }}>ספר לנו מי אתה 😊</p>

                <label style={labelStyle}>שם מלא *</label>
                <input style={inputStyle} placeholder="שם פרטי ומשפחה"
                  value={loginForm.name} onChange={e => setLoginForm(p => ({ ...p, name: e.target.value }))} />

                <label style={labelStyle}>אימייל (לתזכורות)</label>
                <input style={inputStyle} type="email" placeholder="your@email.com"
                  value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>מתי לשלוח תזכורת?</label>
                    <select style={inputStyle} value={loginForm.reminder}
                      onChange={e => setLoginForm(p => ({ ...p, reminder: e.target.value }))}>
                      <option value="day_before">יום לפני</option>
                      <option value="same_day">באותו יום</option>
                      <option value="both">שניהם</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>באיזו שעה?</label>
                    <select style={inputStyle} value={loginForm.reminderHour}
                      onChange={e => setLoginForm(p => ({ ...p, reminderHour: e.target.value }))}>
                      {REMINDER_HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                </div>

                <label style={labelStyle}>צבע שלך בלוח</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                  {COLORS.map((c, i) => (
                    <div key={i} onClick={() => setLoginForm(p => ({ ...p, color: i }))}
                      style={{ width: 36, height: 36, borderRadius: "50%", background: c.bg, cursor: "pointer", border: loginForm.color === i ? "3px solid #2D1B00" : "3px solid transparent", boxShadow: loginForm.color === i ? `0 0 0 2px #fff, 0 0 0 4px ${c.bg}` : "none", transition: "all 0.2s" }} />
                  ))}
                </div>

                <button onClick={handleRegister} style={{ ...btnPrimary, opacity: loginForm.name.trim() ? 1 : 0.5 }}>
                  אני בפנים! 🎉
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CALENDAR ===== */}
      {view === "calendar" && (
        <div style={{ padding: "24px 32px", maxWidth: 1300, margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 52 }}>👴👵</div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#2D1B00", margin: 0 }}>ביקורים אצל סבא וסבתא</h1>
                <p style={{ margin: 0, color: "#999", fontSize: 14 }}>שלום {currentUser?.name}! 👋</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowSettings(true)} style={btnOutline}>⚙️ ההגדרות שלי</button>
              <button onClick={() => setView("members")} style={btnOutlineOrange}>👨‍👩‍👧‍👦 המשפחה</button>
              <button onClick={() => { setView("login"); setStep("code"); setCodeInput(""); }} style={btnOutline}>החלף משתמש</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

            {/* Calendar */}
            <div style={{ flex: "1 1 680px" }}>
              <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 4px 30px rgba(255,140,60,0.10)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px", background: "linear-gradient(135deg, #FF8C42, #FF6B35)" }}>
                  <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }}
                    style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: 20 }}>›</button>
                  <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: 0 }}>{HEBREW_MONTHS[month]} {year}</h2>
                  <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }}
                    style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: 20 }}>‹</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "16px 20px 6px" }}>
                  {HEBREW_DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#bbb", padding: "4px 0" }}>{d}</div>)}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 20px 24px", gap: 6 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={"e"+i} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const key = dateKey(year, month, day);
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

            {/* Sidebar */}
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
                  תזכורת: {m.reminder === "day_before" ? "יום לפני" : m.reminder === "same_day" ? "באותו יום" : "שניהם"} בשעה {m.reminderHour || "9"}:00
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
    reminderHour: user.reminderHour || "9",
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
            <select style={inputStyle} value={form.reminderHour} onChange={e => setForm(p => ({ ...p, reminderHour: e.target.value }))}>
              {REMINDER_HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
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
const btnOutline = { background: "transparent", border: "2px solid #e0d0c0", borderRadius: 12, padding: "9px 18px", cursor: "pointer", color: "#888", fontSize: 14, fontWeight: 600 };
const btnOutlineOrange = { background: "transparent", border: "2px solid #FBBF24", borderRadius: 12, padding: "9px 18px", cursor: "pointer", color: "#B45309", fontSize: 14, fontWeight: 600 };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 6 };
