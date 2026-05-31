const admin = require("firebase-admin");

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

function getFirebaseAdmin() {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey()
      })
    });
  }

  return admin;
}

async function verifyFirebaseIdToken(idToken) {
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin || !idToken) {
    return null;
  }

  return firebaseAdmin.auth().verifyIdToken(idToken);
}

module.exports = {
  getFirebaseAdmin,
  isFirebaseAdminConfigured,
  verifyFirebaseIdToken
};
