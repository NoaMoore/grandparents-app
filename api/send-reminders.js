// api/send-reminders.js
export const config = { runtime: "edge" };

const EMAILJS_SERVICE_ID  = "service_XXXXXXX";
const EMAILJS_TEMPLATE_ID = "template_XXXXXXX";
const EMAILJS_PUBLIC_KEY  = "XXXXXXXXXXXXXXXXXXXX";
const EMAILJS_PRIVATE_KEY = "XXXXXXXXXXXXXXXXXXXX";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate()+1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function getAccessToken(clientEmail, privateKey) {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    iss: clientEmail, sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
    scope: "https://www.googleapis.com/auth/datastore",
  }));
  const pemContents = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  return (await tokenRes.json()).access_token;
}

async function getFirestoreDoc(collection, docId, projectId, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.fields?.data?.stringValue ? JSON.parse(json.fields.data.stringValue) : null;
}

async function sendEmail(member, dateStr) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID, template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY, accessToken: EMAILJS_PRIVATE_KEY,
      template_params: { to_email: member.email, to_name: member.name, visit_date: dateStr },
    }),
  });
  return res.ok;
}

export default async function handler(req) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("Unauthorized", { status: 401 });

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const token = await getAccessToken(process.env.FIREBASE_CLIENT_EMAIL, process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"));
    const visits = await getFirestoreDoc("app", "visits", projectId, token) || {};
    const members = await getFirestoreDoc("app", "members", projectId, token) || [];

    const today = todayStr(), tomorrow = tomorrowStr();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let sent = 0;

    for (const [dk, visitors] of Object.entries(visits)) {
      for (const visitor of visitors) {
        const member = members.find(m => m.id === visitor.id);
        if (!member?.email) continue;
        const [rh, rm] = (member.reminderTime || "09:00").split(":").map(Number);
        const reminderMinutes = rh * 60 + rm;
        if (currentMinutes < reminderMinutes || currentMinutes > reminderMinutes + 59) continue;
        const dateLabel = dk.split("-").reverse().join("/");
        const r = member.reminder || "same_day";
        if ((r === "day_before" || r === "both") && dk === tomorrow) { if (await sendEmail(member, `מחר (${dateLabel})`)) sent++; }
        if ((r === "same_day" || r === "both") && dk === today) { if (await sendEmail(member, `היום (${dateLabel})`)) sent++; }
      }
    }
    return new Response(JSON.stringify({ today, sent }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}
