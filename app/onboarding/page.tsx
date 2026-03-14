"use client";
// @ts-nocheck
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Tokens ───────────────────────────────────────────────────────────────────
const t = {
  bg: "#0A0A0E",
  surface: "#13131A",
  surfaceRaised: "#1A1A24",
  surfaceHover: "#22222E",
  border: "#2A2A3A",
  borderStrong: "#3A3A50",
  text: "#F0F0F8",
  textSub: "#8888A8",
  textMuted: "#4A4A68",
  accent: "#6C5CE7",
  accentHover: "#7D6EF8",
  ai: "#A78BFA",
  success: "#00D68F",
  warning: "#FFB800",
};

const gs = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${t.bg}; color: ${t.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  ::selection { background: ${t.accent}40; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
  @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes gradientShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
  .fade-up { animation: fadeUp 0.5s ease-out forwards; }
  input, textarea, select {
    background: ${t.surfaceHover}; border: 1px solid ${t.border}; color: ${t.text};
    border-radius: 10px; padding: 12px 16px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; outline: none; transition: border-color 150ms, box-shadow 150ms; width: 100%;
  }
  input:focus, textarea:focus, select:focus {
    border-color: ${t.accent}; box-shadow: 0 0 0 3px ${t.accent}20;
  }
  input::placeholder, textarea::placeholder { color: ${t.textMuted}; }
  select option { background: ${t.surfaceRaised}; }
`;

// ─── Data ─────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Concert / Live Events", "Software / Tech", "Construction / Real Estate",
  "Marketing / Advertising", "Film / Video Production", "Healthcare",
  "Finance / Accounting", "Legal", "Education", "Retail / E-commerce",
  "Restaurant / Food & Beverage", "Manufacturing", "Consulting", "Other",
];

const ROLES = [
  "Founder / CEO", "Product Manager", "Engineer / Developer",
  "Designer / Creative Director", "Marketing Manager", "Project Manager",
  "Operations Manager", "Freelancer / Consultant", "Executive / Director", "Other",
];

const TEAM_SIZES = ["Just me", "2–5", "6–15", "16–50", "50+"];

const TOOLS = [
  "Slack", "Notion", "Google Workspace", "Trello", "Asana",
  "Jira", "GitHub", "Figma", "Zapier", "Monday.com",
];

const CONSTRAINTS = ["Time", "Budget", "Team size", "Technical complexity", "Market uncertainty"];

const MODES = [
  {
    id: "manual",
    icon: "🎮",
    title: "Manual",
    desc: "Full control. You manage everything. AI is available but never acts on its own.",
    color: t.textSub,
  },
  {
    id: "assisted",
    icon: "🤝",
    title: "Assisted",
    desc: "You drive. AI enriches cards and offers suggestions when you ask.",
    color: t.accent,
  },
  {
    id: "hybrid",
    icon: "⚡",
    title: "Hybrid",
    desc: "Describe an idea, AI generates cards and plans. You approve before anything executes.",
    color: t.ai,
  },
  {
    id: "autonomous",
    icon: "🤖",
    title: "Autonomous",
    desc: "AI handles execution end-to-end. Only interrupts you for approvals or access.",
    color: t.success,
  },
  {
    id: "custom",
    icon: "⚙️",
    title: "Custom",
    desc: "Configure each agent individually. Set autonomy levels per agent and project type.",
    color: t.warning,
  },
];

const APPROVAL_OPTIONS = [
  "Budget decisions", "Client communications", "Code deployments",
  "Content publishing", "Vendor contracts", "Hiring decisions",
  "Architecture changes", "External API access",
];

// ─── Subcomponents ────────────────────────────────────────────────────────────
function SparkleIcon({ size = 16, color = t.ai }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill={color} />
    </svg>
  );
}

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: i < current ? 24 : i === current ? 24 : 8,
            height: 8, borderRadius: 4,
            background: i < current ? t.success : i === current ? t.accent : t.border,
            transition: "all 300ms ease-out",
          }} />
        </div>
      ))}
      <span style={{ fontSize: 12, color: t.textSub, marginLeft: 4 }}>{current + 1} of {total}</span>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>{children}</div>;
}

function ToggleChip({ label, selected, onClick, color = t.accent }) {
  return (
    <div onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer",
      background: selected ? color + "20" : t.surfaceHover,
      border: `1px solid ${selected ? color : t.border}`,
      color: selected ? color : t.textSub,
      transition: "all 120ms",
      userSelect: "none",
    }}>
      {label}
    </div>
  );
}

function ModeCard({ mode, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: 16, borderRadius: 12, cursor: "pointer",
      background: selected ? mode.color + "12" : t.surfaceRaised,
      border: `1px solid ${selected ? mode.color : t.border}`,
      transition: "all 150ms",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{mode.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: selected ? mode.color : t.text, marginBottom: 4 }}>{mode.title}</div>
        <div style={{ fontSize: 12, color: t.textSub, lineHeight: 1.6 }}>{mode.desc}</div>
      </div>
      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? mode.color : t.border}`, background: selected ? mode.color : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms" }}>
        {selected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{ padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${t.accent}, ${t.ai})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SparkleIcon size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>theAnswerAI</span>
          <span style={{ fontSize: 11, color: t.textMuted, background: t.surfaceRaised, padding: "2px 8px", borderRadius: 4, border: `1px solid ${t.border}` }}>Kanban</span>
        </div>
        <button onClick={onStart} style={{ background: t.accent, color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Get started →
        </button>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", animation: "fadeUp 0.6s ease-out" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: t.ai + "15", border: `1px solid ${t.ai}30`, borderRadius: 20, padding: "6px 14px", marginBottom: 32 }}>
          <SparkleIcon size={12} color={t.ai} />
          <span style={{ fontSize: 12, color: t.ai, fontWeight: 600 }}>AI-Native Project Management</span>
        </div>

        <h1 style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24, maxWidth: 800 }}>
          The board that{" "}
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", background: `linear-gradient(135deg, ${t.accent}, ${t.ai})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            runs itself.
          </span>
        </h1>

        <p style={{ fontSize: 18, color: t.textSub, lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
          Describe your idea. A team of AI agents breaks it into tasks, assigns work, executes autonomously, and only asks when they need you.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 64 }}>
          <button onClick={onStart} style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.ai})`, color: "#fff", border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em" }}>
            Set up your AI agency →
          </button>
          <a href="/dashboard" style={{ background: t.surfaceRaised, color: t.textSub, border: `1px solid ${t.border}`, padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "none", display: "flex", alignItems: "center" }}>
            Go to board
          </a>
        </div>

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 860, width: "100%" }}>
          {[
            { icon: "🧠", title: "Intake Agent", desc: "Describe any idea. AI generates a full project plan with cards assigned to the right agents." },
            { icon: "⚡", title: "5 Operating Modes", desc: "From fully manual to fully autonomous. Switch modes per project or per agent." },
            { icon: "🤖", title: "Specialist Agents", desc: "Dev, Design, Marketing, Ops, and Research agents work your board autonomously." },
            { icon: "💬", title: "Agent Inbox", desc: "Agents message you when they need approval, access, or a decision. One-click response." },
            { icon: "✦", title: "Domain Intelligence", desc: "AI detects your industry and responds as a 10-year expert in that domain." },
            { icon: "📊", title: "Live Analytics", desc: "Sprint summaries, velocity tracking, and workload distribution updated in real time." },
          ].map(f => (
            <div key={f.title} style={{ background: t.surfaceRaised, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, textAlign: "left" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Steps ─────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "identity",
    title: "Let's get to know you",
    subtitle: "This helps your AI agents understand who they're working for.",
    icon: "👋",
  },
  {
    id: "work",
    title: "How do you work?",
    subtitle: "Your AI team will adapt to your workflow, not the other way around.",
    icon: "⚙️",
  },
  {
    id: "project",
    title: "What are you building?",
    subtitle: "Give your agents context on your current focus and goals.",
    icon: "🎯",
  },
  {
    id: "ai",
    title: "Configure your AI agency",
    subtitle: "Set how much autonomy your agents have and what always needs your approval.",
    icon: "🤖",
  },
];

export default function Page() {
  const router = useRouter();
  const [screen, setScreen] = useState("landing"); // landing | onboarding | generating
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    industry: "",
    role: "",
    company: "",
    team_size: "",
    tools: [],
    pain_point: "",
    current_focus: "",
    success_metric: "",
    constraint_type: "",
    preferred_mode: "assisted",
    approval_required: [],
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleArray = (key, val) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(x => x !== val) : [...prev[key], val],
    }));
  };

  const canAdvance = () => {
    if (step === 0) return form.name && form.industry && form.role;
    if (step === 1) return form.team_size;
    if (step === 2) return form.current_focus;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);

const { error } = await supabase.from("user_context").insert({
      name: form.name,
      industry: form.industry,
      role: form.role,
      company: form.company,
      team_size: form.team_size,
      tools: form.tools,
      pain_point: form.pain_point,
      current_focus: form.current_focus,
      success_metric: form.success_metric,
      constraint_type: form.constraint_type,
      preferred_mode: form.preferred_mode,
      approval_required: form.approval_required,
    });

    if (error) {
      console.error("Insert failed:", error.message);
      alert("Setup failed: " + error.message);
      setSaving(false);
      return;
    }

    setScreen("generating");
    await new Promise(r => setTimeout(r, 2800));
    router.push("/dashboard");
  };

  if (screen === "generating") {
    return (
      <>
        <style>{gs}</style>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${t.accent}, ${t.ai})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SparkleIcon size={28} color="#fff" />
            </div>
            <div style={{ position: "absolute", inset: -8, borderRadius: 26, border: `2px solid ${t.accent}`, animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Configuring your AI agency...</h2>
            <p style={{ color: t.textSub, fontSize: 14 }}>Calibrating agents to your industry and workflow</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 320 }}>
            {[
              { label: "Intake Agent", delay: "0s" },
              { label: "Dev Agent", delay: "0.3s" },
              { label: "Design Agent", delay: "0.6s" },
              { label: "Marketing Agent", delay: "0.9s" },
              { label: "Ops Agent", delay: "1.2s" },
              { label: "Research Agent", delay: "1.5s" },
            ].map(agent => (
              <div key={agent.label} style={{ display: "flex", alignItems: "center", gap: 10, animation: `fadeUp 0.4s ease-out ${agent.delay} forwards`, opacity: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.success, animation: "pulse 1.5s ease-in-out infinite" }} />
                <span style={{ fontSize: 13, color: t.textSub }}>{agent.label} initialized</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: t.success }}>✓</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (screen === "landing") {
    return (
      <>
        <style>{gs}</style>
        <LandingPage onStart={() => setScreen("onboarding")} />
      </>
    );
  }

  // ── Onboarding ──────────────────────────────────────────────────────────────
  const currentStep = STEPS[step];

  return (
    <>
      <style>{gs}</style>
      <div style={{ minHeight: "100vh", display: "flex" }}>

        {/* Left panel */}
        <div style={{ width: 320, background: t.surface, borderRight: `1px solid ${t.border}`, padding: 40, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${t.accent}, ${t.ai})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SparkleIcon size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>theAnswerAI</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>Setup Progress</div>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: "flex", gap: 14, marginBottom: 24, opacity: i > step ? 0.4 : 1, transition: "opacity 200ms" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < step ? t.success : i === step ? t.accent : t.surfaceRaised, border: `2px solid ${i < step ? t.success : i === step ? t.accent : t.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "all 200ms", flexShrink: 0 }}>
                    {i < step ? "✓" : s.icon}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ width: 2, height: 24, background: i < step ? t.success : t.border, marginTop: 4, transition: "background 200ms" }} />}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: i === step ? t.text : t.textSub }}>{s.title}</div>
                  {i === step && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Current step</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: t.ai + "12", border: `1px solid ${t.ai}25`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <SparkleIcon size={12} color={t.ai} />
              <span style={{ fontSize: 11, fontWeight: 600, color: t.ai }}>Why we ask</span>
            </div>
            <p style={{ fontSize: 12, color: t.textSub, lineHeight: 1.6 }}>Every answer shapes how your AI agents communicate, plan, and execute. The more context they have, the better their work.</p>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
          <div style={{ flex: 1, padding: "48px 56px", maxWidth: 680 }}>
            <StepIndicator current={step} total={STEPS.length} />

            <div style={{ marginTop: 32, marginBottom: 40, animation: "fadeUp 0.4s ease-out" }} key={step}>
              <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>{currentStep.title}</h2>
              <p style={{ fontSize: 15, color: t.textSub, lineHeight: 1.6 }}>{currentStep.subtitle}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.5s ease-out" }} key={`fields-${step}`}>

              {/* Step 0 — Identity */}
              {step === 0 && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <Label>Your name *</Label>
                      <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Aaron" />
                    </div>
                    <div>
                      <Label>Company / Project</Label>
                      <input value={form.company} onChange={e => update("company", e.target.value)} placeholder="theAnswerAI" />
                    </div>
                  </div>
                  <div>
                    <Label>Industry *</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {INDUSTRIES.map(ind => (
                        <ToggleChip key={ind} label={ind} selected={form.industry === ind} onClick={() => update("industry", ind)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Your role *</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {ROLES.map(r => (
                        <ToggleChip key={r} label={r} selected={form.role === r} onClick={() => update("role", r)} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 1 — Work style */}
              {step === 1 && (
                <>
                  <div>
                    <Label>Team size *</Label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {TEAM_SIZES.map(s => (
                        <ToggleChip key={s} label={s} selected={form.team_size === s} onClick={() => update("team_size", s)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Tools you currently use</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {TOOLS.map(tool => (
                        <ToggleChip key={tool} label={tool} selected={form.tools.includes(tool)} onClick={() => toggleArray("tools", tool)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Biggest project management pain point</Label>
                    <textarea value={form.pain_point} onChange={e => update("pain_point", e.target.value)} placeholder="e.g. Too much time spent on coordination instead of actual work..." rows={3} style={{ resize: "vertical" }} />
                  </div>
                </>
              )}

              {/* Step 2 — Project focus */}
              {step === 2 && (
                <>
                  <div>
                    <Label>What are you currently building or working on? *</Label>
                    <textarea value={form.current_focus} onChange={e => update("current_focus", e.target.value)} placeholder="e.g. Launching an AI-powered project management platform for creative agencies..." rows={3} style={{ resize: "vertical" }} />
                  </div>
                  <div>
                    <Label>What does success look like in 90 days?</Label>
                    <textarea value={form.success_metric} onChange={e => update("success_metric", e.target.value)} placeholder="e.g. 10 paying clients, product live, first $10k MRR..." rows={2} style={{ resize: "vertical" }} />
                  </div>
                  <div>
                    <Label>Biggest constraint right now</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {CONSTRAINTS.map(c => (
                        <ToggleChip key={c} label={c} selected={form.constraint_type === c} onClick={() => update("constraint_type", c)} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 3 — AI config */}
              {step === 3 && (
                <>
                  <div>
                    <Label>Default operating mode</Label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {MODES.map(mode => (
                        <ModeCard key={mode.id} mode={mode} selected={form.preferred_mode === mode.id} onClick={() => update("preferred_mode", mode.id)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Always require my approval for</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {APPROVAL_OPTIONS.map(opt => (
                        <ToggleChip key={opt} label={opt} selected={form.approval_required.includes(opt)} onClick={() => toggleArray("approval_required", opt)} color={t.warning} />
                      ))}
                    </div>
                  </div>

                  {/* Summary card */}
                  <div style={{ background: t.ai + "10", border: `1px solid ${t.ai}25`, borderRadius: 12, padding: 20, marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                      <SparkleIcon size={13} color={t.ai} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.ai, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Agency Profile</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Name", value: form.name || "—" },
                        { label: "Industry", value: form.industry || "—" },
                        { label: "Role", value: form.role || "—" },
                        { label: "Team", value: form.team_size || "—" },
                        { label: "Mode", value: MODES.find(m => m.id === form.preferred_mode)?.title || "—" },
                        { label: "Focus", value: form.current_focus ? form.current_focus.slice(0, 40) + "..." : "—" },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{item.label}</div>
                          <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer nav */}
          <div style={{ padding: "24px 56px", borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: t.surface }}>
            <button onClick={() => step > 0 ? setStep(s => s - 1) : setScreen("landing")}
              style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textSub, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 120ms" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.borderStrong; e.currentTarget.style.color = t.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub; }}>
              ← Back
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {step < STEPS.length - 1 && (
                <button onClick={() => update("", "")} style={{ background: "transparent", border: "none", color: t.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Skip
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
                  style={{ background: canAdvance() ? t.accent : t.surfaceRaised, color: canAdvance() ? "#fff" : t.textMuted, border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canAdvance() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", transition: "all 150ms" }}>
                  Continue →
                </button>
              ) : (
                <button onClick={handleFinish} disabled={saving}
                  style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.ai})`, color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                  {saving ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span> : <SparkleIcon size={13} color="#fff" />}
                  Launch my AI agency →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
