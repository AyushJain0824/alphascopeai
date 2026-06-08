/** Central CSS variable maps for dark (default) and light themes. */

export const THEME_STORAGE_KEY = "alphascope_theme";

export const darkThemeVars = `
  --bg:       #080b12;
  --bg2:      #0d1220;
  --bg3:      #111827;
  --surface:  rgba(255,255,255,0.04);
  --border:   rgba(109, 41, 41, 0.15);
  --border2:  rgba(255,255,255,0.14);
  --text:     #e8edf5;
  --muted:    #6b7a99;
  --accent:   #00d4ff;
  --accent2:  #7c3aed;
  --green:    #00e5a0;
  --red:      #ff4560;
  --yellow:   #ffd166;
  --orange:   #ff9f43;
  --font-head:'Clash Display', sans-serif;
  --font-body:'Cabinet Grotesk', sans-serif;
  --font-mono:'DM Mono', monospace;
  --radius:   12px;
  --glow:     0 0 30px rgba(0,212,255,0.15);
  --glass-bg: rgba(13,18,32,0.7);
  --chart-grid: rgba(255,255,255,0.06);
  --modal-overlay: rgba(0,0,0,0.75);
  --tab-active-shadow: 0 1px 6px rgba(0,0,0,0.4);
  --toast-shadow: 0 4px 30px rgba(0,0,0,0.5);
  --scrollbar-track: var(--bg2);
  --scrollbar-thumb: var(--border2);
  --tag-text: #a78bfa;
  --gradient-text-from: #fff;
  --gradient-text-to: #aaa;
  --badge-purple-text: #a78bfa;
`;

export const lightThemeVars = `
  --bg:       #eef2fb;
  --bg2:      #e4eaf6;
  --bg3:      #d8e2f0;
  --surface:  rgba(255,255,255,0.72);
  --border:   rgba(15, 23, 42, 0.1);
  --border2:  rgba(15, 23, 42, 0.14);
  --text:     #0f172a;
  --muted:    #64748b;
  --accent:   #0090b8;
  --accent2:  #6d28d9;
  --green:    #059669;
  --red:      #dc2626;
  --yellow:   #ca8a04;
  --orange:   #ea580c;
  --font-head:'Clash Display', sans-serif;
  --font-body:'Cabinet Grotesk', sans-serif;
  --font-mono:'DM Mono', monospace;
  --radius:   12px;
  --glow:     0 0 28px rgba(0,144,184,0.18);
  --glass-bg: rgba(255,255,255,0.78);
  --chart-grid: rgba(15,23,42,0.1);
  --modal-overlay: rgba(15,23,42,0.45);
  --tab-active-shadow: 0 1px 8px rgba(15,23,42,0.12);
  --toast-shadow: 0 8px 32px rgba(15,23,42,0.15);
  --scrollbar-track: #dce6f0;
  --scrollbar-thumb: rgba(15,23,42,0.22);
  --tag-text: #5b21b6;
  --gradient-text-from: #0f172a;
  --gradient-text-to: #475569;
  --badge-purple-text: #5b21b6;
`;

/** Shared structural CSS (uses variables only). Injected once with theme blocks. */
export const APP_STRUCTURE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@400;500;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html.theme-root-transition,
  html.theme-root-transition body,
  html.theme-root-transition .glass,
  html.theme-root-transition .modal-box,
  html.theme-root-transition input,
  html.theme-root-transition select,
  html.theme-root-transition textarea,
  html.theme-root-transition .btn {
    transition: background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease,
      box-shadow 0.35s ease, fill 0.35s ease, stroke 0.35s ease;
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.6;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--scrollbar-track); }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 99px; }

  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .glass-hover {
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s, background-color 0.35s ease;
  }
  .glass-hover:hover {
    border-color: var(--border2);
    box-shadow: var(--glow);
    transform: translateY(-1px);
  }

  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px; border: none;
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.01em;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: white;
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,212,255,0.3); }
  .btn-ghost {
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text);
  }
  .btn-ghost:hover { background: rgba(128,128,128,0.12); border-color: var(--border2); }
  .btn-danger { background: rgba(255,69,96,0.2); border: 1px solid rgba(255,69,96,0.3); color: var(--red); }
  .btn-success { background: rgba(0,229,160,0.15); border: 1px solid rgba(0,229,160,0.3); color: var(--green); }

  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
    font-family: var(--font-mono);
  }
  .badge-green { background: rgba(0,229,160,0.15); color: var(--green); border: 1px solid rgba(0,229,160,0.2); }
  .badge-red   { background: rgba(255,69,96,0.15);  color: var(--red);   border: 1px solid rgba(255,69,96,0.2); }
  .badge-blue  { background: rgba(0,212,255,0.1);   color: var(--accent); border: 1px solid rgba(0,212,255,0.2); }
  .badge-yellow{ background: rgba(255,209,102,0.1); color: var(--yellow); border: 1px solid rgba(255,209,102,0.2); }
  .badge-purple{ background: rgba(124,58,237,0.15); color: var(--badge-purple-text); border: 1px solid rgba(124,58,237,0.3); }

  input, select, textarea {
    background: var(--bg3); border: 1px solid var(--border);
    color: var(--text); border-radius: 8px; padding: 8px 12px;
    font-family: var(--font-body); font-size: 13px; outline: none;
    transition: border-color 0.2s, background-color 0.35s ease, color 0.35s ease;
    width: 100%;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  select option { background: var(--bg3); color: var(--text); }

  .tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 600; font-family: var(--font-mono);
    background: rgba(124,58,237,0.15); color: var(--tag-text);
    border: 1px solid rgba(124,58,237,0.2);
  }

  .scrollable { overflow-y: auto; }
  .scrollable-x { overflow-x: auto; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 600;
       text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted);
       border-bottom: 1px solid var(--border); white-space: nowrap; }
  td { padding: 10px 12px; border-bottom: 1px solid var(--border);
       font-size: 13px; white-space: nowrap; }
  tr:hover td { background: rgba(128,128,128,0.06); }

  .spinner {
    width: 20px; height: 20px; border: 2px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  .pulse { animation: pulse 2s ease-in-out infinite; }

  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .slide-up { animation: slideUp 0.4s ease forwards; }

  .dot-live {
    width: 7px; height: 7px; background: var(--green);
    border-radius: 50%; box-shadow: 0 0 8px var(--green);
    animation: pulse 1.5s ease-in-out infinite;
    display: inline-block;
  }

  .gradient-text {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .score-ring {
    position: relative; display: inline-flex;
    align-items: center; justify-content: center;
  }

  .noise-bg { position: relative; }
  .noise-bg::before {
    content: ''; position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; border-radius: inherit; z-index: 0;
  }

  .custom-tooltip {
    background: var(--glass-bg); border: 1px solid var(--border2);
    border-radius: 8px; padding: 10px 14px;
    font-family: var(--font-mono); font-size: 12px;
    color: var(--text);
  }

  .score-bar-bg {
    height: 4px; background: var(--border); border-radius: 99px; overflow: hidden;
  }
  .score-bar-fill {
    height: 100%; border-radius: 99px;
    transition: width 1s cubic-bezier(0.4,0,0.2,1);
  }

  .tab-list { display: flex; gap: 4px; padding: 4px; background: var(--bg3); border-radius: 10px; }
  .tab-item {
    padding: 6px 14px; border-radius: 7px; cursor: pointer;
    font-size: 13px; font-weight: 500; transition: all 0.2s;
    color: var(--muted); border: none; background: transparent;
    font-family: var(--font-body);
  }
  .tab-item.active {
    background: var(--bg2); color: var(--text);
    box-shadow: var(--tab-active-shadow);
  }
  .tab-item:hover:not(.active) { color: var(--text); }

  .modal-overlay {
    position: fixed; inset: 0; background: var(--modal-overlay);
    backdrop-filter: blur(8px); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-box {
    background: var(--bg2); border: 1px solid var(--border2);
    border-radius: 16px; max-width: 800px; width: 100%;
    max-height: 90vh; overflow-y: auto;
  }

  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; width: 220px;
    background: var(--bg2); border-right: 1px solid var(--border);
    z-index: 100; display: flex; flex-direction: column;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; border-radius: 8px; cursor: pointer;
    font-size: 13px; font-weight: 500; transition: all 0.2s;
    color: var(--muted); margin: 0 8px;
    border: none; background: transparent; text-align: left; width: calc(100% - 16px);
    font-family: var(--font-body);
  }
  .nav-item:hover, .nav-item.active {
    background: rgba(0,212,255,0.08); color: var(--text);
  }
  .nav-item.active { color: var(--accent); border-left: 2px solid var(--accent); }

  .main-content {
    margin-left: 220px; padding: 24px; min-height: 100vh;
  }

  .chat-bubble {
    max-width: 85%; padding: 12px 16px;
    border-radius: 14px; font-size: 13px; line-height: 1.7;
    white-space: pre-wrap; word-break: break-word;
  }
  .chat-user { background: linear-gradient(135deg,rgba(0,212,255,0.2),rgba(124,58,237,0.2)); border: 1px solid rgba(0,212,255,0.2); margin-left: auto; }
  .chat-ai { background: var(--bg3); border: 1px solid var(--border); color: var(--text); }

  .ticker-wrap { overflow: hidden; white-space: nowrap; }
  .ticker-inner { display: inline-block; animation: ticker 40s linear infinite; }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  .grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
  .grid-auto { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 16px; }

  @media (max-width: 1100px) {
    .grid-4 { grid-template-columns: repeat(2,1fr); }
    .grid-3 { grid-template-columns: repeat(2,1fr); }
  }
  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); }
    .main-content { margin-left: 0; padding: 16px; }
    .grid-2,.grid-3,.grid-4 { grid-template-columns: 1fr; }
  }

  .stat-card {
    padding: 18px 20px; position: relative; overflow: hidden;
  }
  .stat-card::after {
    content: ''; position: absolute; top: 0; right: 0;
    width: 60px; height: 60px; border-radius: 50%;
    filter: blur(30px); opacity: 0.3;
  }

  .typing-dots span {
    display: inline-block; width: 6px; height: 6px;
    background: var(--accent); border-radius: 50%; margin: 0 2px;
    animation: typingBounce 1.4s ease-in-out infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typingBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }

  .heatmap-cell {
    padding: 8px; border-radius: 6px; text-align: center; cursor: pointer;
    transition: transform 0.2s; font-size: 11px;
  }
  .heatmap-cell:hover { transform: scale(1.05); z-index: 1; position: relative; }
`;

export function buildThemeStylesheet() {
  return `
    :root[data-theme="dark"],
    :root:not([data-theme]) {
      ${darkThemeVars}
    }
    :root[data-theme="light"] {
      ${lightThemeVars}
    }
    ${APP_STRUCTURE_CSS}
  `;
}
