"use client";

import { useEffect, useMemo, useState } from "react";
import { KinetiqAuthGate, useKinetiqAuth } from "@/components/kinetiq-auth-gate";
import {
  Activity, ArrowDown, ArrowUpRight, Bell, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clapperboard, Compass, Crown, Hash, Headphones, Home, ImagePlus, LockKeyhole,
  MessageCircle, Mic, MicOff, MoreHorizontal, Plus, Search, Send, Settings, ShieldCheck,
  Sparkles, Smile, Users, Video, Volume2, Waves, Wifi, X, Zap
} from "lucide-react";

type ChatMessage = { id: number | string; name: string; initials: string; color: string; time: string; text: string; role?: string; badge?: string; author_id?: string; };

const initialMessages: ChatMessage[] = [
  { id: 1, name: "mira.exe", initials: "M", color: "lilac", time: "8:41 PM", text: "okay this theater sync is actually so smooth?? ✨" },
  { id: 2, name: "noah.wav", initials: "N", color: "mint", time: "8:42 PM", text: "the drift correction is doing its thing. we're all at 01:24 now" },
  { id: 3, name: "Chethan", initials: "C", color: "gold", time: "8:42 PM", text: "told you we'd get movie night working 🎬", role: "OWNER", badge: "diamond" },
  { id: 4, name: "pixelghost", initials: "P", color: "blue", time: "8:43 PM", text: "wait for the next scene, the soundtrack goes crazy" },
  { id: 5, name: "mira.exe", initials: "M", color: "lilac", time: "8:43 PM", text: "rewind like 10 seconds? I missed the bit 😭" }
];

const members = [
  { name: "Chethan", status: "Watching the theater", color: "gold", initials: "C", badge: "diamond" },
  { name: "mira.exe", status: "Watching together", color: "lilac", initials: "M" },
  { name: "noah.wav", status: "In the lounge", color: "mint", initials: "N" },
  { name: "pixelghost", status: "Watching together", color: "blue", initials: "P" },
  { name: "luna", status: "Listening to music", color: "pink", initials: "L" }
];

const guilds = [
  { name: "Kinetiq HQ", letters: "K", color: "guild-purple" },
  { name: "Afterhours", letters: "A", color: "guild-blue" },
  { name: "The Studio", letters: "S", color: "guild-pink" },
  { name: "Pixel Club", letters: "P", color: "guild-orange" }
];

function Avatar({ initials, color, small = false }: { initials: string; color: string; small?: boolean }) {
  return <span className={`avatar avatar-${color} ${small ? "avatar-small" : ""}`}>{initials}</span>;
}

function OwnerBadge({ type }: { type: string }) {
  const labels: Record<string, string> = { wood: "Wood Check · 100+ members", stone: "Stone Check · 500+ members", iron: "Iron Check · 1,000+ members", gold: "Gold Check · 5,000+ members", diamond: "Diamond Check · 10,000+ members" };
  return <span className={`owner-check check-${type}`} title={labels[type] || "Community owner"}><Check size={10} strokeWidth={3.5} /></span>;
}

function HomePageContent() {
  const { user: authUser, displayName, supabase } = useKinetiqAuth();
  const userInitial = (displayName.trim()[0] || "K").toUpperCase();
  const [activeChannel, setActiveChannel] = useState("theater");
  const [activeGuild, setActiveGuild] = useState(0);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [joinedVoice, setJoinedVoice] = useState(false);
  const [search, setSearch] = useState("");
  const [showExplore, setShowExplore] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [roleNameDraft, setRoleNameDraft] = useState("");
  const [roleColorDraft, setRoleColorDraft] = useState("purple");
  const [roles, setRoles] = useState<{id?: string; name: string; color: string}[]>([
    { name: "OWNER", color: "gold" }, { name: "MODERATOR", color: "purple" }, { name: "MEMBER", color: "mint" }
  ]);
  const [notice, setNotice] = useState("");
  const [duration] = useState("12:48");
  const filteredMembers = useMemo(() => members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())), [search]);

  useEffect(() => {
    if (!supabase || !authUser) return;
    let disposed = false;
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, channel_slug, author_id, body, created_at, profiles(display_name)")
        .eq("channel_slug", activeChannel)
        .order("created_at", { ascending: true })
        .limit(100);
      if (disposed || error || !data) return;
      setMessages(data.map((row: any) => {
        const name = row.profiles?.display_name || (row.author_id === authUser.id ? displayName : "Kinetiq member");
        return { id: row.id, author_id: row.author_id, name, initials: String(name).slice(0, 1).toUpperCase(), color: row.author_id === authUser.id ? "lilac" : "blue", time: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text: row.body, role: row.author_id === authUser.id ? "YOU" : undefined };
      }));
    };
    void loadMessages();
    const channel = supabase.channel("kinetiq-chat-" + activeChannel)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: "channel_slug=eq." + activeChannel }, () => { void loadMessages(); })
      .subscribe();
    return () => { disposed = true; void supabase.removeChannel(channel); };
  }, [supabase, authUser, displayName, activeChannel]);

  useEffect(() => {
    if (!supabase || !authUser) return;
    let disposed = false;
    supabase.from("chat_roles").select("id,name,color").eq("created_by", authUser.id).order("created_at", { ascending: true })
      .then(({ data, error }) => { if (!disposed && !error && data?.length) setRoles(data); });
    return () => { disposed = true; };
  }, [supabase, authUser]);

  async function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const message: ChatMessage = { id: Date.now(), name: displayName || "Kinetiq member", initials: userInitial, color: "lilac", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), text, role: "YOU", author_id: authUser?.id };
    if (supabase && authUser) {
      const { error } = await supabase.from("chat_messages").insert({ channel_slug: activeChannel, author_id: authUser.id, body: text });
      if (!error) return;
      announce("Message could not sync yet. Run db/kinetiq-auth-chat.sql in your Supabase project.");
    }
    setMessages((prev) => [...prev, message]);
  }

  async function createRole() {
    const name = roleNameDraft.trim().replace(/\s+/g, " ").toUpperCase();
    if (name.length < 2 || name.length > 32) { announce("Role names must be 2–32 characters."); return; }
    if (roles.some((role) => role.name.toLowerCase() === name.toLowerCase())) { announce("That role already exists."); return; }
    if (supabase && authUser) {
      const { data, error } = await supabase.from("chat_roles").insert({ name, color: roleColorDraft, created_by: authUser.id }).select("id,name,color").single();
      if (error) { announce("Could not save role yet. Run db/kinetiq-auth-chat.sql in Supabase."); return; }
      setRoles((current) => [...current, data]);
    } else {
      setRoles((current) => [...current, { name, color: roleColorDraft }]);
    }
    setRoleNameDraft("");
    announce("Role created: " + name);
  }

  function announce(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3200);
  }

  return (
    <main className="app-shell">
      <aside className="guild-rail">
        <button className="brand-mark" aria-label="Kinetiq home" onClick={() => { setActiveChannel("theater"); setShowExplore(false); }}><Waves size={25} strokeWidth={2.5} /></button>
        <div className="rail-divider" />
        {guilds.map((guild, index) => <button key={guild.name} title={guild.name} className={`guild-icon ${guild.color} ${activeGuild === index ? "guild-active" : ""}`} onClick={() => { setActiveGuild(index); announce(`Switched to ${guild.name}`); }}><span>{guild.letters}</span>{activeGuild === index && <i />}</button>)}
        <button className="guild-add" title="Create a community" onClick={() => announce("Community creation will be available after authentication is connected.")}><Plus size={20} /></button>
        <button className="rail-bottom" title="Explore communities" onClick={() => setShowExplore(true)}><Compass size={20} /></button>
      </aside>

      <aside className="channel-sidebar">
        <button className="workspace-switch" onClick={() => announce("Community switcher")}><span className="workspace-symbol">K</span><span className="workspace-copy"><strong>{guilds[activeGuild].name}</strong><small>Community space</small></span><ChevronDown size={16} /></button>
        <div className="sidebar-search"><Search size={15} /><input aria-label="Search members" placeholder="Quick find..." value={search} onChange={(e) => setSearch(e.target.value)} /><kbd>⌘ K</kbd></div>
        <div className="sidebar-scroll">
          <button className={`nav-link ${activeChannel === "home" ? "nav-selected" : ""}`} onClick={() => setActiveChannel("home")}><Home size={17} /> Overview</button>
          <button className="nav-link" onClick={() => setShowExplore(true)}><Compass size={17} /> Explore <span className="nav-new">NEW</span></button>
          <button className="nav-link" onClick={() => setShowRoles(true)}><ShieldCheck size={17} /> Roles <span className="nav-new">NEW</span></button>
          <div className="channel-label"><span>YOUR CHANNELS</span><button title="Add channel" onClick={() => announce("Channel creation will be available when the backend is connected.")}><Plus size={15} /></button></div>
          <button className={`channel-link ${activeChannel === "general" ? "channel-selected" : ""}`} onClick={() => setActiveChannel("general")}><Hash size={16} /> general</button>
          <button className={`channel-link ${activeChannel === "announcements" ? "channel-selected" : ""}`} onClick={() => setActiveChannel("announcements")}><Hash size={16} /> announcements <span className="unread-dot" /></button>
          <button className={`channel-link ${activeChannel === "theater" ? "channel-selected" : ""}`} onClick={() => setActiveChannel("theater")}><Clapperboard size={16} /> movie-theater <span className="live-mini">LIVE</span></button>
          <div className="channel-label voice-label"><span>VOICE LOUNGES</span><button title="Add voice lounge" onClick={() => announce("Voice lounge creation is coming with the WebRTC backend.")}><Plus size={15} /></button></div>
          <button className={`channel-link ${activeChannel === "lounge" ? "channel-selected" : ""}`} onClick={() => setActiveChannel("lounge")}><Volume2 size={16} /> The chill zone <span className="voice-count">3</span></button>
          {joinedVoice && <div className="voice-connected"><span className="connection-pulse" /> Connected · The chill zone</div>}
          <div className="sidebar-event"><div className="event-icon"><Clapperboard size={18} /></div><div><strong>Community movie night</strong><span>Happening now</span></div><span className="event-dot" /></div>
        </div>
        <div className="user-panel">
          <Avatar initials={userInitial} color="lilac" />
          <div className="user-meta"><div className="user-name">{displayName || "Kinetiq member"}</div><span>Signed in</span></div>
          <button className="icon-button" aria-label="Mute microphone" onClick={() => setMuted(!muted)}>{muted ? <MicOff size={17} /> : <Mic size={17} />}</button>
          <button className="icon-button" aria-label="Settings" onClick={() => announce("Settings will be available after accounts are enabled.")}><Settings size={17} /></button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span className="breadcrumb-muted">Kinetiq HQ</span><ChevronRight size={14} /><Hash size={15} /><strong>{activeChannel === "theater" ? "movie-theater" : activeChannel === "lounge" ? "The chill zone" : activeChannel}</strong><span className="top-live"><i /> LIVE SESSION</span></div>
          <div className="top-actions"><button className="top-action" onClick={() => setShowExplore(true)}><Compass size={17} /><span>Explore</span></button><button className="top-action" onClick={() => announce("You're all caught up.")}><Bell size={17} /></button><button className="top-action" onClick={() => announce("Help center is coming soon.")}><CircleHelp size={17} /></button><span className="top-divider" /><button className="invite-button" onClick={() => { navigator.clipboard?.writeText(window.location.href); announce("Page link copied (demo link)."); }}><Plus size={15} /> Invite</button></div>
        </header>

        {activeChannel === "theater" ? <div className="theater-layout">
          <div className="theater-column">
            <div className="theater-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> THEATER ROOM <span className="eyebrow-separator">/</span> SESSION #024</div><h1>Friday night <span>watch party</span></h1><p>One screen, everyone in sync. Make yourself at home.</p></div><button className="more-button" onClick={() => announce("Theater settings will be available with persistent rooms.")}><MoreHorizontal size={21} /></button></div>
            <div className="video-frame">
              <div className="video-art">
                <div className="art-stars"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                <div className="art-moon" />
                <div className="art-horizon" />
                <div className="art-mountain mountain-back" /><div className="art-mountain mountain-front" />
                <div className="art-water" />
                <div className="art-film-label"><span className="film-dot" /> NOW PLAYING</div>
                <div className="art-title"><span>AN ORIGINAL SHORT FILM</span><strong>Beyond<br />the <em>quiet</em></strong><small>A Kinetiq community screening</small></div>
                <button className="big-play" aria-label={playing ? "Pause preview" : "Play preview"} onClick={() => setPlaying(!playing)}>{playing ? <span className="pause-glyph">Ⅱ</span> : <span className="play-glyph">▶</span>}</button>
                <div className="video-watermark"><Waves size={14} /> KINETIQ ORIGINALS</div>
              </div>
              <div className="video-controls">
                <div className="timeline"><span className="timeline-played" style={{ width: "18.2%" }} /><i style={{ left: "18.2%" }} /></div>
                <div className="control-row"><div className="control-left"><button className="player-control" onClick={() => setPlaying(!playing)}>{playing ? <span className="pause-glyph">Ⅱ</span> : <span>▶</span>}</button><button className="player-control" onClick={() => announce("Volume controls are ready for the native media player.")}><Volume2 size={17} /></button><span className="timecode">01:24 <span>/ {duration}</span></span><span className="sync-status"><span /> SYNCED</span></div><div className="control-right"><button className="player-control" onClick={() => announce("Playback speed options will appear with the native player.")}>1×</button><button className="player-control" onClick={() => announce("Theater settings")}><Settings size={16} /></button><button className="player-control" onClick={() => announce("Fullscreen requires a connected media source.")}><ArrowUpRight size={17} /></button></div></div>
              </div>
            </div>
            <div className="media-info-row"><div className="media-info"><div className="media-poster"><Sparkles size={22} /></div><div><h2>Beyond the quiet <span className="native-pill"><Check size={11} /> NATIVE VIDEO</span></h2><p>Uploaded by <strong>{displayName || "you"}</strong> · 12 min 48 sec · 1080p</p></div></div><div className="watching-stack"><div className="stack-avatars"><Avatar initials="M" color="lilac" small /><Avatar initials="N" color="mint" small /><Avatar initials="P" color="blue" small /><Avatar initials="L" color="pink" small /></div><span><strong>5</strong> watching</span></div></div>
            <div className="theater-notice"><div className="notice-icon"><Wifi size={17} /></div><div><strong>Everyone is in sync</strong><span>Playback is coordinated for this room. Chat timestamps jump to the moment.</span></div><span className="notice-check"><Check size={15} /></span></div>
            <div className="quick-reactions"><span>React</span>{["❤️", "😂", "🔥", "👏", "👀"].map((emoji) => <button key={emoji} onClick={() => { setDraft((d) => d + emoji); }} aria-label={`React with ${emoji}`}>{emoji}</button>)}<button className="add-reaction" onClick={() => announce("More reactions coming soon.")}><Plus size={15} /></button><span className="reaction-hint">Reactions show up for everyone in the room</span></div>
          </div>
          <aside className="chat-panel">
            <div className="chat-header"><div><h3><MessageCircle size={17} /> Live chat</h3><span><i /> {members.length} people here</span></div><button className="icon-button" aria-label="Chat options" onClick={() => announce("Chat options")}><MoreHorizontal size={20} /></button></div>
            <div className="chat-topic"><span className="topic-icon"><Clapperboard size={15} /></span><div><strong>Friday night watch party</strong><span>Be kind. Keep it cozy. 🍿</span></div></div>
            <div className="chat-messages" aria-live="polite">
              <div className="chat-divider"><span>Today</span></div>
              {messages.map((message) => <article className="chat-message" key={message.id}><Avatar initials={message.initials} color={message.color} /><div className="message-content"><div className="message-meta"><strong>{message.name}</strong>{message.badge && <OwnerBadge type={message.badge} />}{message.role && <span className="owner-label">{message.role}</span>}<time>{message.time}</time></div><p>{message.text.split(/(01:24)/g).map((part, i) => part === "01:24" ? <button className="timestamp-link" key={i} onClick={() => announce("Timestamp seeking requires the native video source.")}>{part}</button> : part)}</p></div></article>)}
            </div>
            <div className="chat-composer"><div className="composer-wrap"><button className="composer-plus" onClick={() => setShowUpload(true)} aria-label="Attach media"><Plus size={19} /></button><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }} placeholder={`Message #movie-theater`} aria-label="Write a message" /><button className="composer-emoji" onClick={() => setDraft((d) => d + " ✨")} aria-label="Add emoji"><Smile size={18} /></button><button className="send-button" onClick={sendMessage} aria-label="Send message"><Send size={16} /></button></div><div className="composer-foot"><span><LockKeyhole size={11} /> Community chat</span><span>Enter to send</span></div></div>
          </aside>
        </div> : activeChannel === "lounge" ? <div className="content-view"><div className="eyebrow"><span className="eyebrow-dot" /> VOICE LOUNGE</div><h1>The chill zone</h1><p className="view-subtitle">Drop in, say hi, and hang out for a while.</p><div className="voice-room-card"><div className="voice-orb"><Waves size={36} /></div><h2>{joinedVoice ? "You're in the lounge" : "Good company, no agenda."}</h2><p>{joinedVoice ? "Voice connection is simulated in this UI preview." : "Join the room when you're ready."}</p><div className="voice-attendees">{members.slice(0,3).map(m => <div key={m.name}><Avatar initials={m.initials} color={m.color}/><span>{m.name}</span></div>)}</div><button className="primary-button" onClick={() => { setJoinedVoice(!joinedVoice); announce(joinedVoice ? "Left voice lounge." : "Demo: joined voice lounge. WebRTC is not connected yet."); }}>{joinedVoice ? <><X size={17}/> Leave lounge</> : <><Headphones size={17}/> Join voice lounge</>}</button></div></div> : activeChannel === "home" ? <div className="content-view"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR COMMUNITY</div><h1>Your people, <span>in sync.</span></h1><p className="view-subtitle">A little corner of the internet to call your own.</p><div className="overview-grid"><div className="overview-card"><Users/><strong>128</strong><span>Community members</span></div><div className="overview-card"><Activity/><strong>18</strong><span>Online right now</span></div><div className="overview-card"><Video/><strong>04</strong><span>Media shared</span></div></div><div className="section-heading"><h2>Jump back in</h2><span>YOUR SPACES</span></div><button className="jump-card" onClick={() => setActiveChannel("theater")}><div className="jump-icon"><Clapperboard/></div><div><strong>Friday night watch party</strong><span># movie-theater · 5 watching</span></div><ArrowUpRight/></button></div> : <div className="content-view"><div className="eyebrow"><span className="eyebrow-dot" /> TEXT CHANNEL</div><h1>#{activeChannel}</h1><p className="view-subtitle">A place for your community to connect.</p><div className="empty-channel"><div><MessageCircle size={30}/></div><h2>You're at the beginning.</h2><p>This is where the conversation starts. Send a message to say hello.</p><div className="simple-composer"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if(e.key === "Enter") sendMessage(); }} placeholder={`Message #${activeChannel}`} /><button className="send-button" onClick={sendMessage}><Send size={16}/></button></div>{messages.slice(-3).map(m => <div className="simple-message" key={m.id}><Avatar initials={m.initials} color={m.color} small/><div><strong>{m.name}</strong><span>{m.text}</span></div></div>)}</div></div>}
      </section>

      <aside className="members-sidebar">
        <div className="members-heading"><div><span className="online-pulse" /> <strong>PEOPLE HERE</strong></div><button className="icon-button" aria-label="Member options" onClick={() => announce("Member list options")}><MoreHorizontal size={18}/></button></div>
        <div className="members-summary"><div className="member-count"><Users size={16}/><span>128 members</span></div><div className="online-count"><i/> 18 online</div></div>
        <div className="members-section-title">ONLINE — {filteredMembers.length}</div>
        {filteredMembers.map((member) => <button className="member-row" key={member.name} onClick={() => announce(`Profile for ${member.name}`)}><span className="member-avatar-wrap"><Avatar initials={member.initials} color={member.color}/><i className="presence-dot"/></span><span className="member-copy"><span className="member-name">{member.name}{member.badge && <OwnerBadge type={member.badge}/>}</span><span className="member-status">{member.status}</span></span>{member.name === "noah.wav" && <Headphones size={14} className="member-activity"/>}</button>)}
        <div className="members-section-title offline-title">YOUR COMMUNITY</div>
        <div className="community-progress"><div className="progress-top"><span>Next milestone</span><span className="progress-level"><Check size={10}/> STONE</span></div><div className="progress-number"><strong>128</strong><span>/ 500 members</span></div><div className="progress-track"><i style={{width:"25.6%"}}/></div><p>Unlock custom banners &amp; extra emojis.</p><button onClick={() => announce("Member milestone progress is a demo. Real counts will be verified by the backend.")}>View all milestones <ArrowUpRight size={13}/></button></div>
        <div className="premium-card"><div className="premium-spark"><Sparkles size={16}/></div><span className="premium-overline">THE NEXT LEVEL</span><strong>Make it yours.</strong><p>More room for your community to feel like home.</p><button onClick={() => announce("Kinetiq perks will be announced soon.")}>Explore perks <ArrowUpRight size={13}/></button><div className="premium-orb orb-one"/><div className="premium-orb orb-two"/></div>
        <div className="privacy-note"><ShieldCheck size={15}/><span>Your space. Your rules.<br/><strong>Built for communities.</strong></span></div>
      </aside>

      {notice && <div className="toast"><Check size={16}/>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14}/></button></div>}
      {showRoles && <div className="modal-backdrop" onClick={() => setShowRoles(false)}><div className="modal-card roles-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowRoles(false)}><X size={18}/></button><div className="modal-icon"><ShieldCheck size={24}/></div><div className="eyebrow">COMMUNITY SETTINGS</div><h2>Manage roles</h2><p>Create labels for your community like Admin, Moderator, Creator, or Member. Roles are saved to your Kinetiq account when Supabase is connected.</p><form className="role-create-form" onSubmit={(e) => { e.preventDefault(); void createRole(); }}><label htmlFor="role-name">NEW ROLE NAME</label><input id="role-name" value={roleNameDraft} onChange={(e) => setRoleNameDraft(e.target.value)} placeholder="e.g. EVENT MANAGER" maxLength={32} required/><label htmlFor="role-color">ROLE COLOR</label><select id="role-color" value={roleColorDraft} onChange={(e) => setRoleColorDraft(e.target.value)}><option value="purple">Purple</option><option value="mint">Mint</option><option value="gold">Gold</option><option value="blue">Blue</option><option value="pink">Pink</option></select><button className="primary-button modal-primary" type="submit"><Plus size={16}/> Create role</button></form><div className="roles-list-heading"><strong>YOUR ROLES</strong><span>{roles.length} roles</span></div><div className="roles-list">{roles.map((role) => <div className="role-list-row" key={role.id || role.name}><span className={"role-color-dot role-" + role.color} /><strong>{role.name}</strong><span>{role.id ? "Saved" : "Preview"}</span></div>)}</div><div className="roles-footnote"><ShieldCheck size={14}/> Role creation is available now; role assignment and community-wide permissions are next.</div></div></div>}
      {showExplore && <div className="modal-backdrop" onClick={() => setShowExplore(false)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowExplore(false)}><X size={18}/></button><div className="modal-icon"><Compass size={24}/></div><div className="eyebrow">FIND YOUR PEOPLE</div><h2>Explore Kinetiq</h2><p>Discover communities built around the things you love. Public discovery will light up once accounts and the community directory are connected.</p><div className="explore-preview"><div className="explore-art explore-one">✦</div><div><strong>Creator spaces</strong><span>Make, share, watch together.</span></div><ArrowUpRight size={17}/></div><div className="explore-preview"><div className="explore-art explore-two">◈</div><div><strong>Late-night lounges</strong><span>Find a room and stay awhile.</span></div><ArrowUpRight size={17}/></div><button className="primary-button modal-primary" onClick={() => {setShowExplore(false); announce("Community discovery is on the roadmap.");}}>Sounds good <ArrowDown size={15}/></button></div></div>}
      {showUpload && <div className="modal-backdrop" onClick={() => setShowUpload(false)}><div className="modal-card upload-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowUpload(false)}><X size={18}/></button><div className="modal-icon"><ImagePlus size={24}/></div><div className="eyebrow">SHARE WITH YOUR PEOPLE</div><h2>Bring your own video</h2><p>Kinetiq is built for native MP4 and WebM uploads. This demo needs storage configured before it can accept real media.</p><div className="upload-drop"><Video size={25}/><strong>Drop a video here</strong><span>MP4 or WebM · Direct upload to your community storage</span><span className="upload-limit">Storage integration not connected</span></div><button className="primary-button modal-primary" onClick={() => setShowUpload(false)}>Got it <Check size={16}/></button></div></div>}
    </main>
  );
}


export default function HomePage() {
  return <KinetiqAuthGate><HomePageContent /></KinetiqAuthGate>;
}
