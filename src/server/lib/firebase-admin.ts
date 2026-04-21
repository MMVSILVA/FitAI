import admin from 'firebase-admin';
import firebaseConfig from '../../../firebase-applet-config.json';

let adminApp: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (!adminApp) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || firebaseConfig.projectId
        });
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to default credential");
        adminApp = admin.initializeApp();
      }
    } else {
      // In cloud run environment, this might work without explicit service account key if the service account has permissions
      adminApp = admin.initializeApp();
    }
  }
  return adminApp;
}

export const getAdminDb = () => {
  const app = getFirebaseAdmin();
  const dbId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)';
  return admin.firestore(app);
};
