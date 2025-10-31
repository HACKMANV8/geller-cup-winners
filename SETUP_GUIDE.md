# Quick Setup Guide

## 🚨 Current Issue: Firebase Admin Not Configured

You're seeing this error because Firebase Admin SDK credentials are not set up yet.

## ✅ Quick Fix (5 minutes)

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (e.g., `service-account.json`)

### Step 2: Configure Environment Variables

You have **two options**:

#### Option A: Base64 Encoded (Recommended for Production)

1. Convert your service account to base64:
   ```bash
   cat service-account.json | base64 -w 0
   ```

2. Add to `.env.local`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_JSON_BASE64="your-base64-string-here"
   ```

#### Option B: Individual Fields (Easier for Development)

Open your `service-account.json` and copy the values to `.env.local`:

```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

⚠️ **Important**: Keep the `\n` characters in the private key as-is.

### Step 3: Add Client-Side Firebase Config

Also add your Firebase client config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

You can find these in Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

### Step 4: Enable GitHub Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **GitHub** provider
3. Copy the callback URL
4. Go to [GitHub Developer Settings](https://github.com/settings/developers)
5. Create a new OAuth App:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3001` (for development)
   - **Authorization callback URL**: Paste the Firebase callback URL
6. Copy the **Client ID** and **Client Secret** back to Firebase

### Step 5: Restart the Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

You should see:
```
✅ Firebase Admin initialized with base64 service account
```
or
```
✅ Firebase Admin initialized with individual credentials
```

## 📝 Complete .env.local Template

```env
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"

# Firebase Admin (Private) - Choose ONE method:

# Method 1: Base64 (recommended)
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64="ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsC..."

# Method 2: Individual fields
# FIREBASE_PROJECT_ID="your-project-id"
# FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## 🔍 Troubleshooting

### Error: "Firebase Admin credentials not configured"
- Check that `.env.local` exists in the project root
- Verify environment variable names are correct (case-sensitive)
- Restart the dev server after adding variables

### Error: "Invalid service account"
- Verify the JSON is valid (if using base64, decode it to check)
- Make sure you downloaded the correct service account file
- Check that the private key includes `\n` characters

### Error: "GitHub token not found"
- Sign out and sign in again
- Check that GitHub OAuth is properly configured in Firebase
- Verify the `repo` and `read:user` scopes are requested

## 🎉 Next Steps

Once configured, you can:
1. Visit `http://localhost:3001`
2. Click "Login with GitHub"
3. Authorize the app
4. View your repositories in the dashboard
5. Import a repository to create a project

## 📚 More Help

See the main [README.md](./README.md) for complete documentation.
