import { useState, useEffect } from "react";

// ============================================================
// 🔧 הגדרות EmailJS — החלף את שלושת הערכים האלה בלבד!
// ============================================================
const EMAILJS_SERVICE_ID  = "service_XXXXXXX";   // ← מ-Email Services
const EMAILJS_TEMPLATE_ID = "template_XXXXXXX";  // ← מ-Email Templates
const EMAILJS_PUBLIC_KEY  = "XXXXXXXXXXXXXXXXXXXX"; // ← מ-Account > General
// ============================================================

// טוען את ספריית EmailJS מה-CDN
if (typeof window !== "undefined" && !window.emailjs) {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  script.onload = () => window.emailjs.init(EMAILJS_PUBLIC_KEY);
  document.head.appendChild(script);
}

// שולח תזכורת מייל לחבר משפחה
async function sendEmailReminder(member, dateStr) {
  if (!member.email) return;
  if (!window.emailjs) return console.warn("EmailJS לא נטען עדיין");
  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:   member.email,
      to_name:    member.name,
      visit_date: dateStr,
      app_link:   window.location.href,
    });
    console.log("✅ מייל נשלח ל-" + member.name);
  } catch (err) {
    console.error("שגיאה בשליחת מייל:", err);
  }
}

// פותח וואטסאפ עם הודעת תזכורת מוכנה (המשתמש לוחץ שליחה בעצמו)
function sendWhatsAppReminder(member, dateStr) {
  if (!member.phone) return;
  const phone = "972" + member.phone.replace(/^0/, "").replace(/\D/g, "");
  const msg = encodeURIComponent(
    `שלום ${member.name}! 👋\nתזכורת: ביקור אצל סבא וסבתא ב-${dateStr} 💛\nנתראה!`
  );
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
}

// שולח תזכורת לפי העדפות המשתמש (מייל / וואטסאפ / שניהם)
function sendReminder(member, dateStr) {
  const n = member.notif;
  if (n === "email" || n === "both") sendEmailReminder(member, dateStr);
  if (n === "whatsapp" || n === "both") sendWhatsAppReminder(member, dateStr);
}

// בודק כל בוקר (בטעינת האפליקציה) אם יש ביקורים שצריך לשלוח עליהם תזכורת
function checkAndSendReminders(visits, members) {
  const today = todayStr();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;

  Object.entries(visits).forEach(([dateKey, visitors]) => {
    visitors.forEach(visitor => {
      const member = members.find(m => m.id === visitor.id);
      if (!member) return;

      const r = member.reminder;
      const dateLabel = dateKey.split("-").reverse().join("/"); // DD/MM/YYYY

      if ((r === "day_before" || r === "both") && dateKey === tomorrowStr) {
        sendReminder(member, `מחר (${dateLabel})`);
      }
      if ((r === "same_day" || r === "both") && dateKey === today) {
        sendReminder(member, `היום (${dateLabel})`);
      }
    });
  });
}

const FAMILY_CODE = "mishpacha2024";

const COLORS = [
  { bg: "#FF6B6B", light: "#FFE5E5", name: "אדום" },
  { bg: "#4ECDC4", light: "#E5F9F8", name: "טורקיז" },
  { bg: "#45B7D1", light: "#E5F4FA", name: "כחול" },
  { bg: "#96CEB4", light: "#EBF7F1", name: "ירוק" },
  { bg: "#FFEAA7", light: "#FFFBEB", name: "צהוב" },
  { bg: "#DDA0DD", light: "#F8EFF8", name: "סגול" },
  { bg: "#F0A500", light: "#FEF3D7", name: "כתום" },
  { bg: "#FF8B94", light: "#FFE8EA", name: "ורוד" },
];

const HEBREW_MONTHS = [
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
  "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"
];
const HEBREW_DAYS = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateKey(year, month, day) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export default function App() {
  const today = new Date();
  const [view, setView] = useState("login"); // login | calendar | register
  const [currentUser, setCurrentUser] = useState(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [visits, setVisits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gp_visits") || "{}");
    } catch { return {}; }
  });
  const [members, setMembers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gp_members") || "[]");
    } catch { return []; }
  });
  const [loginForm, setLoginForm] = useState({ name: "", email: "", phone: "", reminder: "day_before", notif: "email", color: 0 });
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState("code"); // code | form

  // בדיקת תזכורות בטעינה ראשונה
  useEffect(() => {
    if (members.length > 0 && Object.keys(visits).length > 0) {
      setTimeout(() => checkAndSendReminders(visits, members), 2000);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    try {
      localStorage.setItem("gp_visits", JSON.stringify(visits));
    } catch {}
  }, [visits]);
  useEffect(() => {
    try {
      localStorage.setItem("gp_members", JSON.stringify(members));
    } catch {}
  }, [members]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleCodeSubmit() {
    if (codeInput === FAMILY_CODE) {
      setStep("form");
      setCodeError("");
    } else {
      setCodeError("קוד שגוי, נסה שוב 🙈");
    }
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
      phone: loginForm.phone.trim(),
      reminder: loginForm.reminder,
      notif: loginForm.notif,
      colorIdx: loginForm.color,
    };
    setMembers(prev => [...prev, newMember]);
    setCurrentUser(newMember);
    setView("calendar");
    showToast(`שלום ${newMember.name}! נרשמת בהצלחה 🎉`);
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
        if (updated.length === 0) {
          const { [key]: _, ...rest } = prev;
          return rest;
        }
        showToast("הסרת את הביקור שלך 🗓️", "info");
        return { ...prev, [key]: updated };
      } else {
        showToast("נרשמת לביקור! סבא וסבתא יהיו שמחים 💛", "success");
        return { ...prev, [key]: [...existing, { id: currentUser.id, name: currentUser.name, colorIdx: currentUser.colorIdx }] };
      }
    });
    setShowDayModal(false);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Build upcoming visits for sidebar
  const upcoming = Object.entries(visits)
    .filter(([k]) => k >= todayStr())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 8);

  return (
    <div dir="rtl" style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFF8F0 0%, #FFF0E8 50%, #FFF8F0 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: "relative",
    }}>
      {/* Decorative background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle at 20% 20%, rgba(255,200,100,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,150,100,0.08) 0%, transparent 50%)",
      }} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#4CAF50" : toast.type === "info" ? "#2196F3" : "#f44336",
          color: "#fff", padding: "12px 28px", borderRadius: 40, zIndex: 9999,
          fontWeight: 600, fontSize: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.3s ease",
        }}>{toast.msg}</div>
      )}

      {/* LOGIN SCREEN */}
      {view === "login" && (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            background: "#fff", borderRadius: 28, padding: "clamp(24px, 5vw, 44px) clamp(20px, 5vw, 40px)",
            boxShadow: "0 8px 60px rgba(255,140,60,0.13)",
            width: "100%", maxWidth: 520, textAlign: "center",
          }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>👴👵</div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: "#2D1B00", margin: "0 0 6px",
              letterSpacing: "-0.5px",
            }}>ביקורים אצל סבא וסבתא</h1>
            <p style={{ color: "#999", fontSize: 15, marginBottom: 32 }}>
              תכנון ביקורים משפחתי משותף 💛
            </p>

            {step === "code" && (
              <div>
                <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
                  הזן את קוד הגישה המשפחתי
                </p>
                <input
                  type="text"
                  placeholder="קוד משפחתי..."
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCodeSubmit()}
                  style={inputStyle}
                />
                {codeError && <p style={{ color: "#f44336", fontSize: 13, margin: "8px 0 0" }}>{codeError}</p>}
                <button onClick={handleCodeSubmit} style={btnPrimary}>
                  כניסה ←
                </button>
              </div>
            )}

            {step === "form" && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" }}>
                  ספר לנו מי אתה 😊
                </p>
                <label style={labelStyle}>שם מלא *</label>
                <input style={inputStyle} placeholder="למשל: יוסי כהן"
                  value={loginForm.name} onChange={e => setLoginForm(p => ({ ...p, name: e.target.value }))} />

                <label style={labelStyle}>אימייל</label>
                <input style={inputStyle} type="email" placeholder="your@email.com"
                  value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />

                <label style={labelStyle}>טלפון (לוואטסאפ)</label>
                <input style={inputStyle} type="tel" placeholder="050-0000000"
                  value={loginForm.phone} onChange={e => setLoginForm(p => ({ ...p, phone: e.target.value }))} />

                <label style={labelStyle}>שלח תזכורת</label>
                <select style={inputStyle} value={loginForm.reminder}
                  onChange={e => setLoginForm(p => ({ ...p, reminder: e.target.value }))}>
                  <option value="day_before">יום לפני הביקור</option>
                  <option value="same_day">באותו יום בבוקר</option>
                  <option value="both">שניהם</option>
                </select>

                <label style={labelStyle}>שיטת התראה</label>
                <select style={inputStyle} value={loginForm.notif}
                  onChange={e => setLoginForm(p => ({ ...p, notif: e.target.value }))}>
                  <option value="email">מייל</option>
                  <option value="whatsapp">וואטסאפ</option>
                  <option value="both">שניהם</option>
                </select>

                <label style={labelStyle}>צבע שלך בלוח</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                  {COLORS.map((c, i) => (
                    <div key={i} onClick={() => setLoginForm(p => ({ ...p, color: i }))}
                      style={{
                        width: 32, height: 32, borderRadius: "50%", background: c.bg, cursor: "pointer",
                        border: loginForm.color === i ? "3px solid #2D1B00" : "3px solid transparent",
                        boxShadow: loginForm.color === i ? "0 0 0 2px #fff, 0 0 0 4px " + c.bg : "none",
                        transition: "all 0.2s",
                      }} />
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

      {/* CALENDAR VIEW */}
      {view === "calendar" && (
        <div style={{ position: "relative", zIndex: 1, padding: "20px 16px", maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 24, flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 44 }}>👴👵</div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2D1B00", margin: 0 }}>
                  ביקורים אצל סבא וסבתא
                </h1>
                <p style={{ margin: 0, color: "#999", fontSize: 13 }}>
                  שלום {currentUser?.name}! 👋
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setView("login")} style={{
                background: "transparent", border: "2px solid #e0d0c0",
                borderRadius: 12, padding: "8px 16px", cursor: "pointer",
                color: "#888", fontSize: 13, fontWeight: 600,
              }}>החלף משתמש</button>
              <button onClick={() => setView("members")} style={{
                background: "transparent", border: "2px solid #FBBF24",
                borderRadius: 12, padding: "8px 16px", cursor: "pointer",
                color: "#B45309", fontSize: 13, fontWeight: 600,
              }}>👨‍👩‍👧‍👦 המשפחה</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Calendar */}
            <div style={{ flex: "1 1 620px" }}>
              <div style={{
                background: "#fff", borderRadius: 24,
                boxShadow: "0 4px 30px rgba(255,140,60,0.1)", overflow: "hidden",
              }}>
                {/* Month nav */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "20px 24px",
                  background: "linear-gradient(135deg, #FF8C42, #FF6B35)",
                }}>
                  <button onClick={prevMonth} style={{
                    background: "rgba(255,255,255,0.2)", border: "none",
                    borderRadius: 10, width: 36, height: 36, cursor: "pointer",
                    color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>›</button>
                  <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>
                    {HEBREW_MONTHS[month]} {year}
                  </h2>
                  <button onClick={nextMonth} style={{
                    background: "rgba(255,255,255,0.2)", border: "none",
                    borderRadius: 10, width: 36, height: 36, cursor: "pointer",
                    color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>‹</button>
                </div>

                {/* Day headers */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                  padding: "12px 16px 4px",
                }}>
                  {HEBREW_DAYS.map(d => (
                    <div key={d} style={{
                      textAlign: "center", fontSize: 12, fontWeight: 700,
                      color: "#aaa", padding: "4px 0",
                    }}>{d}</div>
                  ))}
                </div>

                {/* Days grid */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                  padding: "0 16px 20px", gap: 4,
                }}>
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={"e" + i} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const key = dateKey(year, month, day);
                    const dayVisits = visits[key] || [];
                    const isToday = key === todayStr();
                    const isPast = key < todayStr();
                    const isMyVisit = dayVisits.find(v => v.id === currentUser?.id);

                    return (
                      <div key={day}
                        onClick={() => !isPast && handleDayClick(day)}
                        style={{
                          minHeight: 56, borderRadius: 12, padding: "6px 4px",
                          cursor: isPast ? "default" : "pointer",
                          background: isMyVisit
                            ? COLORS[currentUser.colorIdx].light
                            : isToday ? "#FFF8F0" : "#fff",
                          border: isToday ? "2px solid #FF8C42"
                            : isMyVisit ? `2px solid ${COLORS[currentUser.colorIdx].bg}`
                            : "2px solid transparent",
                          opacity: isPast ? 0.4 : 1,
                          transition: "all 0.15s",
                          position: "relative",
                          "&:hover": { transform: "scale(1.05)" },
                        }}
                      >
                        <div style={{
                          textAlign: "center", fontSize: 13, fontWeight: isToday ? 800 : 600,
                          color: isToday ? "#FF6B35" : "#2D1B00", marginBottom: 2,
                        }}>{day}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
                          {dayVisits.slice(0, 4).map((v, vi) => (
                            <div key={vi} style={{
                              width: 10, height: 10, borderRadius: "50%",
                              background: COLORS[v.colorIdx]?.bg || "#999",
                              border: "1.5px solid #fff",
                            }} title={v.name} />
                          ))}
                          {dayVisits.length > 4 && (
                            <div style={{ fontSize: 9, color: "#999", fontWeight: 700 }}>+{dayVisits.length - 4}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              {members.length > 0 && (
                <div style={{
                  marginTop: 16, background: "#fff", borderRadius: 16, padding: "14px 20px",
                  boxShadow: "0 2px 15px rgba(0,0,0,0.05)",
                  display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
                }}>
                  <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>משפחה:</span>
                  {members.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%",
                        background: COLORS[m.colorIdx]?.bg || "#999",
                      }} />
                      <span style={{ fontSize: 13, color: "#444", fontWeight: m.id === currentUser?.id ? 700 : 400 }}>
                        {m.name}{m.id === currentUser?.id ? " (אני)" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar - upcoming visits */}
            <div style={{ flex: "0 0 220px", minWidth: 200 }}>
              <div style={{
                background: "#fff", borderRadius: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: 20,
                marginBottom: 16,
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#2D1B00", fontWeight: 800 }}>
                  📅 ביקורים קרובים
                </h3>
                {upcoming.length === 0 && (
                  <p style={{ color: "#bbb", fontSize: 13 }}>עוד לא שובצו ביקורים</p>
                )}
                {upcoming.map(([key, vs]) => {
                  const [y, m, d] = key.split("-");
                  return (
                    <div key={key} style={{
                      marginBottom: 12, padding: "10px 12px",
                      background: "#FFF8F0", borderRadius: 12,
                      borderRight: "4px solid #FF8C42",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2D1B00", marginBottom: 4 }}>
                        {parseInt(d)} {HEBREW_MONTHS[parseInt(m)-1]} {y}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {vs.map((v, i) => (
                          <span key={i} style={{
                            background: COLORS[v.colorIdx]?.bg || "#999",
                            color: "#fff", borderRadius: 20, padding: "2px 8px",
                            fontSize: 11, fontWeight: 600,
                          }}>{v.name}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* My visits summary */}
              <div style={{
                background: "linear-gradient(135deg, #FF8C42, #FF6B35)",
                borderRadius: 20, padding: 20, color: "#fff",
              }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800 }}>
                  הביקורים שלי
                </h3>
                <div style={{ fontSize: 32, fontWeight: 900, margin: "8px 0" }}>
                  {Object.values(visits).filter(vs => vs.find(v => v.id === currentUser?.id) && Object.keys(visits).find(k => visits[k] === vs) >= todayStr()).length}
                </div>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>ביקורים מתוכננים</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS VIEW */}
      {view === "members" && (
        <div style={{ position: "relative", zIndex: 1, padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setView("calendar")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#FF6B35", fontSize: 16, fontWeight: 700, marginBottom: 20, padding: 0,
          }}>← חזרה ללוח</button>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#2D1B00", margin: "0 0 20px" }}>
            👨‍👩‍👧‍👦 בני המשפחה
          </h2>
          {members.map(m => (
            <div key={m.id} style={{
              background: "#fff", borderRadius: 16, padding: "16px 20px",
              marginBottom: 12, boxShadow: "0 2px 15px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", gap: 14,
              borderRight: `4px solid ${COLORS[m.colorIdx]?.bg || "#999"}`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: COLORS[m.colorIdx]?.bg || "#999",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 18,
              }}>{m.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#2D1B00" }}>
                  {m.name} {m.id === currentUser?.id ? "(אני)" : ""}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  {m.email && `📧 ${m.email}`}{m.email && m.phone && " · "}{m.phone && `📱 ${m.phone}`}
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                  תזכורת: {m.reminder === "day_before" ? "יום לפני" : m.reminder === "same_day" ? "באותו יום" : "שניהם"}
                  {" · "}
                  {m.notif === "email" ? "📧" : m.notif === "whatsapp" ? "💬" : "📧💬"}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: COLORS[m.colorIdx]?.bg }}>
                {Object.values(visits).filter(vs => vs.find(v => v.id === m.id)).length}
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 400 }}>ביקורים</div>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p style={{ color: "#bbb", textAlign: "center", padding: 40 }}>אין בני משפחה עדיין</p>
          )}
        </div>
      )}

      {/* DAY MODAL */}
      {showDayModal && selectedDay && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: 20,
        }} onClick={() => setShowDayModal(false)}>
          <div style={{
            background: "#fff", borderRadius: 24, padding: 32, maxWidth: 360, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#2D1B00", textAlign: "center" }}>
              {selectedDay.day} {HEBREW_MONTHS[month]} {year}
            </h3>
            <p style={{ textAlign: "center", color: "#999", margin: "0 0 24px", fontSize: 14 }}>
              מי מגיע?
            </p>

            {/* Who's coming */}
            {(visits[selectedDay.key] || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: "#888", marginBottom: 10, fontWeight: 600 }}>
                  מגיעים ביום הזה:
                </p>
                {(visits[selectedDay.key] || []).map((v, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                    padding: "8px 12px", background: COLORS[v.colorIdx]?.light,
                    borderRadius: 10,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: COLORS[v.colorIdx]?.bg, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                    }}>{v.name[0]}</div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</span>
                    {v.id === currentUser?.id && <span style={{ color: "#999", fontSize: 12 }}>(אני)</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Toggle button */}
            {(() => {
              const isIn = (visits[selectedDay.key] || []).find(v => v.id === currentUser?.id);
              return (
                <button onClick={() => toggleVisit(selectedDay.key)} style={{
                  width: "100%", padding: "14px 20px",
                  background: isIn ? "#FEE2E2" : "linear-gradient(135deg, #FF8C42, #FF6B35)",
                  color: isIn ? "#DC2626" : "#fff",
                  border: "none", borderRadius: 14, cursor: "pointer",
                  fontSize: 16, fontWeight: 700,
                  transition: "all 0.2s",
                }}>
                  {isIn ? "❌ הסר את הביקור שלי" : "✅ אני מגיע/ה!"}
                </button>
              );
            })()}

            <button onClick={() => setShowDayModal(false)} style={{
              width: "100%", padding: "10px", marginTop: 8,
              background: "transparent", border: "none", cursor: "pointer",
              color: "#aaa", fontSize: 14,
            }}>סגור</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 16px",
  border: "2px solid #E5E0D8", borderRadius: 12,
  fontSize: 15, marginBottom: 14, outline: "none",
  fontFamily: "inherit", background: "#FAFAFA",
  transition: "border-color 0.2s",
  direction: "rtl",
};

const btnPrimary = {
  width: "100%", padding: "14px 20px",
  background: "linear-gradient(135deg, #FF8C42, #FF6B35)",
  color: "#fff", border: "none", borderRadius: 14,
  cursor: "pointer", fontSize: 16, fontWeight: 700,
  marginTop: 8, transition: "opacity 0.2s",
};

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 700,
  color: "#888", marginBottom: 6,
};
