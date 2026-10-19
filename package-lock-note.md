# Setup notes

Run `npm install` and then `npm run dev`; open http://localhost:3000.

The web UI is a Next.js app. WebSockets require a separate long-running realtime service; static GitHub Pages hosting is not sufficient for WebSockets, server-side API routes, or secure upload signing. Deploy Next.js to a Node-compatible host and the realtime server to its own service. Store credentials only in hosting environment settings, never browser code.

The starter is not production-safe for public launch until authentication, authorization, persistent state, storage signing, rate limits, and tests are implemented.
