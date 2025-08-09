# Quick Deployment Checklist

## Before Deploying to Vercel

### ✅ Pre-deployment Checklist:

1. **Environment Variables Ready**
   - [ ] DATABASE_URL (Supabase connection string)
   - [ ] JWT_SECRET (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - [ ] NODE_ENV=production
   - [ ] FRONTEND_URL (optional, for CORS)

2. **Database Setup**
   - [ ] Supabase project is running
   - [ ] Database tables are created (run migrations if needed)
   - [ ] Test database connection locally

3. **Code Verification**
   - [ ] Local server starts without errors: `npm start`
   - [ ] API endpoints respond correctly
   - [ ] Swagger docs are accessible at `/api-docs`

4. **Vercel Configuration Files**
   - [ ] `vercel.json` exists
   - [ ] `api/index.js` exists
   - [ ] `.vercelignore` exists

## Deployment Commands

### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod

# Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NODE_ENV

# Redeploy with new env vars
vercel --prod
```

### Option 2: Git Integration
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository in Vercel dashboard
3. Add environment variables in Vercel project settings
4. Deploy

## Post-Deployment Testing

1. **Test health endpoint:**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Test API documentation:**
   - Visit: `https://your-app.vercel.app/api-docs`

3. **Run test script:**
   ```bash
   # PowerShell
   .\test-deployment.ps1 -VercelUrl "https://your-app.vercel.app"
   
   # Bash
   ./test-deployment.sh https://your-app.vercel.app
   ```

## Common Issues & Solutions

- **Database connection errors**: Check DATABASE_URL environment variable
- **JWT errors**: Ensure JWT_SECRET is set in Vercel environment variables
- **CORS issues**: Update allowed origins in `src/server.js`
- **Function timeouts**: Vercel free tier has 10s limit, Pro tier allows up to 60s

## Useful Commands

```bash
# View deployment logs
vercel logs

# View environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME

# Check deployment status
vercel ls
```
