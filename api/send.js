const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { token } = req.body;
    const decoded = await admin.auth().verifyIdToken(token);

    await admin.auth().setCustomUserClaims(decoded.uid, {
      premium: true,
      subscription_status: 'active',
      expiration: '2099-12-31'
    });

    const orderId = 'AM-' + Math.floor(100000 + Math.random() * 900000);
    res.json({ success: true, orderId });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};
