# Deployment Guide

This guide covers deploying FinSmart to Netlify.

## Prerequisites

Before deploying, ensure you have:
- A Supabase project set up with the database migrated
- Your environment variables ready (Supabase URL, anon key, API keys)
- A GitHub repository with your code

## Netlify Deployment

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Connect Repository:**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account and select your repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18 or higher
   
   These are automatically detected from `netlify.toml`

3. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add the following:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     GEMINI_API_KEY=your_gemini_key (optional)
     WATSON_API_KEY=your_watson_key (optional)
     WATSON_ENDPOINT=your_watson_endpoint (optional)
     ```

4. **Deploy:**
   - Click "Deploy site"
   - Wait 2-3 minutes for the build to complete
   - Your site will be live at `https://random-name.netlify.app`

5. **Custom Domain (Optional):**
   - Go to Site settings → Domain management
   - Add your custom domain
   - Follow DNS configuration instructions

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize Site:**
   ```bash
   netlify init
   ```

4. **Set Environment Variables:**
   ```bash
   netlify env:set NEXT_PUBLIC_SUPABASE_URL "your_value"
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_value"
   # Add other variables as needed
   ```

5. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

## Post-Deployment Configuration

### Update Supabase URLs

After deployment, update your Supabase project with the new URLs:

1. Go to your Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Netlify URL:
   - Site URL: `https://your-app.netlify.app`
   - Redirect URLs: `https://your-app.netlify.app/**`

### Update Google OAuth (if using)

If you're using Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to Authorized redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   https://your-app.netlify.app
   ```

## Continuous Deployment

Netlify automatically deploys when you push to your main branch:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Netlify automatically builds and deploys
4. Check deployment status in Netlify dashboard

## Preview Deployments

Netlify creates preview deployments for pull requests:

1. Create a new branch
2. Make changes and push
3. Open a pull request
4. Netlify creates a preview URL
5. Test changes before merging

## Troubleshooting

### Build Fails

- Check build logs in Netlify dashboard
- Verify all environment variables are set
- Ensure Node version is 18 or higher
- Try building locally: `npm run build`

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing variables
- Check variable names match exactly (case-sensitive)

### OAuth Not Working

- Verify redirect URLs in Supabase and Google Console
- Check that URLs use HTTPS (not HTTP)
- Ensure no trailing slashes in URLs

### Database Connection Issues

- Verify Supabase URL and anon key are correct
- Check Supabase project is active
- Ensure RLS policies are properly configured

## Performance Optimization

Netlify automatically provides:
- CDN distribution
- Automatic HTTPS
- Asset optimization
- Serverless functions for API routes
- Edge caching

## Monitoring

Monitor your deployment:
- Netlify Analytics (Site settings → Analytics)
- Supabase Dashboard for database metrics
- Browser console for client-side errors

## Rollback

To rollback to a previous deployment:
1. Go to Deploys in Netlify dashboard
2. Find the working deployment
3. Click "Publish deploy"

## Cost

- Netlify: Free tier includes 100GB bandwidth/month
- Supabase: Free tier includes 500MB database, 2GB bandwidth
- Upgrade as needed based on usage

## Support

- [Netlify Documentation](https://docs.netlify.com)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Supabase Documentation](https://supabase.com/docs)
