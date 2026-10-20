"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Check, Github, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  displayName: string;
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
};

const KINETIQ_CANONICAL_URL = "https://kinetiq-rzla.vercel.app";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  displayName: "",
  supabase: null,
});

export function useKinetiqAuth() {
  return useContext(AuthContext);
}

function AuthVisualPanel() {
  return (
    <aside className="auth-showcase" aria-label="Kinetiq community preview">
      <div className="showcase-grid" aria-hidden="true" />
      <div className="showcase-topline"><span className="showcase-logo"><Waves size={19} /></span><span>KINETIQ</span><span className="showcase-beta">BETA</span></div>
      <div className="showcase-copy">
        <span className="showcase-eyebrow"><i /> COMMUNITY, WITHOUT THE NOISE</span>
        <h2>A focused space.<br /><em>Built around people.</em></h2>
        <p>Bring conversations, shared media, and your community into one clear workspace.</p>
      </div>
      <div className="showcase-preview">
        <div className="preview-window-top"><span><i /><i /><i /></span><span className="preview-room-label"><Waves size={12} /> kinetiq lounge</span><span className="preview-live"><i /> LIVE</span></div>
        <div className="preview-room">
          <div className="preview-room-art"><div className="preview-art-orb" /><div className="preview-art-horizon" /><span className="preview-art-label">WATCH TOGETHER</span><strong>together,<br /><em>in focus.</em></strong><span className="preview-art-caption">Community screening · HD</span></div>
          <div className="preview-chat">
            <div className="preview-chat-heading"><span>ROOM CHAT</span><span>03 online</span></div>
            <div className="preview-chat-line"><span className="preview-avatar avatar-lilac">m</span><div><strong>mira.exe</strong><p>this is such a vibe ✨</p></div></div>
            <div className="preview-chat-line"><span className="preview-avatar avatar-mint">n</span><div><strong>noah.wav</strong><p>everyone synced?</p></div></div>
            <div className="preview-chat-line"><span className="preview-avatar avatar-gold">c</span><div><strong>you</strong><p>right here. 🍿</p></div></div>
            <div className="preview-chat-input"><span>Say something nice…</span><span>↗</span></div>
          </div>
        </div>
        <div className="preview-footer"><span><i /> Shared spaces. One community.</span><span>01:24 <b>·</b> SYNCED</span></div>
      </div>
      <div className="showcase-bottom"><span><ShieldCheck size={14} /> Built for real communities</span><span>MAKE YOUR SPACE</span></div>
    </aside>
  );
}

export function KinetiqAuthGate({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [busyProvider, setBusyProvider] = useState<"github" | "google" | null>(null);
  const [error, setError] = useState("");

  const syncUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) setBusyProvider(null);
    const name = String(nextUser?.user_metadata?.display_name || "");
    setDisplayName(name);
    setNameDraft(name);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      syncUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) setError("");
      syncUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, syncUser]);

  async function signIn(provider: "github" | "google") {
    if (!supabase) {
      setError("Sign-in is not configured yet. Please try again later.");
      return;
    }
    setError("");
    setBusyProvider(provider);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        // Always return to Kinetiq's canonical URL, never whichever domain embedded or opened it.
        options: { redirectTo: KINETIQ_CANONICAL_URL },
      });
      if (signInError) {
        setError(signInError.message.includes("provider")
          ? `${provider === "github" ? "GitHub" : "Google"} sign-in isn't enabled yet. Please try the other option or contact the site owner.`
          : signInError.message);
        setBusyProvider(null);
      }
    } catch {
      setError("Couldn't start sign-in. Check your connection and try again.");
      setBusyProvider(null);
    }
  }

  async function saveDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const name = nameDraft.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 32) {
      setError("Choose a display name between 2 and 32 characters.");
      return;
    }
    setSavingName(true);
    setError("");
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: { display_name: name },
    });
    if (updateError) {
      setError(updateError.message);
      setSavingName(false);
      return;
    }

    // Profile sync is optional until the SQL setup script has been run.
    const updatedUser = data.user ?? user;
    try {
      await supabase.from("profiles").upsert({
        id: updatedUser.id,
        display_name: name,
        avatar_url: typeof updatedUser.user_metadata?.avatar_url === "string"
          ? updatedUser.user_metadata.avatar_url
          : null,
      });
    } catch {
      // Auth metadata remains the source of the display name if the profile table isn't set up yet.
    }

    syncUser({ ...updatedUser, user_metadata: { ...updatedUser.user_metadata, display_name: name } });
    setSavingName(false);
  }

  if (loading) {
    return <div className="auth-loading"><LoaderCircle size={24} className="auth-spinner" /><span>Getting your space ready…</span></div>;
  }

  if (!supabase) {
    return (
      <main className="auth-screen">
        <div className="auth-layout"><AuthVisualPanel />
        <section className="auth-card auth-setup-card">
          <div className="auth-brand"><span><Waves size={25} /></span><strong>kinetiq</strong></div>
          <div className="auth-kicker"><Sparkles size={14} /> FINISHING THE CONNECTION</div>
          <h1>Your people,<br /><em>in sync.</em></h1>
          <p>This deployed build hasn't picked up Kinetiq's Supabase configuration yet. The latest source includes the project connection, so publish the latest commit from the main branch to refresh this page.</p>
          <div className="auth-setup-steps">
            <div><span>1</span><div><strong>Open your Kinetiq project in Vercel</strong><small>Choose the project connected to Vexedhere/kinetiq.</small></div></div>
            <div><span>2</span><div><strong>Redeploy the latest main commit</strong><small>Use the newest deployment source, not an older build.</small></div></div>
            <div><span>3</span><div><strong>Check your Supabase sign-in providers</strong><small>Enable Google and GitHub under Authentication → Sign In / Providers.</small></div></div>
          </div>
          <a className="auth-doc-link" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Open Vercel dashboard <ArrowRight size={15} /></a>
        </section></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <div className="auth-layout"><AuthVisualPanel />
        <section className="auth-card">
          <div className="auth-brand"><span><Waves size={25} /></span><strong>kinetiq</strong></div>
          <div className="auth-orbit"><div className="auth-orbit-core"><Waves size={38} /></div><i /><i /><i /></div>
          <div className="auth-kicker"><Sparkles size={14} /> COMMUNITY, WITHOUT THE NOISE</div>
          <h1>Your community.<br /><em>In one place.</em></h1>
          <p>Access your communities, conversations, and shared viewing spaces with one secure account.</p>
          <div className="auth-login-benefits"><span><Check size={13} /> Your spaces, together</span><span><Check size={13} /> A profile you control</span></div>
          <button className="oauth-button oauth-github" disabled={!!busyProvider} onClick={() => signIn("github")}>
            {busyProvider === "github" ? <LoaderCircle size={18} className="auth-spinner" /> : <Github size={18} />}
            Continue with GitHub
          </button>
          <button className="oauth-button oauth-google" disabled={!!busyProvider} onClick={() => signIn("google")}>
            {busyProvider === "google" ? <LoaderCircle size={18} className="auth-spinner" /> : <span className="google-g">G</span>}
            Continue with Google
          </button>
          {error && <p className="auth-error">{error}</p>}
          <div className="auth-privacy"><LockKeyhole size={13} /> Authentication handled securely by your identity provider</div>
          <div className="auth-canonical-note">You’ll return to <strong>kinetiq-rzla.vercel.app</strong> after sign-in.</div>
          <div className="auth-foot">By continuing, you agree to use Kinetiq responsibly and respectfully.</div>
        </section></div>
      </main>
    );
  }

  if (!displayName.trim()) {
    return (
      <main className="auth-screen">
        <div className="auth-layout"><AuthVisualPanel />
        <section className="auth-card name-card">
          <div className="auth-brand"><span><Waves size={25} /></span><strong>kinetiq</strong></div>
          <div className="auth-kicker"><Check size={14} /> ACCOUNT CONNECTED</div>
          <h1>Set up your<br /><em>profile.</em></h1>
          <p>Choose the display name other members will see. You can update it later.</p>
          <form onSubmit={saveDisplayName} className="display-name-form">
            <label htmlFor="display-name">DISPLAY NAME</label>
            <input id="display-name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="e.g. Chethan" minLength={2} maxLength={32} autoFocus required />
            <small>2–32 characters · No need to use your real name.</small>
            {error && <p className="auth-error">{error}</p>}
            <button className="oauth-button oauth-submit" type="submit" disabled={savingName}>{savingName ? <LoaderCircle size={18} className="auth-spinner" /> : <>Enter Kinetiq <ArrowRight size={17} /></>}</button>
          </form>
        </section></div>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ user, displayName, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}
