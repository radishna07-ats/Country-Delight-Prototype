import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const S = ({ size = 20, children, ...p }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>{children}</svg>
);

export const I = {
  home: (p: P) => <S {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-6h4v6" /></S>,
  grid: (p: P) => <S {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></S>,
  crown: (p: P) => <S {...p}><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /></S>,
  users: (p: P) => <S {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14c2.4.2 4 1.8 4.5 4.5" /></S>,
  heart: (p: P) => <S {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></S>,
  search: (p: P) => <S {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></S>,
  calendar: (p: P) => <S {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></S>,
  mic: (p: P) => <S {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></S>,
  send: (p: P) => <S {...p}><path d="M4 12 20 4l-6 16-2.5-6.5L4 12z" /></S>,
  x: (p: P) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>,
  back: (p: P) => <S {...p}><path d="M15 5l-7 7 7 7" /></S>,
  chevron: (p: P) => <S {...p}><path d="m9 5 7 7-7 7" /></S>,
  down: (p: P) => <S {...p}><path d="m5 9 7 7 7-7" /></S>,
  wallet: (p: P) => <S {...p}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 9.5h18M16.5 14h1.5" /><path d="M6 6l9-3 1.5 3" /></S>,
  truck: (p: P) => <S {...p}><path d="M3 6h11v10H3zM14 9.5h4l3 3.5v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></S>,
  box: (p: P) => <S {...p}><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z" /><path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" /></S>,
  plane: (p: P) => <S {...p}><path d="M21 15.5 13.5 11V5.5a1.5 1.5 0 0 0-3 0V11L3 15.5V17l7.5-2v3.5L8.5 20v1.2L12 20l3.5 1.2V20l-2-1.5V15l7.5 2z" /></S>,
  receipt: (p: P) => <S {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6" /></S>,
  user: (p: P) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" /></S>,
  tag: (p: P) => <S {...p}><path d="M3.5 12.5V4h8.5l8.5 8.5-8 8-9-8z" /><circle cx="8" cy="8.5" r="1.4" /></S>,
  sparkle: (p: P) => <S {...p}><path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" /><path d="M19 15.5c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3z" /></S>,
  check: (p: P) => <S {...p}><path d="m4.5 12.5 5 5 10-11" /></S>,
  undo: (p: P) => <S {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></S>,
  phone: (p: P) => <S {...p}><path d="M5 3.5h3.5l1.5 4.5-2.2 1.6a11 11 0 0 0 6.6 6.6l1.6-2.2 4.5 1.5V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z" /></S>,
  bell: (p: P) => <S {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 0 0 4 0" /></S>,
  leaf: (p: P) => <S {...p}><path d="M5 19C5 10 10 5 20 4c0 9-5 15-13 15" /><path d="M5 19c3-5 6-8 10-10" /></S>,
  history: (p: P) => <S {...p}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5M12 8v4.5l3 2" /></S>,
  info: (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8v.2" /></S>,
  alert: (p: P) => <S {...p}><path d="M12 3.5 21.5 20h-19L12 3.5z" /><path d="M12 10v4.5M12 17.3v.2" /></S>,
  plus: (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>,
  minus: (p: P) => <S {...p}><path d="M5 12h14" /></S>,
  cart: (p: P) => <S {...p}><path d="M3 4h2.5l2.2 11h10.8L21 7.5H6.4" /><circle cx="9.5" cy="19.5" r="1.4" /><circle cx="17.5" cy="19.5" r="1.4" /></S>,
  menu: (p: P) => <S {...p}><path d="M4 7h16M4 12h16M4 17h16" /></S>,
  shield: (p: P) => <S {...p}><path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3z" /><path d="m8.8 12 2.2 2.2 4.4-4.4" /></S>,
  flask: (p: P) => <S {...p}><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" /><path d="M7.5 14h9" /></S>,
  pause: (p: P) => <S {...p}><rect x="6.5" y="5" width="3.5" height="14" rx="1" /><rect x="14" y="5" width="3.5" height="14" rx="1" /></S>,
  bolt: (p: P) => <S {...p}><path d="M13 2.5 4.5 13.5H11L10 21.5l9-11.5h-6.5l.5-7.5z" /></S>,
  sun: (p: P) => <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></S>,
  chat: (p: P) => <S {...p}><path d="M4 5h16v11H9l-5 4V5z" /></S>,
  keyboard: (p: P) => <S {...p}><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7 14h10" /></S>,
  volume: (p: P) => <S {...p}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></S>,
  whatsapp: ({ size = 20, ...p }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...p}><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.6-.2z" /></svg>
  ),
};
