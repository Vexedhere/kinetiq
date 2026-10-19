# Kinetiq implementation roadmap

## Included in the initial scaffold
- Responsive dark community dashboard and channel navigation
- Theater UI with synchronized-playback status presentation
- Client-side demo chat, timestamp affordances, voice lounge screen
- Owner milestone badge visuals and member progress card
- Starter PostgreSQL schema and health endpoint

## Next implementation phases
1. **Authentication:** integrate a trusted provider and verify sessions server-side.
2. **Database access:** add migrations and a server-only PostgreSQL client; enforce guild/channel roles for every operation.
3. **Persistent chat:** history pagination, moderation, edits/deletes, rate limits, and WebSocket delivery.
4. **Native media:** short-lived presigned uploads, MP4/WebM allowlist, size quotas, file-signature validation, moderation, and media metadata. Playback must use the native HTML5 video element with owned storage URLs.
5. **Theater sync:** persist authoritative state; authorize commands; use server timestamps, revision checks, reconnect snapshots, and drift correction.
6. **Voice/stage:** WebRTC signaling plus a production SFU such as LiveKit or mediasoup and TURN. Mesh-only voice will not scale to larger rooms.
7. **Owner milestones:** recalculate from eligible unique membership records, rate-limit joins, detect abuse, audit changes, and gate perks on verified counts.
8. **Production operations:** automated tests, logging, monitoring, backups, reporting, privacy policy, terms, accessibility, and security review.

## Badge thresholds
- Wood: 100+ eligible members — vanity URL
- Stone: 500+ — banners and extra emojis
- Iron: 1,000+ — 1080p high-bitrate streaming
- Gold: 5,000+ — featured explore placement
- Diamond: 10,000+ — partner review and monetization eligibility

A badge tier is not identity verification by itself. Diamond should open a partner review flow rather than automatically enabling payouts.

## Production boundary
This repository currently contains a UI prototype and initial scaffolding, not a production-ready communication platform. Do not claim authentication, actual voice calls, persistent messages, live uploads, playback synchronization, or monetization are operational until integrated and tested.
