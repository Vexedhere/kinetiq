# Kinetiq

Kinetiq is a real-time community media hub for guilds, text chat, voice lounges, and synchronized native video theaters.

## Status

The initial application scaffold is being built. The current UI prototype is designed to run with Next.js and Tailwind CSS. Production features such as authentication, persistent chat, WebRTC voice, synchronized playback, PostgreSQL, and object storage require the environment variables and services described below.

## Local development

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in configured service values as needed.
4. Run `npm run dev` and open http://localhost:3000.

## Planned stack

- Next.js, React, TypeScript, Tailwind CSS
- Zustand for client state
- Socket.IO for real-time events and server-authoritative theater synchronization
- WebRTC for voice
- PostgreSQL for users, guilds, channels, roles, messages, media metadata, and badge verification
- S3-compatible object storage (Cloudflare R2 or AWS S3) for direct MP4/WebM uploads

## Security notes

Never expose database credentials, storage secret keys, or server-side tokens in browser code. Uploads should use short-lived presigned URLs, enforce file size/type limits, and validate media server-side. Member milestones must be derived from eligible member records, not owner-submitted counts.
