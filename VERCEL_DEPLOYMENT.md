# Vercel Deployment Guide

## Prerequisites
1. A Vercel account (https://vercel.com)
2. Vercel CLI installed globally: `npm i -g vercel`
3. Your Supabase PostgreSQL database running and accessible

## Environment Variables Setup

Before deploying, you need to configure the following environment variables in your Vercel project dashboard:

### Required Environment Variables:
```bash
# Database Configuration
DATABASE_URL=your_supabase_connection_string

# JWT Secret (generate a strong random string)
JWT_SECRET=your_jwt_secret_key_here

# Node Environment
NODE_ENV=production

# Optional: Port (Vercel handles this automatically)
PORT=3000
```

## Deployment Steps

### Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Choose your account
   - Link to existing project? `N` (for first deployment)
   - What's your project's name? `math-learning-app-api`
   - In which directory is your code located? `./`

5. **Set environment variables:**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add NODE_ENV
   ```

6. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

### Method 2: Using Git Integration

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Click "Add New Project"
   - Import your Git repository

3. **Configure Build Settings:**
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: (leave empty)
   - Install Command: `npm install`

4. **Add Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add all required environment variables listed above

5. **Deploy:**
   - Click "Deploy" button

## Database Setup

Since you're using Supabase, make sure:

1. **Your Supabase project is running**
2. **Database tables are created** (run migrations if needed)
3. **Connection string includes SSL requirements**
4. **Database is accessible from Vercel's servers**

## Post-Deployment

1. **Test your deployed API:**
   ```bash
   curl https://your-app-name.vercel.app/api/health
   ```

2. **Check API documentation:**
   - Visit: `https://your-app-name.vercel.app/api-docs`

3. **Test authentication endpoints:**
   ```bash
   # Register a test user
   curl -X POST https://your-app-name.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   ```

## Troubleshooting

### Common Issues:

1. **Database Connection Errors:**
   - Check your DATABASE_URL environment variable
   - Ensure Supabase allows connections from Vercel IPs
   - Verify SSL configuration

2. **JWT Errors:**
   - Ensure JWT_SECRET is set in environment variables
   - Make sure JWT_SECRET is the same across all deployments

3. **CORS Issues:**
   - Update CORS origins in src/server.js for your frontend domain
   - Add your Vercel domain to allowed origins

4. **Function Timeout:**
   - Vercel free tier has 10s timeout limit
   - Pro tier allows up to 60s (configured in vercel.json)

### Debugging:

1. **Check Vercel Function Logs:**
   ```bash
   vercel logs
   ```

2. **View real-time logs:**
   ```bash
   vercel logs --follow
   ```

## Updating Your Deployment

To update your deployed API:

```bash
# Pull latest changes
git pull origin main

# Deploy to production
vercel --prod
```

## Custom Domain (Optional)

1. **Add custom domain in Vercel dashboard:**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update CORS origins in your code:**
   - Add your custom domain to allowed origins in src/server.js

## Security Notes

- Never commit environment variables to Git
- Use strong, randomly generated JWT secrets
- Keep your database credentials secure
- Enable SSL/TLS for all connections
- Regularly rotate your JWT secrets
