# GitHub Personal Access Token (PAT) Setup Guide

## The Problem

You're seeing a 403 error when trying to push to the worker repository:

```
remote: Permission to govindup63/worker.git denied to govindup63.
fatal: unable to access 'https://github.com/govindup63/worker.git/': The requested URL returned error: 403
```

This means the GitHub Personal Access Token is either:

1. Not set in your environment variables
2. Missing the required permissions
3. Expired or invalid

## Solution: Create a GitHub Personal Access Token

### Step 1: Generate a New Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click on **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., "MCP Deploy Worker Repo")
4. Set expiration (recommend: 90 days or No expiration for development)

### Step 2: Select Permissions

**✅ Required Scopes:**

- [x] **repo** (Full control of private repositories)
  - [x] repo:status
  - [x] repo_deployment
  - [x] public_repo
  - [x] repo:invite
  - [x] security_events
- [x] **workflow** (Update GitHub Action workflows)

**Note:**

- The `repo` scope gives full access to repositories and is required for pushing code.
- The `workflow` scope is **required** because we push workflow files to `.github/workflows/`.

### Step 3: Generate and Copy Token

1. Click **"Generate token"** at the bottom
2. **⚠️ IMPORTANT**: Copy the token immediately (you won't see it again!)
3. The token will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Add Token to Your Environment

#### For Local Development (.env.local):

```bash
# Add to .env.local file
WORKER_PAT=ghp_your_token_here
WORKER_REPO=govindup63/worker
```

#### For Production (Vercel, etc.):

Add the environment variables in your hosting platform's dashboard.

### Step 5: Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

## Verify Token Format

The token should:

- Start with `ghp_` (for classic tokens) or `github_pat_` (for fine-grained tokens)
- Be exactly 40-93 characters long
- Contain only letters, numbers, and underscores

## Testing the Setup

Try making a request to the transfer API:

```bash
curl -X POST http://localhost:3001/api/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "targetRepo": "https://github.com/yourusername/test-repo.git",
    "targetBranch": "main",
    "mcpName": "test-service"
  }'
```

## Troubleshooting

### Issue: Token not being picked up

**Solution**: Make sure `.env.local` is in the project root and restart the dev server

### Issue: Still getting 403 or workflow scope error

**Solution**:

1. Verify the token has both `repo` **AND** `workflow` permissions
2. Check that you have write access to the `govindup63/worker` repository
3. Verify the token hasn't expired
4. If you see "refusing to allow a Personal Access Token to create or update workflow", add the `workflow` scope

### Issue: "WORKER_PAT environment variable is not set"

**Solution**: The API will now return this error message if PAT is missing. Add it to `.env.local`

## Security Notes

- ⚠️ **Never commit** `.env.local` to git
- ⚠️ **Never share** your PAT publicly
- ⚠️ The `.env.local` file is already in `.gitignore`
- 🔒 Tokens are automatically masked in logs

## Alternative: Fine-Grained Personal Access Tokens

For better security, you can use fine-grained tokens:

1. Go to: https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Select **only** the `govindup63/worker` repository
4. Grant **Read and Write** permissions for:
   - Contents
   - Metadata
5. Generate and use the token the same way

---

**Need Help?** Check the logs in your terminal - they now provide detailed debugging information!
