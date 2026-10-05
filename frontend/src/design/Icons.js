import React from 'react';

const shapes = {
  arrow: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
  arrowUp: <><path d="M5 19 19 5" /><path d="M8 5h11v11" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  close: <><path d="M5 5 19 19" /><path d="M19 5 5 19" /></>,
  sparkle: <><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" /><path d="m19 17 .6 1.4L21 19l-1.4.6L19 21l-.6-1.4L17 19l1.4-.6L19 17Z" /></>,
  drop: <path d="M12 3c-3.7 5-6.5 8.1-6.5 11.8a6.5 6.5 0 0 0 13 0C18.5 11.1 15.7 8 12 3Z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <path d="m4 12 5 5L20 6" />,
  shield: <><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h1M3 12h1M3 18h1" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  mail: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="m3 7 9 7 9-7" /></>,
  logout: <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M16 16l4-4-4-4M8 12h12" /></>,
  search: <><circle cx="10.8" cy="10.8" r="7" /><path d="m16 16 5 5" /></>,
  star: <path d="m12 2 3 6.3 7 .9-5.1 4.9 1.3 7-6.2-3.3-6.2 3.3 1.3-7L2 9.2l7-.9L12 2Z" />,
};

export default function Icon({ name, size = 20, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {shapes[name] || shapes.sparkle}
  </svg>;
}
