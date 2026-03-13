"use client";
// @ts-nocheck

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const tokens = {
  bg: "#0E0E11",
  surface: "#16161A",
  surfaceRaised: "#1C1C22",
  surfaceHover: "#22222A",
  border: "#2A2A35",
  borderStrong: "#3A3A48",
  textPrimary: "#F0F0F5",
  textSecondary: "#9090A8",
  textTertiary: "#5A5A70",
  accent: "#6C5CE7",
  accentHover: "#7D6EF5",
  accentSubtle: "#6C5CE715",
  ai: "#A78BFA",
  aiSubtle: "#A78BFA12",
  success: "#00D68F",
  warning: "#FFB800",
  error: "#FF5C5C",
  priorityUrgent: "#FF5C5C",
  priorityHigh: "#FFB800",
  priorityMedium: "#6C5CE7",
  priorityLow: "#00D68F",
};

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_BOARDS = [
  {
    id: "board-1",
    title: "Product Launch",
    color: "#6C5CE7",
    lists: [
      {
        id: "list-1",
        title: "Backlog",
        cards: [
          { id: "c1", title: "Design onboarding flow", priority: "high", assignee: "AR", labels: ["Design"], due: "Mar 20", estimatedHours: 4, aiEnriched: true, aiDescription: "Create a seamless 2-step onboarding that delivers value before the user reaches their first board. Focus on reducing time-to-first-AI-action.", subtasks: ["Sketch user flow", "Design step 1 screen", "Design step 2 screen", "Add progress indicator"] },
          { id: "c2", title: "Write API documentation", priority: "medium", assignee: "JL", labels: ["Docs"], due: "Mar 25", estimatedHours: 3, aiEnriched: false, aiDescription: "", subtasks: [] },
          { id: "c3", title: "SEO keyword research", priority: "low", assignee: "TK", labels: ["Marketing"], due: "Mar 28", estimatedHours: 2, aiEnriched: true, aiDescription: "Identify high-intent keywords in the project management space, focusing on 'Trello alternative' and 'AI kanban' clusters.", subtasks: ["Competitor analysis", "Keyword gap analysis", "Content calendar draft"] },
        ]
      },
      {
        id: "list-2",
        title: "In Progress",
        cards: [
          { id: "c4", title: "Build AI card enrichment", priority: "urgent", assignee: "AR", labels: ["Engineering", "AI"], due: "Mar 15", estimatedHours: 8, aiEnriched: true, aiDescription: "Implement async Claude API integration for card enrichment. Must not block the UI. Return description, subtasks, priority, and time estimate.", subtasks: ["Claude API client", "Queue system", "JSON validation", "Error fallbacks", "UI loading states"] },
          { id: "c5", title: "Stripe billing integration", priority: "high", assignee: "JL", labels: ["Engineering"], due: "Mar 18", estimatedHours: 6, aiEnriched: false, aiDescription: "", subtasks: [] },
        ]
      },
      {
        id: "list-3",
        title: "Review",
        cards: [
          { id: "c6", title: "Landing page copy", priority: "medium", assignee: "TK", labels: ["Marketing", "Design"], due: "Mar 14", estimatedHours: 3, aiEnriched: true, aiDescription: "Craft conversion-focused copy that leads with the 'board that runs itself' positioning. Hero, features, social proof, and pricing sections.", subtasks: ["Hero headline variants", "Feature descriptions", "CTA optimization"] },
        ]
      },
      {
        id: "list-4",
        title: "Done",
        cards: [
          { id: "c7", title: "Database schema design", priority: "high", assignee: "AR", labels: ["Engineering"], due: "Mar 10", estimatedHours: 5, aiEnriched: true, aiDescription: "Design PostgreSQL schema with fractional indexing for card positions, supporting real-time collaboration without conflicts.", subtasks: ["ERD diagram", "Write migrations", "Add indexes", "Performance test"] },
          { id: "c8", title: "Brand identity system", priority: "medium", assignee: "TK", labels: ["Design"], due: "Mar 8", estimatedHours: 12, aiEnriched: false, aiDescription: "", subtasks: [] },
        ]
      }
    ]
  },
  {
    id: "board-2",
    title: "Marketing Sprint",
    color: "#00D68F",
    lists: [
      { id: "list-5", title: "Ideas", cards: [{ id: "c9", title: "Product Hunt launch prep", priority: "high", assignee: "TK", labels: ["Marketing"], due: "Apr 1", estimatedHours: 6, aiEnriched: false, aiDescription: "", subtasks: [] }] },
      { id: "list-6", title: "Doing", cards: [] },
      { id: "list-7", title: "Done", cards: [] }
    ]
  }
];

const MEMBERS = [
  { id: "AR", name: "Aaron R.", color: "#6C5CE7" },
  { id: "JL", name: "Jordan L.", color: "#00D68F" },
  { id: "TK", name: "Taylor K.", color: "#FFB800" },
];

const AI_ENRICHMENTS = [
  { description: "Implement a comprehensive solution with clear acceptance criteria and automated testing. Break work into focused subtasks for better tracking and velocity.", subtasks: ["Research and planning", "Core implementation", "Testing and validation", "Documentation update"], priority: "medium", estimatedHours: 4 },
  { description: "Design and build this feature following established patterns in the codebase. Ensure mobile responsiveness and accessibility compliance from the start.", subtasks: ["Wireframe and spec", "Component architecture", "Build and integrate", "QA and polish"], priority: "high", estimatedHours: 6 },
  { description: "Analyze requirements thoroughly before implementation. This task has dependencies that should be identified and tracked explicitly in related cards.", subtasks: ["Dependency mapping", "Technical spec", "Implementation", "Integration testing"], priority: "medium", estimatedHours: 3 },
  { description: "Execute with a focus on performance and scalability. Consider edge cases carefully and document decisions in the card description for future reference.", subtasks: ["Performance baseline", "Implementation", "Load testing", "Monitoring setup"], priority: "high", estimatedHours: 8 },
];

// ─── Utility ─────────────────────────────────────────────────────────────────
function getPriorityColor(p: string) {
  const map: Record<string, string> = { urgent: tokens.priorityUrgent, high: tokens.priorityHigh, medium: tokens.priorityMedium, low: tokens.priorityLow };
  return map[p] || tokens.priorityMedium;
}

function getLabelColor(label: string) {
  // We define the type as Record<string, string> to allow any string to be used as a key
  const map: Record<string, string> = { 
    Design: "#A78BFA", 
    Engineering: "#6C5CE7", 
    AI: "#00D68F", 
    Marketing: "#FFB800", 
    Docs: "#FF5C5C" 
  };
  return map[label] || "#6C5CE7";
}

function Avatar({ id, size = 24 }: { id: string; size?: number }) {
  const member = MEMBERS.find(m => m.id === id) || MEMBERS[0];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: member.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
      {id[0]}
    </div>
  );
}

function SparkleIcon({ size = 14, color = tokens.ai }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 1L8.2 5.8L13 7L8.2 8.2L7 13L5.8 8.2L1 7L5.8 5.8L7 1Z" fill={color} />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  body { background: ${tokens.bg}; color: ${tokens.textPrimary}; font-family: 'DM Sans', sans-serif; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${tokens.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${tokens.borderStrong}; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes aiPulse { 0%,100% { box-shadow: 0 0 0 1px ${tokens.ai}40; } 50% { box-shadow: 0 0 0 2px ${tokens.ai}80; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes sparkle { 0%,100% { opacity:0; transform: scale(0.5); } 50% { opacity:1; transform: scale(1); } }
  @keyframes popIn { 0% { opacity:0; transform: scale(0.9); } 100% { opacity:1; transform: scale(1); } }
  @keyframes notifSlide { from { opacity:0; transform: translateX(24px); } to { opacity:1; transform: translateX(0); } }

  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .card-hover { transition: transform 120ms ease-out, box-shadow 120ms ease-out; }
  
  .btn-primary { background: ${tokens.accent}; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 100ms, transform 80ms; }
  .btn-primary:hover { background: ${tokens.accentHover}; }
  .btn-primary:active { transform: scale(0.97); }
  
  .btn-ghost { background: transparent; color: ${tokens.textSecondary}; border: 1px solid ${tokens.border}; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 100ms; }
  .btn-ghost:hover { background: ${tokens.surfaceHover}; color: ${tokens.textPrimary}; border-color: ${tokens.borderStrong}; }

  input, textarea { background: ${tokens.surfaceHover}; border: 1px solid ${tokens.border}; color: ${tokens.textPrimary}; border-radius: 8px; padding: 8px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 100ms; width: 100%; }
  input:focus, textarea:focus { border-color: ${tokens.accent}; }
  input::placeholder, textarea::placeholder { color: ${tokens.textTertiary}; }
`;

// ─── Components ───────────────────────────────────────────────────────────────

function Notification({ notifs, onDismiss }) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {notifs.map(n => (
        <div key={n.id} onClick={() => onDismiss(n.id)} style={{ background: tokens.surfaceRaised, border: `1px solid ${tokens.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", animation: "notifSlide 200ms ease-out", minWidth: 280, maxWidth: 340 }}>
          <SparkleIcon size={14} color={n.type === "ai" ? tokens.ai : tokens.accent} />
          <span style={{ fontSize: 13, color: tokens.textPrimary, flex: 1 }}>{n.message}</span>
          <span style={{ fontSize: 11, color: tokens.textTertiary }}>✕</span>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ boards, activeBoardId, setActiveBoardId, onCreateBoard }) {
  return (
    <div style={{ width: 220, background: tokens.surface, borderRight: `1px solid ${tokens.border}`, display: "flex", flexDirection: "column", flexShrink: 0, padding: "16px 0" }}>
      <div style={{ padding: "0 16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${tokens.accent}, ${tokens.ai})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SparkleIcon size={13} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>theAnswerAI</div>
            <div style={{ fontSize: 10, color: tokens.textTertiary }}>Kanban</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 8px", flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: tokens.textTertiary, padding: "0 8px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Boards</div>
        {boards.map(b => (
          <div key={b.id} onClick={() => setActiveBoardId(b.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: activeBoardId === b.id ? tokens.surfaceHover : "transparent", marginBottom: 2, transition: "background 100ms" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: activeBoardId === b.id ? tokens.textPrimary : tokens.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</span>
          </div>
        ))}
        <div onClick={onCreateBoard} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", color: tokens.textTertiary, transition: "all 100ms", marginTop: 4 }}
          onMouseEnter={e => { e.currentTarget.style.color = tokens.textSecondary; e.currentTarget.style.background = tokens.surfaceHover; }}
          onMouseLeave={e => { e.currentTarget.style.color = tokens.textTertiary; e.currentTarget.style.background = "transparent"; }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 13 }}>New board</span>
        </div>
      </div>

      <div style={{ padding: "16px", borderTop: `1px solid ${tokens.border}`, marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar id="AR" size={28} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Aaron R.</div>
            <div style={{ fontSize: 10, color: tokens.textTertiary }}>Pro plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardComponent({ card, listId, onCardClick, onDragStart, onDragEnd, isDragging }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id, listId)}
      onDragEnd={onDragEnd}
      onClick={() => onCardClick(card)}
      className="card-hover"
      style={{
        background: isDragging ? tokens.surfaceRaised : tokens.surfaceRaised,
        border: `1px solid ${card.aiEnriched ? tokens.ai + "30" : tokens.border}`,
        borderRadius: 10,
        padding: "12px",
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        animation: "fadeIn 150ms ease-out",
        position: "relative",
        ...(card.aiEnriched ? { animation: "fadeIn 150ms ease-out" } : {})
      }}
    >
      {card.aiEnriched && (
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <SparkleIcon size={11} color={tokens.ai} />
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: "1.5", marginBottom: 10, paddingRight: card.aiEnriched ? 16 : 0, color: tokens.textPrimary }}>{card.title}</div>

      {card.labels.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {card.labels.map(l => (
            <span key={l} style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: getLabelColor(l) + "20", color: getLabelColor(l), letterSpacing: "0.02em" }}>{l}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: getPriorityColor(card.priority), flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: tokens.textTertiary }}>{card.priority}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {card.due && <span style={{ fontSize: 11, color: tokens.textTertiary }}>📅 {card.due}</span>}
          {card.estimatedHours > 0 && <span style={{ fontSize: 11, color: tokens.textTertiary }}>{card.estimatedHours}h</span>}
          {card.assignee && <Avatar id={card.assignee} size={20} />}
        </div>
      </div>

      {card.subtasks?.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${tokens.border}` }}>
          <div style={{ fontSize: 11, color: tokens.textTertiary }}>
            {card.subtasks.filter((_, i) => i < 1).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: tokens.textTertiary }}>○</span> {s}
              </div>
            ))}
            {card.subtasks.length > 1 && <span style={{ color: tokens.textTertiary }}>+{card.subtasks.length - 1} more</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function List({ list, onCardClick, onAddCard, onDragStart, onDragEnd, onDrop, dragOverListId, draggingCardId }) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  const handleAdd = () => {
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle("");
      setAddingCard(false);
    }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => onDrop(e, list.id)}
      style={{
        width: 280,
        flexShrink: 0,
        background: dragOverListId === list.id ? tokens.surface + "CC" : tokens.surface,
        border: `1px solid ${dragOverListId === list.id ? tokens.accent + "60" : tokens.border}`,
        borderRadius: 12,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxHeight: "calc(100vh - 120px)",
        transition: "border-color 120ms, background 120ms",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>{list.title}</span>
          <span style={{ fontSize: 11, background: tokens.surfaceHover, color: tokens.textTertiary, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{list.cards.length}</span>
        </div>
        <button onClick={() => setAddingCard(true)} style={{ background: "none", border: "none", color: tokens.textTertiary, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}
          onMouseEnter={e => e.currentTarget.style.color = tokens.textPrimary}
          onMouseLeave={e => e.currentTarget.style.color = tokens.textTertiary}>+</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", flex: 1 }}>
        {list.cards.map(card => (
          <CardComponent key={card.id} card={card} listId={list.id} onCardClick={onCardClick} onDragStart={onDragStart} onDragEnd={onDragEnd} isDragging={draggingCardId === card.id} />
        ))}
      </div>

      {addingCard ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "fadeIn 150ms ease-out" }}>
          <textarea value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} placeholder="Card title..." rows={2} style={{ resize: "none", fontSize: 13 }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } if (e.key === "Escape") setAddingCard(false); }} autoFocus />
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-primary" onClick={handleAdd} style={{ flex: 1, fontSize: 12, padding: "6px 12px" }}>Add card</button>
            <button className="btn-ghost" onClick={() => setAddingCard(false)} style={{ padding: "6px 10px", fontSize: 12 }}>✕</button>
          </div>
        </div>
      ) : (
        <div onClick={() => setAddingCard(true)} style={{ padding: "6px 8px", borderRadius: 8, color: tokens.textTertiary, fontSize: 12, cursor: "pointer", transition: "all 100ms", display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.background = tokens.surfaceHover; e.currentTarget.style.color = tokens.textSecondary; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = tokens.textTertiary; }}>
          <span>+</span> Add card
        </div>
      )}
    </div>
  );
}

function CardPanel({ card, listTitle, onClose, onUpdate, onEnrichAI, enriching }) {
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description || "");

  useEffect(() => { setEditTitle(card.title); setEditDesc(card.description || ""); }, [card.id]);

  const save = () => onUpdate(card.id, { title: editTitle, description: editDesc });

  return (
    <div style={{ width: 400, background: tokens.surface, borderLeft: `1px solid ${tokens.border}`, display: "flex", flexDirection: "column", animation: "slideInRight 200ms ease-out", flexShrink: 0, overflowY: "auto" }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${tokens.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: tokens.textTertiary, marginBottom: 6, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>In · {listTitle}</div>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={save} style={{ fontSize: 15, fontWeight: 600, padding: "4px 8px", background: "transparent", border: "1px solid transparent", transition: "border-color 100ms" }}
            onFocus={e => e.currentTarget.style.borderColor = tokens.border}
            onBlur={e => { e.currentTarget.style.borderColor = "transparent"; save(); }} />
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: tokens.textTertiary, cursor: "pointer", fontSize: 18, padding: "4px", marginTop: 18 }}
          onMouseEnter={e => e.currentTarget.style.color = tokens.textPrimary}
          onMouseLeave={e => e.currentTarget.style.color = tokens.textTertiary}>✕</button>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        {/* Meta row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Priority</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: tokens.surfaceHover, padding: "4px 10px", borderRadius: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: getPriorityColor(card.priority) }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: tokens.textPrimary }}>{card.priority}</span>
            </div>
          </div>
          {card.due && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Due</span>
              <div style={{ background: tokens.surfaceHover, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>📅 {card.due}</div>
            </div>
          )}
          {card.estimatedHours > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Estimate</span>
              <div style={{ background: tokens.surfaceHover, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>⏱ {card.estimatedHours}h</div>
            </div>
          )}
        </div>

        {/* Assignee */}
        <div>
          <div style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Assignee</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MEMBERS.map(m => (
              <div key={m.id} onClick={() => onUpdate(card.id, { assignee: m.id })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: card.assignee === m.id ? tokens.accent + "30" : tokens.surfaceHover, border: `1px solid ${card.assignee === m.id ? tokens.accent : "transparent"}`, cursor: "pointer", transition: "all 100ms" }}>
                <Avatar id={m.id} size={18} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Labels */}
        {card.labels.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Labels</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {card.labels.map(l => (
                <span key={l} style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: getLabelColor(l) + "20", color: getLabelColor(l) }}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Description */}
        <div style={{ background: card.aiEnriched ? tokens.aiSubtle : tokens.surfaceHover, border: `1px solid ${card.aiEnriched ? tokens.ai + "30" : tokens.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <SparkleIcon size={12} color={card.aiEnriched ? tokens.ai : tokens.textTertiary} />
              <span style={{ fontSize: 11, fontWeight: 600, color: card.aiEnriched ? tokens.ai : tokens.textTertiary, letterSpacing: "0.04em" }}>AI Description</span>
            </div>
            <button onClick={() => onEnrichAI(card.id)} disabled={enriching} className="btn-ghost" style={{ fontSize: 11, padding: "3px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              {enriching ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span> : <SparkleIcon size={10} color={tokens.ai} />}
              {enriching ? "Enriching..." : card.aiEnriched ? "Refresh" : "Enrich"}
            </button>
          </div>
          {card.aiEnriched && card.aiDescription ? (
            <p style={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 1.6 }}>{card.aiDescription}</p>
          ) : (
            <p style={{ fontSize: 13, color: tokens.textTertiary, fontStyle: "italic" }}>Click "Enrich" to let AI generate a description, subtasks, and time estimate for this card.</p>
          )}
        </div>

        {/* Subtasks */}
        {card.subtasks?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <SparkleIcon size={10} color={tokens.ai} /> AI Subtasks
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {card.subtasks.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: tokens.surfaceHover, borderRadius: 8 }}>
                  <div style={{ width: 14, height: 14, border: `1.5px solid ${tokens.borderStrong}`, borderRadius: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <div style={{ fontSize: 10, color: tokens.textTertiary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Notes</div>
          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} onBlur={save} placeholder="Add notes..." rows={3} style={{ resize: "vertical", fontSize: 13, lineHeight: 1.6 }} />
        </div>
      </div>
    </div>
  );
}

function AnalyticsDashboard({ board }) {
  const allCards = board.lists.flatMap(l => l.cards);
  const done = board.lists.find(l => l.title === "Done")?.cards.length || 0;
  const inProgress = board.lists.find(l => l.title === "In Progress")?.cards.length || 0;
  const total = allCards.length;
  const aiEnriched = allCards.filter(c => c.aiEnriched).length;
  const velocity = Math.round((done / Math.max(total, 1)) * 100);

  const priorityCounts = ["urgent", "high", "medium", "low"].map(p => ({ p, count: allCards.filter(c => c.priority === p).length }));
  const memberCounts = MEMBERS.map(m => ({ m, count: allCards.filter(c => c.assignee === m.id).length }));

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 200ms ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Board Analytics</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: tokens.aiSubtle, border: `1px solid ${tokens.ai}30`, borderRadius: 6, padding: "3px 10px" }}>
          <SparkleIcon size={11} color={tokens.ai} />
          <span style={{ fontSize: 11, color: tokens.ai, fontWeight: 600 }}>AI Insights</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Cards", value: total, color: tokens.accent },
          { label: "Completed", value: done, color: tokens.success },
          { label: "In Progress", value: inProgress, color: tokens.warning },
          { label: "AI Enriched", value: `${aiEnriched}/${total}`, color: tokens.ai },
        ].map(stat => (
          <div key={stat.label} style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: tokens.textTertiary, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14, color: tokens.textSecondary }}>Sprint Velocity</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80, marginBottom: 8 }}>
            {[40, 65, 55, 75, 80, velocity].map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${v}%`, background: i === 5 ? tokens.accent : tokens.accentSubtle, borderRadius: "4px 4px 0 0", transition: "height 300ms ease-out" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {["W1", "W2", "W3", "W4", "W5", "Now"].map(w => (
              <span key={w} style={{ fontSize: 10, color: tokens.textTertiary }}>{w}</span>
            ))}
          </div>
        </div>

        <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14, color: tokens.textSecondary }}>Priority Distribution</div>
          {priorityCounts.map(({ p, count }) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: getPriorityColor(p), flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: tokens.textSecondary, width: 60 }}>{p}</span>
              <div style={{ flex: 1, height: 6, background: tokens.surfaceHover, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(count / Math.max(total, 1)) * 100}%`, height: "100%", background: getPriorityColor(p), borderRadius: 3, transition: "width 400ms ease-out" }} />
              </div>
              <span style={{ fontSize: 12, color: tokens.textTertiary, width: 16, textAlign: "right" }}>{count}</span>
            </div>
          ))}
        </div>

        <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14, color: tokens.textSecondary }}>Team Workload</div>
          {memberCounts.map(({ m, count }) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Avatar id={m.id} size={22} />
              <span style={{ fontSize: 12, color: tokens.textSecondary, flex: 1 }}>{m.name}</span>
              <div style={{ width: 80, height: 6, background: tokens.surfaceHover, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(count / Math.max(total, 1)) * 100}%`, height: "100%", background: m.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, color: tokens.textTertiary, width: 20, textAlign: "right" }}>{count}</span>
            </div>
          ))}
        </div>

        <div style={{ background: tokens.aiSubtle, border: `1px solid ${tokens.ai}30`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <SparkleIcon size={13} color={tokens.ai} />
            <span style={{ fontSize: 12, fontWeight: 600, color: tokens.ai }}>AI Sprint Summary</span>
          </div>
          <p style={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 1.7 }}>
            <strong style={{ color: tokens.textPrimary }}>Strong momentum this sprint.</strong> {done} tasks completed, with engineering velocity trending up. The AI enrichment pipeline shipped on time.
          </p>
          <p style={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 1.7, marginTop: 8 }}>
            <strong style={{ color: tokens.warning }}>Watch:</strong> {inProgress} cards still in progress with deadlines approaching. Recommend unblocking the billing integration first.
          </p>
          <p style={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 1.7, marginTop: 8 }}>
            <strong style={{ color: tokens.textPrimary }}>Next sprint focus:</strong> Documentation and launch prep. Start Product Hunt assets early.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [boards, setBoards] = useState(INITIAL_BOARDS);
  const [activeBoardId, setActiveBoardId] = useState("board-1");
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardListTitle, setSelectedCardListTitle] = useState("");
  const [view, setView] = useState("board"); // board | analytics
  const [enriching, setEnriching] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [draggingFromList, setDraggingFromList] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const activeBoard = boards.find(b => b.id === activeBoardId);

  const addNotif = useCallback((message, type = "ai") => {
    const id = Date.now();
    setNotifs(n => [...n, { id, message, type }]);
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 4000);
  }, []);

  const updateBoards = useCallback((updater) => {
    setBoards(prev => prev.map(b => b.id === activeBoardId ? updater(b) : b));
  }, [activeBoardId]);

  const handleAddCard = useCallback((listId, title) => {
    const newCard = { id: `c${Date.now()}`, title, priority: "medium", assignee: "AR", labels: [], due: null, estimatedHours: 0, aiEnriched: false, aiDescription: "", subtasks: [] };
    updateBoards(board => ({
      ...board,
      lists: board.lists.map(l => l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l)
    }));
    addNotif(`Card "${title}" added. Click ✦ to enrich with AI.`);
  }, [updateBoards, addNotif]);

  const handleCardUpdate = useCallback((cardId, updates) => {
    updateBoards(board => ({
      ...board,
      lists: board.lists.map(l => ({ ...l, cards: l.cards.map(c => c.id === cardId ? { ...c, ...updates } : c) }))
    }));
    if (selectedCard?.id === cardId) {
      setSelectedCard(prev => ({ ...prev, ...updates }));
    }
  }, [updateBoards, selectedCard]);

  const handleEnrichAI = useCallback(async (cardId) => {
    setEnriching(true);
    await new Promise(r => setTimeout(r, 1400));
    const enrichment = AI_ENRICHMENTS[Math.floor(Math.random() * AI_ENRICHMENTS.length)];
    handleCardUpdate(cardId, { aiEnriched: true, aiDescription: enrichment.description, subtasks: enrichment.subtasks, estimatedHours: enrichment.estimatedHours, priority: enrichment.priority });
    setEnriching(false);
    addNotif("✦ AI enrichment complete — description, subtasks & estimate added.");
  }, [handleCardUpdate, addNotif]);

  const handleDragStart = useCallback((e, cardId, listId) => {
    setDraggingCardId(cardId);
    setDraggingFromList(listId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingCardId(null);
    setDraggingFromList(null);
    setDragOverListId(null);
  }, []);

  const handleDrop = useCallback((e, targetListId) => {
    e.preventDefault();
    if (!draggingCardId || draggingFromList === targetListId) {
      setDragOverListId(null);
      return;
    }
    let movedCard;
    updateBoards(board => {
      let card;
      const listsWithoutCard = board.lists.map(l => {
        if (l.id === draggingFromList) {
          card = l.cards.find(c => c.id === draggingCardId);
          return { ...l, cards: l.cards.filter(c => c.id !== draggingCardId) };
        }
        return l;
      });
      movedCard = card;
      return {
        ...board,
        lists: listsWithoutCard.map(l => l.id === targetListId ? { ...l, cards: [...l.cards, card] } : l)
      };
    });
    setDragOverListId(null);
    const targetList = activeBoard?.lists.find(l => l.id === targetListId);
    if (targetList) addNotif(`Card moved to "${targetList.title}"`, "action");
  }, [draggingCardId, draggingFromList, updateBoards, activeBoard, addNotif]);

  const handleCreateBoard = useCallback(() => {
    const name = prompt("Board name:");
    if (!name) return;
    const newBoard = {
      id: `board-${Date.now()}`,
      title: name,
      color: ["#6C5CE7", "#00D68F", "#FFB800", "#FF5C5C"][Math.floor(Math.random() * 4)],
      lists: [
        { id: `l${Date.now()}1`, title: "To Do", cards: [] },
        { id: `l${Date.now()}2`, title: "In Progress", cards: [] },
        { id: `l${Date.now()}3`, title: "Done", cards: [] },
      ]
    };
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
    addNotif(`Board "${name}" created!`, "action");
  }, [addNotif]);

  const filteredLists = searchQuery
    ? activeBoard?.lists.map(l => ({ ...l, cards: l.cards.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())) }))
    : activeBoard?.lists;

  if (!activeBoard) return null;

  return (
    <>
      <style>{globalStyle}</style>
      <Notification notifs={notifs} onDismiss={id => setNotifs(n => n.filter(x => x.id !== id))} />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: tokens.bg }}>
        <Sidebar boards={boards} activeBoardId={activeBoardId} setActiveBoardId={id => { setActiveBoardId(id); setSelectedCard(null); setView("board"); }} onCreateBoard={handleCreateBoard} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top bar */}
          <div style={{ height: 52, background: tokens.surface, borderBottom: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 16, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: activeBoard.color }} />
              <h1 style={{ fontSize: 15, fontWeight: 700 }}>{activeBoard.title}</h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search cards..." style={{ width: 180, height: 32, fontSize: 12, padding: "0 12px" }} />
              <button onClick={() => setView(v => v === "board" ? "analytics" : "board")} className="btn-ghost" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                {view === "board" ? "📊 Analytics" : "📋 Board"}
              </button>
              <button onClick={() => addNotif("✦ AI Sprint Summary generating...", "ai")} className="btn-ghost" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <SparkleIcon size={11} color={tokens.ai} /> AI Summary
              </button>
            </div>

            <div style={{ display: "flex", gap: -4 }}>
              {MEMBERS.map((m, i) => (
                <div key={m.id} style={{ marginLeft: i > 0 ? -8 : 0, border: `2px solid ${tokens.surface}`, borderRadius: "50%" }}>
                  <Avatar id={m.id} size={28} />
                </div>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {view === "analytics" ? (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <AnalyticsDashboard board={activeBoard} />
              </div>
            ) : (
              <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden" }}>
                <div style={{ display: "flex", gap: 12, padding: 16, height: "100%", alignItems: "flex-start" }}
                  onDragOver={e => { e.preventDefault(); const el = e.target.closest("[data-list-id]"); if (el) setDragOverListId(el.dataset.listId); }}>
                  {filteredLists?.map(list => (
                    <div key={list.id} data-list-id={list.id}>
                      <List list={list} onCardClick={(card) => { setSelectedCard(card); setSelectedCardListTitle(list.title); }} onAddCard={handleAddCard} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} dragOverListId={dragOverListId} draggingCardId={draggingCardId} />
                    </div>
                  ))}

                  {/* Add list button */}
                  <div style={{ width: 280, flexShrink: 0 }}>
                    <div onClick={() => { const t = prompt("List name:"); if (t) updateBoards(b => ({ ...b, lists: [...b.lists, { id: `l${Date.now()}`, title: t, cards: [] }] })); }}
                      style={{ width: "100%", padding: "12px 16px", background: tokens.surface + "80", border: `1px dashed ${tokens.border}`, borderRadius: 12, color: tokens.textTertiary, cursor: "pointer", fontSize: 13, textAlign: "center", transition: "all 100ms" }}
                      onMouseEnter={e => { e.currentTarget.style.background = tokens.surface; e.currentTarget.style.color = tokens.textSecondary; }}
                      onMouseLeave={e => { e.currentTarget.style.background = tokens.surface + "80"; e.currentTarget.style.color = tokens.textTertiary; }}>
                      + Add list
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Card detail panel */}
            {selectedCard && (
              <CardPanel
                card={selectedCard}
                listTitle={selectedCardListTitle}
                onClose={() => setSelectedCard(null)}
                onUpdate={handleCardUpdate}
                onEnrichAI={handleEnrichAI}
                enriching={enriching}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
