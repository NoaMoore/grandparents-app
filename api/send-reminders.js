// api/send-reminders.js
// Vercel Cron Job — רץ כל יום ב-9:00 בבוקר
// ושולח מייל רק למי שמגיע היום

export const config = {
  runtime: "edge",
};

// ============================================================
// 🔧 הגדרות EmailJS — אותם ערכים כמו ב-App.jsx
// ============================================================
const EMAILJS_SERVICE_ID  = "service_XXXXXXX";
const EMAILJS_TEMPLATE_ID = "template_XXXXXXX";
const EMAILJS_PUBLIC_KEY  = "XXXXXXXXXXXXXXXXXXXX";
const EMAILJS_PRIVATE_KEY = "XXXXXXXXXXXXXXXXXXXX"; // ← מ-Account > General (Private Key)
// ============================================================

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function sendEmail(member, dateStr) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id:     EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email:   member.email,
        to_name:    member.name,
        visit_date: dateStr,
      },
    }),
  });
  return res.ok;
}

export default async function handler(req) {
  // אבטחה — רק Vercel יכול לקרוא לזה
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = todayStr();
  const dateLabel = today.split("-").reverse().join("/");

  // שלוף נתונים מ-KV Store של Vercel
  // (אם אין KV — ראה הערה למטה)
  let visits = {};
  let members = [];

  try {
    const visitsRaw = await process.env.KV?.get("gp_visits");
    const membersRaw = await process.env.KV?.get("gp_members");
    visits  = visitsRaw  ? JSON.parse(visitsRaw)  : {};
    members = membersRaw ? JSON.parse(membersRaw) : [];
  } catch (e) {
    return new Response("Error reading data: " + e.message, { status: 500 });
  }

  const todayVisitors = visits[today] || [];
  let sent = 0;

  for (const visitor of todayVisitors) {
    const member = members.find(m => m.id === visitor.id);
    if (!member || !member.email) continue;

    const ok = await sendEmail(member, `היום (${dateLabel})`);
    if (ok) sent++;
  }

  return new Response(
    JSON.stringify({ date: today, sent, total: todayVisitors.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
