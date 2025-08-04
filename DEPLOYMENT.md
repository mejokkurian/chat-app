# Chat Application Deployment Guide

This guide will help you deploy both the frontend and backend of the chat application to free cloud platforms.

## 🚀 Frontend Deployment (Vercel)

### 1. Setup Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel login` in your terminal

### 2. Get Vercel Tokens
1. Go to Vercel Dashboard → Settings → Tokens
2. Create a new token
3. Copy the token

### 3. Setup GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `VERCEL_TOKEN`: Your Vercel token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### 4. Deploy
The GitHub Actions workflow will automatically deploy on push to main branch.

## 🔧 Backend Deployment (Railway)

### 1. Setup Railway
1. Go to [railway.app](https://railway.app) and sign up/login
2. Create a new project
3. Connect your GitHub repository

### 2. Setup Environment Variables
In Railway dashboard, add these environment variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
NODE_ENV=production
```

### 3. Setup GitHub Secrets
Add these secrets to your GitHub repository:
- `RAILWAY_TOKEN`: Your Railway token
- `RAILWAY_SERVICE`: Your Railway service name

### 4. Deploy
The GitHub Actions workflow will automatically deploy on push to main branch.

## 🔗 Alternative Platforms

### Frontend Alternatives:
- **Netlify**: Similar to Vercel, great for React apps
- **GitHub Pages**: Free static hosting
- **Firebase Hosting**: Google's hosting solution

### Backend Alternatives:
- **Render**: Free tier available
- **Heroku**: Popular platform (limited free tier)
- **DigitalOcean App Platform**: Good performance
- **Firebase Functions**: Serverless functions

## 📝 Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/chat
JWT_SECRET=your_secret_key
PORT=3000
NODE_ENV=development
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflows will:
1. **Test**: Run tests (if available)
2. **Build**: Build the application
3. **Deploy**: Deploy to the respective platform
4. **Notify**: Send deployment notifications

## 🐛 Troubleshooting

### Common Issues:
1. **Build Failures**: Check Node.js version compatibility
2. **Environment Variables**: Ensure all required variables are set
3. **Database Connection**: Verify MongoDB connection string
4. **CORS Issues**: Update CORS settings for production domains

### Debugging:
- Check GitHub Actions logs for detailed error messages
- Verify environment variables in deployment platforms
- Test locally before deploying

## 📊 Monitoring

### Frontend:
- Vercel Analytics
- Google Analytics
- Error tracking with Sentry

### Backend:
- Railway logs
- MongoDB Atlas monitoring
- Application performance monitoring

## 🔒 Security

### Production Checklist:
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] JWT tokens secured
- [ ] Database connection secured

## 🚀 Quick Deploy

### Manual Deployment:
```bash
# Frontend
cd chat
npm run build
vercel --prod

# Backend
cd chat-server
railway up
```

### Automated Deployment:
Just push to the main branch and the CI/CD pipeline will handle the rest! 