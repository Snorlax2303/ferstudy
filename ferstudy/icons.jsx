// ferstudy/icons.jsx — inline SVG icons
const Icon = ({ name, size = 18, className = '' }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    className,
  };
  switch (name) {
    case 'home':
      return <svg {...props}><path d="M3 12 12 4l9 8" /><path d="M5 10v10h14V10" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'chart':
      return <svg {...props}><path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="8" rx="0.5"/><rect x="13" y="7" width="3" height="12" rx="0.5"/></svg>;
    case 'inbox':
      return <svg {...props}><path d="M3 13l3-8h12l3 8"/><path d="M3 13v6h18v-6"/><path d="M8 13a4 4 0 0 0 8 0"/></svg>;
    case 'book':
      return <svg {...props}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>;
    case 'settings':
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9 1.7 1.7 0 0 0 4.3 7.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'help':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17.01l.01-.011"/></svg>;
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'bell':
      return <svg {...props}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>;
    case 'chev-l':
      return <svg {...props}><path d="m15 6-6 6 6 6"/></svg>;
    case 'chev-r':
      return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chev-d':
      return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'plus':
      return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'close':
      return <svg {...props}><path d="m6 6 12 12M6 18 18 6"/></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>;
    case 'pin':
      return <svg {...props}><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'note':
      return <svg {...props}><path d="M9 4h7l4 4v12H9z"/><path d="M16 4v4h4"/><path d="M12 12h6M12 16h6"/></svg>;
    case 'today':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="12" cy="14" r="2.5" fill="currentColor"/></svg>;
    case 'filter':
      return <svg {...props}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>;
    case 'trash':
      return <svg {...props}><path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"/></svg>;
    case 'users':
      return <svg {...props}><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M21 18a4.5 4.5 0 0 0-7-3.7"/></svg>;
    case 'flame':
      return <svg {...props}><path d="M12 3c2 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4-1 4 3 4 3 0 0-2-1-3 0-5z"/></svg>;
    case 'tag':
      return <svg {...props}><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>;
    case 'edit':
      return <svg {...props}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="m13 6 4 4"/></svg>;
    default: return null;
  }
};

window.Icon = Icon;
