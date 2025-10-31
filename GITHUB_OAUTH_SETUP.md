# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth to enable authenticated API requests with higher rate limits (5,000 requests/hour vs 60 requests/hour).

## Why GitHub OAuth?

- **Higher Rate Limits**: 5,000 requests/hour (authenticated) vs 60 requests/hour (unauthenticated)
- **Access to Private Repos**: Users can import their private repositories
- **Better User Experience**: No rate limit errors during normal usage

## Setup Steps

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: `MCP Deploy` (or your app name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click **"Register application"**

### 2. Get Your Credentials

After creating the app, you'll see:
- **Client ID**: Copy this value
- **Client Secret**: Click "Generate a new client secret" and copy the value

⚠️ **Important**: Save the client secret immediately - you won't be able to see it again!

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID="your_client_id_here"
GITHUB_CLIENT_SECRET="your_client_secret_here"
GITHUB_REDIRECT_URI="http://localhost:3000/api/auth/github/callback"
```

### 4. For Production Deployment

When deploying to production:

1. Update your GitHub OAuth App settings:
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/github/callback`

2. Update your production environment variables:
   ```bash
   GITHUB_REDIRECT_URI="https://yourdomain.com/api/auth/github/callback"
   ```

## How It Works

1. User clicks "Connect GitHub Account" on the dashboard
2. User is redirected to GitHub to authorize the app
3. GitHub redirects back to `/api/auth/github/callback` with an authorization code
4. The app exchanges the code for an access token
5. The access token is stored in MongoDB
6. All subsequent GitHub API requests use this token for authentication

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/dashboard`
3. Try importing a repository - if you hit the rate limit, you'll see a prompt to connect GitHub
4. Click "Connect GitHub Account" and authorize the app
5. Try importing again - it should work with the authenticated token

## Troubleshooting

### "OAuth not configured" error
- Make sure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in `.env.local`
- Restart your development server after adding environment variables

### Callback URL mismatch
- Ensure the callback URL in your GitHub OAuth App matches exactly: `http://localhost:3000/api/auth/github/callback`
- Check that `GITHUB_REDIRECT_URI` in `.env.local` matches

### Token not being used
- Check the browser console and server logs for errors
- Verify the token is stored in MongoDB by checking the `githubtokens` collection
- Make sure the user is logged in with Firebase Auth

## Security Notes

- Never commit `.env.local` to version control
- Keep your `GITHUB_CLIENT_SECRET` secure
- Tokens are stored encrypted in MongoDB
- Users can revoke access anytime from their [GitHub settings](https://github.com/settings/applications)
