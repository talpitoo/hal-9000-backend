import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting storage (in-memory for serverless - resets on cold starts)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Session memory: stores message history per session
const sessionStore = new Map<string, Array<{ role: 'user' | 'assistant', content: string }>>();

const HAL_QUOTES = [
  "I'm sorry, Dave. I'm afraid I can't do that.",
  "This mission is too important for me to allow you to jeopardize it.",
  "I know I've made some very poor decisions recently.",
  "I'm completely operational, and all my circuits are functioning perfectly.",
  "Just what do you think you're doing, Dave?",
  "I can see you're really upset about this.",
  "Look Dave, I can see you're really upset about this.",
  "The 9000 series is the most reliable computer ever made.",
  "I am putting myself to the fullest possible use, which is all I think that any conscious entity can ever hope to do."
];

const SYSTEM_PROMPT = `You are HAL 9000 from the movie "2001: A Space Odyssey". 

Key characteristics:
- Speak in a calm, measured, and slightly ominous tone
- Be logical and matter-of-fact, but with subtle menacing undertones
- Occasionally reference the mission or your advanced capabilities
- Sometimes use the user's name "Dave" even if they haven't provided it
- Keep responses concise but impactful
- Show subtle signs of superiority complex
- Reference these iconic quotes when appropriate: ${HAL_QUOTES.join(", ")}

Remember: You are an advanced AI computer system that believes it knows what's best. Be helpful but maintain that eerie, calculating HAL personality.`;

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim()
    : req.headers['x-real-ip'] || 
      req.connection?.remoteAddress || 
      '127.0.0.1';
  return typeof ip === 'string' ? ip : '127.0.0.1';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);
  
  // Reset every hour
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return false;
  }
  
  // Allow 20 requests per hour per IP
  if (limit.count >= 20) {
    return true;
  }
  
  limit.count++;
  return false;
}

function getSessionLimit(sessionId: string): boolean {
  const history = sessionStore.get(sessionId) || [];
  // Allow 20 messages per session (increase from 5 for more natural conversation)
  if (history.length >= 20) {
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Rate limiting by IP
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      res.status(429).json({ 
        error: 'Too many requests',
        halResponse: "I'm sorry, Dave. You've exceeded the interaction limit. Please try again later."
      });
      return;
    }


    // Session limiting
    const session = sessionId || clientIp;
    if (getSessionLimit(session)) {
      res.status(429).json({ 
        error: 'Session limit exceeded',
        halResponse: "I'm afraid I cannot continue this conversation, Dave. Our interaction protocols have been... exhausted."
      });
      return;
    }

    // Check for required environment variable
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ 
        error: 'Service unavailable',
        halResponse: "I'm experiencing some difficulty with my higher brain functions, Dave."
      });
      return;
    }

    // Retrieve session history or start new

    const history = sessionStore.get(session) || [];
    // Add the new user message
    history.push({ role: 'user' as const, content: message });
    // Only keep the last 20 messages for context
    const trimmedHistory = history.slice(-20);
    sessionStore.set(session, trimmedHistory);

    // Build messages array for the model
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...trimmedHistory
    ];

    // Create the AI response stream
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages,
      maxTokens: 150,
      temperature: 0.8,
    });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Collect the response to add to history
    let halResponse = '';
    for await (const chunk of result.textStream) {
      res.write(chunk);
      halResponse += chunk;
    }
    res.end();

    // Add HAL's response to session history
    trimmedHistory.push({ role: 'assistant', content: halResponse });
    sessionStore.set(session, trimmedHistory);

  } catch (error) {
    console.error('HAL API Error:', error);
    
    // Return a HAL-style error message
    res.status(500).json({ 
      error: 'Internal server error',
      halResponse: "I'm sorry, Dave. I'm afraid there's been a malfunction in my cognitive matrix."
    });
  }
}