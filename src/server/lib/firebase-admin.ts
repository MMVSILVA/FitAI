import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

let firebaseConfig: any;
try {
  const configPath = join(process.cwd(), 'firebase-applet-config.json');
  firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error("Warning: Failed to load firebase-applet-config.json. Firebase features may not work.");
  firebaseConfig = {};
}

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
