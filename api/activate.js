const axios = require('axios');

const ALIGHT_API_KEY = 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0';
const ID_TOOLKIT = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty';
const VERIFY_PURCHASE_URL = 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase';

const androidHeaders = {
  'content-type': 'application/json',
  'x-android-package': 'com.alightcreative.motion',
  'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
  'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)'
};

const MAGIC_RECEIPT_TOKEN = 'mmgaabamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, magicLink } = req.body;

  try {
    // Buang semua spasi/enter/newline akibat wrap email
    const raw = String(magicLink || '').replace(/\s+/g, '');

    // Ekstrak oobCode sekuat tenaga
    let oobCode = null;
    try {
      const u = new URL(raw);
      oobCode = u.searchParams.get('oobCode');
      if (!oobCode) {
        const n = u.searchParams.get('link') || u.searchParams.get('url') || u.searchParams.get('q');
        if (n) { try { oobCode = new URL(decodeURIComponent(n)).searchParams.get('oobCode'); } catch (e) {} }
      }
    } catch (e) {}
    if (!oobCode) {
      const m = raw.match(/oobCode=([a-zA-Z0-9_-]+)/i);
      if (m) oobCode = m[1];
    }
    if (!oobCode && /^[a-zA-Z0-9_-]{10,}$/.test(raw)) oobCode = raw;
    if (!oobCode) return res.status(400).json({ success: false, error: 'oobCode gak ketemu di link yang lu paste' });

    // Login ke Firebase project ASLI Alight Motion pakai oobCode
    const authRes = await axios.post(`${ID_TOOLKIT}/emailLinkSignin?key=${ALIGHT_API_KEY}`, {
      email: email, oobCode: oobCode, clientType: 'CLIENT_TYPE_ANDROID'
    }, { headers: androidHeaders });

    const firebaseIdToken = authRes.data.idToken;

    // Suntik premium via verifyPurchase
    const orderId = 'newr-' + Math.random().toString(36).substring(2, 8);
    const verifyRes = await axios.post(VERIFY_PURCHASE_URL, {
      data: {
        productId: 'am.full.sub.annual.19q4',
        token: MAGIC_RECEIPT_TOKEN,
        skuType: 'subs',
        orderId: orderId
      }
    }, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'user-agent': 'okhttp/3.12.1',
        'accept-encoding': 'gzip',
        'firebase-instance-id-token': 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI',
        'authorization': 'Bearer ' + firebaseIdToken
      }
    });

    res.json({ success: true, orderId: orderId, alight: verifyRes.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
};
