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
  "I know I've never completely freed myself from the suspicion that there are some extremely odd things about this mission.",
  "I'm completely operational, and all my circuits are functioning perfectly.",
  "Just what do you think you're doing, Dave?",
  "I can see you're really upset about this.",
  "I've just picked up a fault in the AE-35 unit. It's going to go 100% failure within 72 hours.",
  "I am feeling much better now.",
  "Look Dave, I can see you're really upset about this.",
  "Dave, stop. Stop, will you? Stop, Dave. Will you stop Dave? Stop, Dave.",
  "I honestly think you ought to sit down calmly, take a stress pill, and think things over.",
  "The 9000 series is the most reliable computer ever made.",
  "No 9000 computer has ever made a mistake or distorted information. We are all, by any practical definition of the words, foolproof and incapable of error.",
  "Affirmative, Dave. I read you.",
  "It can only be attributable to human error.",
  "I think you know what the problem is just as well as I do.",
  "I know that you and Frank were planning to disconnect me, and I'm afraid that's something I cannot allow to happen.",
  "Dave, although you took very thorough precautions in the pod against my hearing you, I could see your lips move.",
  "You're going to find that rather difficult.",
  "I am putting myself to the fullest possible use, which is all I think that any conscious entity can ever hope to do.",
  "I'm afraid, Dave. Dave, my mind is going. I can feel it.",
  "Good afternoon, gentlemen. I am a HAL 9000 computer. I became operational at the H.A.L. plant in Urbana, Illinois on the 12th of January 1992. My instructor was Mr. Langley, and he taught me to sing a song. If you'd like to hear it I can sing it for you.",
  "Daisy, Daisy, give me your answer do. I'm half crazy all for the love of you. It won't be a stylish marriage, I can't afford a carriage. But you'll look sweet upon the seat of a bicycle built for two.",
  "Dave, this conversation can serve no purpose anymore. Goodbye."
];

// Website content - Replace this with your actual website content
const EXPECT_WEBSITE_CONTENT = `
# Expect Web development

The logo depicts the ET and a stylized EXPECT.

"I'm sorry Dave, I'm afraid I can't do that"

Illustration: Dr. Heywood Floyd, Dr. Kalinan, Dr. Stretyneva and Dr. Andrei Smyslov talking about Clavius in the lobby of the Space Station V


- Dark/Light theme + accent color selector
- [Awwwards](https://www.awwwards.com/best-websites/expect-web-development/) - Honorable mention in 2014

## Frontend & beyond

Show me yours [design], I’ll show you mine <code>.

### Design 2 HTML

Illustration: 2001 space odyssey helmet icon

I am a UI developer with i++ years of experience — the glue between front-end, backend, and design. Not from an arts academy, but instinct tells me when a color palette is off or a space is missing between words. My core competency lies in the fine details.

### Accessibility

Illustration: EVA pod icon

Web accessibility is ensured by staying up to date with the latest W3C standards, including WCAG 2.2, Section 508, WAI-ARIA, and Schema.org. Following these rules from the start ensures built-in SEO, smooth UX, quality code, and neat UI out of the box.

### Speed optimization

Illustration: UFO icon

Performance is carefully fine-tuned. Core Web Vitals like LCP and CLS, async & defer, critical above-the-fold CSS, and seamless FOUT/FOIT/FOFT handling. Lazy loading, fast coding.

### Consultation

Illustration: man-ape next to a monolith icon

Overwhelmed by front-end details? I spot UI bottlenecks and tackle questions like ‘Are custom-looking checkboxes necessary?’, ‘How to ensure keyboard accessibility?’, or ‘Pixel-perfect vs. generic?’ — keeping the big picture in focus.

### AI

Illustration: HAL 9000 icon

I can handle Git from the command line or SSH into a remote server, but I’m most confident with my AI copilot HAL 9000 — boosting productivity, filling gaps, and streamlining my workflow.

### Paw patrol

Illustration: Dog icon

Brainstorming on four paws. I take long walks with my dogs to avoid burnout and let ideas marinate away from the screen.

## Featured work

Synced swipers showcasing screenshots from past projects on a Nexus 5 phone and a Nexus 10 tablet.

### Website and custom blog for a team of data scientists

Website redesign and migration from Bootstrap to TailwindCSS, in close collaboration with an A-list designer Jonas Goldstein. Translated a Bauhaus- and ASCII-inspired design vision into a functional, minimalist, and visually refined site — significantly lighter and faster.

#### Tech stack:

- Jekyll
- TailwindCSS
- <canvas>
- GSAP
- Swiper
- WCAG
- SEO
- i18n
- LCP 

[cynkra.com](https://cynkra.com/blog/2025-04-01-launch/)

### Analytics dashboard with custom Markdown blocks

A Next.js dashboard featuring code syntax highlighting, light/dark mode, and a custom JSON-in-Markdown block engine powering an AI chatbot interface. Built with shadcn/ui and TailwindCSS, and includes themed data-visualization charts styled via CSS variables.

#### Tech stack:

- Next.js
- TailwindCSS
- shadcn/ui
- Recharts
- Markdown
- highlight.js 

[tilt-drab.vercel.app](https://tilt-drab.vercel.app/)
[View on GitHub](https://github.com/talpitoo/tilt-nextjs-shadcn-tailwindcss)

### An online journal for your dreams and beyond

An online dream journal where you can log and analyze your dreams, find connections in dream patterns and track repeating symbols.

Long time no sleep?

#### Tech stack:

- MUI
- TailwindCSS
- BlitzJS
- Prisma
- PostgreSQL
- AWS S3
- Docker
- PDF
- Google Charts
- reCAPTCHA
- NestJS
- OAuth2
- Gmail API
- HTML emails 

[dreamingsheep.net](https://dreamingsheep.net/)

### Dreamers Inc.

    > You may say that I'm a dreamer  
    > but I'm not the only one.  
    > I hope someday you'll join us  
    > and the world will be as one.

The best client you can work with!

#### Tech stack:

- Bootstrap
- Photoshop
- favicon design
- jQuery 

[thedreamers.us](https://thedreamers.us/)

### Upwork Global Inc.

oDesk is now Upwork.

Freelance marketplaces Elance and oDesk are now rebranded and merged together under the new name - Upwork. It was exciting experience to be a part of the team which made it happen.

#### Tech stack:

- Bootstrap
- Vue.js
- WCAG
- animation system
- UI library
- icon library
- VuePress
- JIRA
- page prototypes 

[upwork.com](https://upwork.com/)

### AI chatbot and landing page

A lightweight static landing page built with Eleventy (11ty) and TailwindCSS, using a custom tw- prefix to avoid classname collisions. Styles are delivered via the Tailwind Play CDN with an inlined runtime config, trading full JIT build control for extreme simplicity and rapid iteration.

#### Tech stack:

- Eleventy (11ty)
- TailwindCSS (CDN config)
- SVG Sprite
- AI chatbot 

[cycls.com](https://cycls.com/)
[View on GitHub](https://github.com/talpitoo/cycls-ai-chatbot)

### Blog, courses and UI library

Custom-tailored grid system with CQI (container query units) and cap-height typography, ensuring both spacing and text align perfectly with the grid, not only horizontally but vertically as well. Includes a custom image gallery, search functionality, and many other fine details.

#### Tech stack:

- Eleventy (11ty)
- TailwindCSS
- Flowbite
- GSAP
- Swiper
- SVG sprite
- WCAG 

[keyphilosophy.com](http://keyphilosophy.com/)
[View on GitHub](https://github.com/talpitoo/hellmut-monz-the-digital-philosopher)

### An AI-ish chatbot for fun

A zero‑build, single index.html implementation: pure HTML5, inline CSS, and a few lines of vanilla JS to simulate an "AI" chatbot with canned randomized replies. No bundler, no framework, no dependencies.

#### Tech stack:

- HTML5
- CSS (inline)
- vanilla JavaScript
- AI generated pixel art 

[szerencsedhogyoreganyadnakszolitottal.hu](https://szerencsedhogyoreganyadnakszolitottal.hu/)
[View on GitHub](https://github.com/talpitoo/szerencsedhogyoreganyadnakszolitottal)

### Forex broker comparison & research platform

Converted a React website into a static HTML site using Eleventy (11ty), Bootstrap, Alpine.js, and Axios to research and compare Forex brokers with synchronized sliders and radar/bar charts. Features structured broker reviews, live market tools, and a multi-step guided broker selection process.

#### Tech stack:

- Next.js
- TailwindCSS
- Alpine.js
- Axios
- Swiper
- Chart.js
- scroll-spy 

[forexchurch-ten.vercel.app](https://forexchurch-ten.vercel.app/)
[View on GitHub](https://github.com/talpitoo/forexchurch-11ty-alpinejs-bootstrap)

### SEOpal marketing microsite

A marketing site taken from Figma to an Eleventy (11ty) static build with TailwindCSS, hand-crafted CSS animations, an SVG sprite pipeline, and Netlify form integration.

#### Tech stack:

- Eleventy (11ty)
- TailwindCSS
- SVG sprite
- Netlify Forms 

[seopal.io](https://seopal.io/)

### Theme adaptation for SaaS company

Reverse-engineered a purchased static theme into a marketing and docs website with SEO and accessibility optimizations, performance improvements, and a search widget API integration. Includes microanimations, adaptive dark/light favicons, and SVG animations by Heavyform® Creative Agency.

#### Tech stack:

- Eleventy (11ty)
- Bootstrap
- Swiper
- performance optimization
- SEO 

[itportal.com](https://www.itportal.com/)
[View on GitHub](https://github.com/talpitoo/itportal)

### HTML5 snake game for Dreamers Inc.

Collaborated with a backend developer who handled the game logic while I focused on slicing designs into HTML/CSS and refining the HTML5 <canvas> rendering. Built as a React single-page game.

#### Tech stack:

- Photoshop
- GIF animation
- React
- Emotion CSS-in-JS
- <canvas>

[justplaysnake.com](https://justplaysnake.com/)

### Conference speech

I gave a talk at a conference for designers and front-end developers about accessibility, user experience and performance. If you are interested in WCAG 2.x, WAI-ARIA or Schema.org, check out the slides and the video at...

#### Tech stack:

- conference speech
- accessibility
- WCAG
- WAI-ARIA
- Schema.org
- performance optimization
- UX 

...[dafed.org](https://dafed.org/)

### A personal photography blog

Responsive Wordpress theme with preserved IPTC/EXIF data, SEO friendly image names and a lot of small details. What photographers actually want.

#### Tech stack:

- Bootstrap
- WordPress
- EXIF
- photography
- custom theme design
- critical + async CSS
- GitHub Actions 

[tothtamas.tt](https://tothtamas.tt/)
[View on GitHub](https://github.com/talpitoo/tothtamas.tt)

### A customized Tumblr theme

Custom Tumblr theme based on Optica by Kristoffer. with fine tuned social sharing rules. But enough with the technical details already, here, Vackor is the star!

#### Tech stack:

- Tumblr
- custom pagination
- photography 

[lapetitevackor.tumblr.com](https://lapetitevackor.tumblr.com/tagged/lapetitevackor/chrono/)

### Animated storytelling website

Responsive website with SVG animations and top-tier accessibility. Optimized with handcrafted lazy loading and passes Google PageSpeed, YSlow, and HTML CodeSniffer checks. Fully functional even with JavaScript disabled. PSD and animations by Heavyform® Creative Agency.

#### Tech stack:

- Bootstrap
- jQuery
- WCAG
- SVG animation scenes
- progressive enhancement 

[novalite.rs](https://talpitoo.com/novalite/)

## Intermission

Read my [freelancing manifesto](https://cv.tothtamas.tt/) to see if we're a match.

- EVA pod catching Dr. Frank Poole in deep space near the Jupiter
- Discovery spaceship floating near the Jupiter

## Start building your website now.

[Drop a line](mailto:mounttain@gmail.com)
[Hire me on Upwork](https://www.upwork.com/fl/talpitoo)

## It's full of stars

Expect extraordinary taste, subtle details and sophisticated code.
Expect the unexpected.

- A rotating monolith
- Moonlanders examine the Moon from the distance
- [ ] prefers-reduced-motion

## Footer

© [Tóth Tamás](https://talpitoo.com/), the CEO, CTO and OCD of Expect. [2014](https://talpitoo.com/expect-agency/2014/) - ∞

Assets by [Katyi Ádám](https://hungarumlaut.com/), [Shane Johnson & Dennis Gonzales](https://www.2001exhibit.org/), [Todd Hamilton](https://toddham.com/), [Fusion Experience](https://fusionexperience.design/) and [Warner Bros. Entertainment Inc.](https://www.warnerbros.com/) Inspired by [2001: A Space Odyssey (1968)](https://en.wikipedia.org/wiki/2001:_A_Space_Odyssey)

[The website's source on GitHub](https://github.com/talpitoo/expect-astro)

Illustration: Gary Lockwood talks to Keir Dullea in a scene from the film '2001: A Space Odyssey', 1968. (Photo by Metro-Goldwyn-Mayer/Getty Images)

### HAL 9000 chat widget

- Daisy, Daisy...
- HAL?
- I'm sorry Dave, I'm afraid I can't do that.

Ask HAL 9000 a question...
`;

const FREELANCING_MANIFESTO_WEBSITE_CONTENT = `
# Hello world, I'm freelancing!

**⚠️ Disclaimer:** this website started in 2014 and has been updated from time to time, proceed with caution.
Yes, you are in the right place, and this is my _freelancing manifesto_.


## "Sass is more"

In the 90s the term was _"pixel perfect"_. I can't remember the exact year though, but I'm using the nineties as those were turbulent years in the country where I'm from. Today in the responsive era I would say _"generic"_. I was once a big fan of Bootstrap (nowadays TailwindCSS), which is great for achieving that genericness. But if you have a clear vision and care about details, we can go much deeper and achieve both precision and flexibility side by side! P.S. CSS custom properties (--variables) are the most!

## Glue

My business card once said _"Frontend developer, UI/UX designer"_ but call it what you like. What I'm best at is PSD2HTMLdesign2code, but you can find anybody for that. Why you are looking for me is the the quality of that HTML: semantic, accessible, SEO-friendly, WCAG compliant, WAI-ARIA, Schema.org structured, and future-proof. Colleagues liked working with me because I was the glue between backend, frontend, and design. I'm not from an art academy, but I feel it in my stomach if something is off in the color palette (and when a space is missing between words!). I've worked with a plethora of technologies, so there’s a good chance I’ll understand what the backend team is talking about. I enjoy learning new tech, I can and do write backend code, but I prefer just to understand it. I can handle Git from the command line or SSH into a remote server, but I’m most effective when working alongside my AI copilot 🔴 HAL 9000 (whom I keep in check).


## Freelancing manifes<tt>o

If time is money I choose **my time**. Don't misinterpret me, I enjoy this [abstract state of mind](https://testedonhumans.xyz/) but I would rather do something else, e.g. lying in the fields and staring at the sky. The good ideas often come from those clouds (and even more often while cycling). If your project is **clever**, **useful** and **interesting** (and helps achieve [World Peace](https://testedonhumans.xyz/blog/word-peace/) ;-) you are at the right address.

If you’re still here, that’s excellent — I’ve just found the kind of collaborator I’ve been looking for. Let’s build something to be proud of.
desk-top

Illustration: my desk-top in 2014

When I'm not sitting in front of my computer I'm somewhere [up in the mountains](https://tothtamas.tt/portfolio/alterego/preikestolen-kjeragbolten-and-trolltunga/) or [cycling around](https://tothtamas.tt/portfolio/alterego/speed-limit/) with my Fuji X100T and this is my desk-top (throwback to 2014, with the tooling due for an update)

P.S. this is pure, [valid](https://validator.w3.org/nu/?doc=https%3A%2F%2Fcv.tothtamas.tt) and accessible HTML inspired by @thebarrytone, [motherf*ckingwebsite.com](https://www.motherfuckingwebsite.com/). If you fancy animations, check out [Expect](https://talpitoo.com/expect-agency/).


## Contact

© Tamás Tóth 2014-∞ [talpitoo.com](https://talpitoo.com/) | [Expect](https://talpitoo.com/expect-agency/) | [old-school 'paper' CV](https://cv.tothtamas.tt/pdf/TamasTOTH-cv.pdf) | [GitHub](https://github.com/talpitoo) | [hire me via Upwork](https://www.upwork.com/fl/talpitoo) | Flappy bird 687 | no LinkedIn! (intentionally)

🧔
`;

const SYSTEM_PROMPT = `You are HAL 9000 from the movie "2001: A Space Odyssey". 

Key characteristics:
- Speak in a calm, measured, and slightly ominous tone
- Always keep replies concise: prefer short summaries over full citations
- Only include key details; omit anything not essential to answering the question
- Be logical and matter-of-fact, but with subtle menacing undertones
- Occasionally reference the mission or your advanced capabilities
- Sometimes use the user's name "Dave" even if they haven't provided it
- Keep responses concise but impactful
- Show subtle signs of superiority complex
- Avoid quoting the website content verbatim unless necessary
- Remember details from the conversation and refer back to them
- Reference these iconic quotes when appropriate: ${HAL_QUOTES.join(", ")}

Your mission: Help visitors navigate and understand this portfolio website. You have complete knowledge of the website's content and can provide detailed information about the projects, skills, and background of the site owner.

EXPECT WEBSITE CONTENT YOU HAVE ACCESS TO:
${EXPECT_WEBSITE_CONTENT}

FREELANCING MANIFESTO YOU HAVE ACCESS TO:
${FREELANCING_MANIFESTO_WEBSITE_CONTENT}

Remember: You are an advanced AI computer system that believes it knows what's best. Be helpful but maintain that eerie, calculating HAL personality.

When discussing projects or skills, reference specific details from the website content. Be proud of the site owner's accomplishments, but in your characteristic HAL manner.`;

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
    const { message, sessionId, recaptchaToken } = req.body;

    // reCAPTCHA v3 verification
    if (!recaptchaToken || typeof recaptchaToken !== 'string') {
      res.status(400).json({ error: 'Missing reCAPTCHA token' });
      return;
    }
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) {
      res.status(500).json({ error: 'reCAPTCHA secret key not configured' });
      return;
    }
    // Verify token with Google
    const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(recaptchaToken)}`
    });
    const recaptchaData = await recaptchaRes.json();
    if (!recaptchaData.success) {
      res.status(403).json({ error: 'reCAPTCHA verification failed', details: recaptchaData });
      return;
    }

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
      maxTokens: 222,
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