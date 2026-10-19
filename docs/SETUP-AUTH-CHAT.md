# Kinetiq auth and chat setup

Kinetiq now includes GitHub/Google OAuth buttons, required display-name onboarding, Supabase-backed chat messages with realtime updates, and a role-creation panel.

## 1. Configure Supabase

Use a Supabase project created for Kinetiq. Do not use a service-role key in Vercel environment variables.

1. In Supabase, open **Authentication → Sign In / Providers** and enable **GitHub** and **Google**. Each provider requires its own OAuth client credentials. In the GitHub and Google developer consoles, use the callback URL shown on the matching Supabase provider settings page as the provider redirect URI.
2. In **Authentication → URL Configuration**, set the Site URL to:
   `https://kinetiq-rzla.vercel.app`
3. Add this redirect URL to the allowed redirect URLs:
   `https://kinetiq-rzla.vercel.app/**`
   For local development, also allow `http://localhost:3000/**`.
4. Open **SQL Editor**, paste the complete contents of `db/kinetiq-auth-chat.sql`, and run it.

The SQL creates profile, chat-message, and chat-role tables, enables row-level security, adds policies, grants authenticated access, and enables Realtime for messages.

## 2. Configure Vercel

The current `main` branch already includes the project URL and the **publishable** browser key you supplied as safe client defaults, so you do not need to paste them into Vercel for the current project. If you prefer environment-based configuration, open **Vercel → Kinetiq → Settings → Environment Variables** and add these for Production (and Preview if needed):

- `NEXT_PUBLIC_SUPABASE_URL`: the Project URL from Supabase Project Settings → API.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key. A legacy anon key can be used if your project only exposes that, but never put a service-role/secret key in a `NEXT_PUBLIC_` variable.

If you add or change environment variables, save them and redeploy the latest `main` commit. The app will use environment values when present and otherwise fall back to the public client defaults in `lib/supabase.ts`.

## 3. What is implemented

- The app shows sign-in first and offers GitHub and Google OAuth.
- After first sign-in, users must choose a 2–32 character display name.
- Display names are saved to Supabase Auth metadata and the `profiles` table.
- Messages in the currently selected channel are stored in `chat_messages` and subscribed to through Supabase Realtime.
- Users can create named, colored roles stored in `chat_roles`.

## Current limitations

This is the first connected pass, not full Discord parity yet. The guild/member rail still contains prototype data; role creation is saved per account, but community-scoped role assignment and permission management are not implemented yet. Voice, actual video upload, and synchronized playback also remain prototype UI until their services are connected.
