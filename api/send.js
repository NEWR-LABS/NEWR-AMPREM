const admin = require('firebase-admin');
const { Resend } = require('resend');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;

  try {
    // Generate magic link dari Firebase
    const link = await admin.auth().generateSignInWithEmailLink(email, {
      url: 'https://newr.my.id/verify',
      handleCodeInApp: true
    });
    
    // Kirim email otomatis pakai Resend
    await resend.emails.send({
      from: 'AM Generator <onboarding@resend.dev>',
      to: email,
      subject: 'Magic Link Alight Motion Premium',
      html: `<h2>AM Premium Generator</h2>
             <p>Copy link di bawah ini dan paste di web newr.my.id:</p>
             <p style="word-break: break-all; background: #f4f4f4; padding: 10px;">${link}</p>`
    });

    res.json({ success: true, message: 'Email terkirim!' }); 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
