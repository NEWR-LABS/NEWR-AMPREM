const admin = require('firebase-admin');

if (!admin.apps.length) {
  // Ambil config dari environment variable Vercel
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;

  try {
    // Generate magic link, arahkan balik ke domain lu
    const link = await admin.auth().generateSignInWithEmailLink(email, {
      url: 'https://newr.my.id/verify',
      handleCodeInApp: true
    });
    
    // Di production lu butuh SMTP buat ngirim email, 
    // tapi buat tes, kita print linknya ke response dulu
    res.json({ success: true, link: link }); 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
