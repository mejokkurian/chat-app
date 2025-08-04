# Chat Application Deployment Guide

## 🚀 Quick Deploy

Your backend is already deployed at: **https://web-production-d5c5.up.railway.app**

## 📋 Frontend Deployment (Vercel)

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

### 4. Environment Variables
The frontend is configured to use your Railway backend automatically.

## 🔧 Backend (Already Deployed)

Your backend is running at: **https://web-production-d5c5.up.railway.app**

### Environment Variables (Railway Dashboard)
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret
- `PORT`: 3000
- `NODE_ENV`: production

## 🔄 CI/CD Pipeline

The GitHub Actions workflows will:
1. **Test**: Run tests (if available)
2. **Build**: Build the application
3. **Deploy**: Deploy to Vercel/Railway
4. **Connect**: Frontend automatically connects to Railway backend

## 🚀 Manual Deployment

### Frontend (Vercel)
```bash
cd chat
npm run build
vercel --prod
```

### Backend (Railway)
```bash
cd chat-server
railway up
```

## 🔗 URLs

- **Backend API**: https://web-production-d5c5.up.railway.app
- **Frontend**: Will be available after Vercel deployment

## 🐛 Troubleshooting

### Common Issues:
1. **CORS Errors**: Backend CORS is configured for all origins
2. **Socket Connection**: Frontend automatically connects to Railway backend
3. **Environment Variables**: All configured automatically

### Debugging:
- Check Railway logs for backend issues
- Check Vercel logs for frontend issues
- Verify environment variables in deployment platforms

## ✅ Status

- ✅ Backend deployed to Railway
- ⏳ Frontend ready for Vercel deployment
- ✅ CI/CD pipelines configured
- ✅ Environment variables configured 