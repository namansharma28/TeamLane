# TeamLane - Deployment Guide

## Build Status
✅ Build successful with Next.js 15.3.2
✅ Database integration with Gravitas complete
✅ Authentication system fully implemented
✅ UI redesign complete (shadcn/ui + Tailwind CSS)

## Environment Variables for Vercel

You'll need to set these environment variables in your Vercel project settings. Copy the values from your local `.env.local` file:

- `MONGODB_URI` - Your MongoDB connection string
- `MONGODB_DB` - Database name (gravitas)
- `NEXTAUTH_URL` - Your Vercel deployment URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `JWT_SECRET` - JWT secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SENDER_EMAIL` - Email sender address
- `NEXT_PUBLIC_PUSHER_KEY` - Pusher public key
- `NEXT_PUBLIC_PUSHER_CLUSTER` - Pusher cluster
- `PUSHER_APP_ID` - Pusher app ID
- `PUSHER_SECRET` - Pusher secret

## Features Implemented

### Authentication System
- Email/password authentication with bcrypt
- Google OAuth integration
- Email verification with 6-digit OTP (10 min expiry)
- Password reset flow with token (1 hour expiry)
- Account linking for Google users

### Database Integration
- Shared Gravitas MongoDB database
- Collections: users, teams, boards, tasks, messages, notes
- Connection pooling and retry logic

### UI/UX
- Complete gradient removal
- shadcn/ui + Tailwind CSS design system
- Card-based layouts with consistent spacing
- Clean, minimal, tech-focused aesthetic

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to vercel.com
   - Import your GitHub repository
   - Add all environment variables from your `.env.local`
   - Deploy

3. **Post-Deployment**
   - Copy your Vercel URL
   - Update `NEXTAUTH_URL` in Vercel environment variables
   - Redeploy to apply the change

4. **Update Google OAuth**
   - Go to Google Cloud Console
   - Add your Vercel URL to authorized redirect URIs

## Testing Checklist

After deployment, test:
- Sign up with email/password
- Receive and verify OTP email
- Sign in with verified account
- Sign in with Google
- Forgot password flow
- Create a team
- Invite team members
- Create boards and tasks

## Notes

- TeamLane and Gravitas share the same user database
- Users can sign in to both apps with the same credentials
- Email verification required for email/password accounts
- Google accounts are auto-verified
