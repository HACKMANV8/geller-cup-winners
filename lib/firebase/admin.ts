/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let isInitialized = false;

if (!admin.apps.length) {
  try {
    // Option 1: Using base64-encoded service account JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) {
      const serviceAccountJson = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64,
        'base64'
      ).toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin initialized with base64 service account');
    }
    // Option 2: Using individual environment variables
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin initialized with individual credentials');
    } else {
      console.warn('⚠️  Firebase Admin credentials not configured. Set environment variables in .env.local');
      console.warn('Required: FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 OR (FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)');
    }
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
  }
} else {
  isInitialized = true;
}

// Helper function to get auth instance safely
function getAdminAuth() {
  if (!isInitialized) {
    throw new Error('Firebase Admin is not initialized. Please configure your environment variables.');
  }
  return admin.auth();
}

// Helper function to get firestore instance safely
function getAdminDb() {
  if (!isInitialized) {
    throw new Error('Firebase Admin is not initialized. Please configure your environment variables.');
  }
  return admin.firestore();
}

export const adminAuth = isInitialized ? admin.auth() : null as any;
export const adminDb = isInitialized ? admin.firestore() : null as any;
export { getAdminAuth, getAdminDb };
export default admin;
