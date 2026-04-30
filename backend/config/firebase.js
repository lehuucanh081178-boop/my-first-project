const admin = require('firebase-admin');

let db = null;
let auth = null;

function initFirebase() {
  if (admin.apps.length > 0) return; // đã init rồi

  // Nếu có file serviceAccount thì dùng, không thì dùng env
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.error('❌ Firebase init error:', err.message);
  }
}

function getDb() {
  if (!db) {
    initFirebase();
    db = admin.firestore();
  }
  return db;
}

function getAuth() {
  if (!auth) {
    initFirebase();
    auth = admin.auth();
  }
  return auth;
}

module.exports = { initFirebase, getDb, getAuth };
