const axios = require('axios');

// API KEY ASLI MILIK ALIGHT MOTION (Bocoran dari APK)
const ALIGHT_API_KEY = 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0';
const ID_TOOLKIT = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty';

// Header palsu biar Google ngira ini request dari HP Android yang lagi buka app Alight Motion
const androidHeaders = {
  'content-type': 'application/json',
  'x-android-package': 'com.alightcreative.motion',
  'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
  'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;

  try {
    await axios.post(`${ID_TOOLKIT}/createAuthUri?key=${ALIGHT_API_KEY}`, {
      identifier: email, continueUri: 'http://localhost'
    }, { headers: androidHeaders });

    await axios.post(`${ID_TOOLKIT}/getOobConfirmationCode?key=${ALIGHT_API_KEY}`, {
      requestType: 6, email: email, androidInstallApp: true, canHandleCodeInApp: true,
      continueUrl: 'https://alightcreative.com?ui_sid=0366624874&ui_sd=0',
      androidPackageName: 'com.alightcreative.motion', androidMinimumVersion: '585',
      clientType: 'CLIENT_TYPE_ANDROID'
    }, { headers: androidHeaders });

    res.json({ success: true, message: 'Link dikirim dari server Alight!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
};
