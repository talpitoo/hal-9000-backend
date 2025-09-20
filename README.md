# 🔴 HAL 9000 Chat Backend

A minimal Vercel serverless function backend for the HAL 9000 chat widget.

## Setup Instructions

### 1. Create Repository
```bash
mkdir hal-9000-backend
cd hal-9000-backend
git init
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file for local development:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Local Development
```bash
npm run dev
```

This will start the Vercel development server at `http://localhost:3000`

### 5. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Set environment variable `OPENAI_API_KEY` in Vercel dashboard
5. Deploy!

#### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 6. Environment Variables in Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `OPENAI_API_KEY` with your OpenAI API key

## API Endpoint

Once deployed, your endpoint will be:
```
https://your-project-name.vercel.app/api/hal
```

## Usage

### Request Format
```bash
POST /api/hal
Content-Type: application/json

{
  "message": "Hello HAL",
  "sessionId": "optional-session-identifier"
}
```

### Response
Streaming text response in HAL 9000's characteristic style.

## Rate Limiting

- **Per IP**: 20 requests per hour
- **Per Session**: 5 messages per session
- Exceeding limits returns HAL-style error messages

## Features

- ✅ Streaming responses for real-time feel
- ✅ Rate limiting (IP + session based)
- ✅ CORS headers for cross-origin requests
- ✅ HAL 9000 personality with iconic quotes
- ✅ Error handling with in-character responses
- ✅ Minimal dependencies and fast cold starts

## OpenAI API Costs

Using `gpt-4o-mini` model:
- ~$0.00015 per 1K input tokens
- ~$0.0006 per 1K output tokens
- With 150 max tokens per response, very cost-effective for personal projects

## File Structure
```
hal-9000-backend/
├── api/
│   └── hal.ts          # Main serverless function
├── package.json        # Dependencies
├── vercel.json         # Vercel configuration
└── README.md          # This file
```