# Vercel for MCP Servers

A modern deployment platform for MCP Servers, built with Next.js 14, Firebase, and GitHub integration. This application allows developers to authenticate with GitHub, import their repositories, and manage deployments with a beautiful, Vercel-inspired UI.

## 🚀 Features

- **GitHub Authentication**: Secure authentication using Firebase Auth with GitHub OAuth
- **Repository Management**: Browse and import your GitHub repositories
- **Real-time Search**: Filter repositories by name or description
- **Project Dashboard**: Manage all your imported projects in one place
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Server Actions**: Secure API calls using Next.js Server Actions
- **Type Safety**: Full TypeScript support throughout the application

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Firebase Authentication (GitHub Provider)
- **Database**: Cloud Firestore
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Date Formatting**: date-fns
- **State Management**: React Context API

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Firebase project with Firestore and Authentication enabled
- A GitHub OAuth App configured in Firebase
- Firebase Admin SDK service account credentials

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mcp-frontend
npm install
```

### 2. Firebase Setup

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication** and add **GitHub** as a sign-in provider
4. Enable **Cloud Firestore** database

#### Configure GitHub OAuth

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **GitHub** provider
3. Copy the callback URL provided by Firebase
4. Go to [GitHub Developer Settings](https://github.com/settings/developers)
5. Create a new OAuth App with:
   - **Authorization callback URL**: Use the Firebase callback URL
   - **Scopes**: Make sure to request `repo` and `read:user` scopes
6. Copy the Client ID and Client Secret to Firebase

#### Get Firebase Admin SDK Credentials

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Save the JSON file securely
4. Convert to base64 (optional):

   ```bash
   cat service-account.json | base64 -w 0
   ```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp env.example.txt .env.local
```

Fill in your Firebase credentials:

```env
# Firebase Public Client Config
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Firebase Admin SDK (Choose one method)

# Method 1: Base64-encoded service account JSON (recommended for deployment)
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64="your-base64-encoded-json"

# Method 2: Individual fields (easier for local development)
# FIREBASE_PROJECT_ID="your-project-id"
# FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Deploy Firestore Security Rules

Deploy the security rules to your Firebase project:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📁 Project Structure

```text
mcp-frontend/
├── app/
│   ├── actions/
│   │   └── github.actions.ts      # Server Actions for GitHub API
│   ├── dashboard/
│   │   └── page.tsx                # Protected dashboard page
│   ├── layout.tsx                  # Root layout with providers
│   ├── page.tsx                    # Homepage with login
│   └── globals.css                 # Global styles
├── components/
│   ├── GitHubConnect.tsx           # GitHub connection component
│   ├── LoginButton.tsx             # Login/logout button
│   └── RepoCard.tsx                # Repository card component
├── contexts/
│   └── AuthContext.tsx             # Authentication context provider
├── lib/
│   ├── firebase/
│   │   ├── admin.ts                # Firebase Admin SDK config
│   │   └── client.ts               # Firebase client config
│   └── api.ts                      # API utilities
├── types/
│   └── index.ts                    # TypeScript type definitions
├── firestore.rules                 # Firestore security rules
├── env.example.txt                 # Environment variables template
└── package.json
```

## 🔐 Security

### Firestore Security Rules

The application uses comprehensive Firestore security rules to protect user data:

- **Public User Profiles**: Read access for all, write access only for the owner
- **Private Data**: GitHub tokens stored in `users/{uid}/private/` subcollection, accessible only by the owner
- **Projects**: Users can only read, create, update, and delete their own projects
- **Authentication Required**: Most operations require authentication

### GitHub Token Storage

- GitHub OAuth access tokens are securely stored in Firestore
- Tokens are stored in a private subcollection with strict security rules
- Server Actions verify Firebase ID tokens before accessing GitHub tokens
- Tokens are never exposed to the client

## 🎨 UI/UX Features

- **Dark Mode**: Modern dark theme with gradient accents
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Loading States**: Skeleton loaders and loading indicators
- **Error Handling**: User-friendly error messages
- **Search & Filter**: Real-time repository search
- **Hover Effects**: Smooth transitions and hover states

## 📝 API Endpoints (Server Actions)

### `fetchGitHubRepos(idToken: string)`

Fetches all repositories for the authenticated user from GitHub API.

**Parameters:**

- `idToken`: Firebase ID token for authentication

**Returns:** Array of `GitHubRepo` objects

### `importRepository(idToken: string, repoData: object)`

Imports a GitHub repository as a project in Firestore.

**Parameters:**

- `idToken`: Firebase ID token
- `repoData`: Repository information (name, ID, clone URL, etc.)

**Returns:** Success status and project ID

### `getUserProjects(idToken: string)`

Retrieves all projects for the authenticated user.

**Parameters:**

- `idToken`: Firebase ID token

**Returns:** Array of project objects

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Google Cloud Run
- Railway
- Render

Make sure to set all environment variables in your deployment platform.

## 🔄 Database Schema

### Users Collection

```typescript
users/{uid}
  - name: string
  - email: string
  - image: string
  - githubUsername: string
  - updatedAt: string
  
  /private/github_token
    - accessToken: string
    - updatedAt: string
```

### Projects Collection

```typescript
projects/{projectId}
  - userId: string
  - repoName: string
  - githubRepoId: string
  - cloneUrl: string
  - description: string
  - branch: string
  - status: 'Imported' | 'Building' | 'Deployed' | 'Failed'
  - createdAt: string
  - updatedAt: string
```

## 🐛 Troubleshooting

### GitHub Token Not Found

If you see "GitHub token not found", try:

1. Sign out and sign in again
2. Check Firestore security rules are deployed
3. Verify the GitHub OAuth scopes include `repo` and `read:user`

### Firebase Admin Initialization Error

Ensure your service account credentials are correctly formatted:

- Private key should have `\n` for newlines
- Base64 encoding should be done without line wraps

### Repository List Not Loading

Check:

1. GitHub token is stored in Firestore
2. Firebase Admin SDK is properly initialized
3. Network requests are not blocked by CORS

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Firebase, and TypeScript
