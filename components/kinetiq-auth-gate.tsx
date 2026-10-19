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
import { ArrowRight, Check, Github, LoaderCircle, LockKeyhole, Sparkles, Waves } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  displayName: string;
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  displayName: "",
  supabase: null,
});

export function useKinetiqAuth() {
  return useContext(AuthContext);
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
      syncUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, syncUser]);

  async function signIn(provider: "github" | "google") {
    if (!supabase) return;
    setError("");
    setBusyProvider(provider);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (signInError) {
      setError(signInError.message);
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
        <section className="auth-card auth-setup-card">
          <div className="auth-brand"><span><Waves size={25} /></span><strong>kinetiq</strong></div>
          <div className="auth-kicker"><Sparkles size={14} /> ONE LAST CONNECTION</div>
          <h1>Connect your<br /><em>community.</em></h1>
          <p>Kinetiq is deployed, but sign-in needs your Supabase project keys before anyone can create an account.</p>
          <div className="auth-setup-steps">
            <div><span>1</span><div><strong>Add the two environment variables in Vercel</strong><small>NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</small></div></div>
            <div><span>2</span><div><strong>Enable Google and GitHub providers</strong><small>Supabase Dashboard → Authentication → Sign In / Providers</small></div></div>
            <div><span>3</span><div><strong>Redeploy Kinetiq</strong><small>Then people can sign in and choose their display name.</small></div></div>
          </div>
          <a className="auth-doc-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase dashboard <ArrowRight size={15} /></a>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="auth-brand"><span><Waves size={25} /></span><strong>kinetiq</strong></div>
          <div className="auth-orbit"><div className="auth-orbit-core"><Waves size={38} /></div><i /><i /><i /></div>
          <div className="auth-kicker"><Sparkles size={14} /> YOUR PEOPLE, IN SYNC</div>
          <h1>Find your<br /><em>frequency.</em></h1>
          <p>A home for your communities, late-night conversations, and watch parties. Sign in to get started.</p>
          <button className="oauth-button oauth-github" disabled={!!busyProvider} onClick={() => signIn("github")}>
            {busyProvider === "github" ? <LoaderCircle size={18} className="auth-spinner" /> : <Github size={18} />}
            Continue with GitHub
          </button>
          <button className="oauth-button oauth-google" disabled={!!busyProvider} onClick={() => signIn("google")}>
            {busyProvider === "google" ? <LoaderCircle size={18} className="auth-spinner" /> : <span className="google-g">G</span>}
            Continue with Google
          </button>
          {error && <p className="auth-error">{error}</p>}
          <div className="auth-privacy"><LockKeyhole size={13} /> Your account. Your display name. Your space.</div>
          <div className="auth-foot">By continuing, you agree to keep Kinetiq welcoming and respectful.</div>
        </section>
      </main>
    );
  }

  if (!displayName.trim()) {
    return (
      <main className="auth-screen">
        <section className="auth-card name-card">
          <div className="auth-brand"><span><Waves size={25} /></span><strong>kinetiq</strong></div>
          <div className="auth-kicker"><Check size={14} /> ACCOUNT CONNECTED</div>
          <h1>What should<br />we <em>call you?</em></h1>
          <p>Choose the name people will see in chat and around your communities. You can change it later.</p>
          <form onSubmit={saveDisplayName} className="display-name-form">
            <label htmlFor="display-name">DISPLAY NAME</label>
            <input id="display-name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="e.g. Chethan" minLength={2} maxLength={32} autoFocus required />
            <small>2–32 characters · No need to use your real name.</small>
            {error && <p className="auth-error">{error}</p>}
            <button className="oauth-button oauth-submit" type="submit" disabled={savingName}>{savingName ? <LoaderCircle size={18} className="auth-spinner" /> : <>Enter Kinetiq <ArrowRight size={17} /></>}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ user, displayName, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}
