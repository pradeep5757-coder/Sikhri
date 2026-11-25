// Inline SVG icons copied from the live page.

export const BackIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CommentIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Zm3 4v2h10V8H7Zm0 4v2h7v-2H7Z" fill="currentColor" />
  </svg>
);

export const HeartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M12 20.5 4.6 13.4a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 0 1 6.5 6.5L12 20.5Z" fill="currentColor" />
  </svg>
);

export const LockIcon = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2H13v7H3V7h1.5Zm1.5 0h4V5a2 2 0 0 0-4 0v2Z" fill="currentColor" />
  </svg>
);

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
    <path d="m5.5 12.5 4.2 4.2 8.8-9.2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SHARE_PATHS = {
  share: <path d="M12 15V4m0 0L8 8m4-4 4 4M6 11H5v9h14v-9h-1" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />,
  facebook: <path fill="currentColor" d="M13.4 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.7v3h2.6V21z" />,
  whatsapp: (
    <>
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z" />
      <path fill="currentColor" d="M8.9 7.9c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.3-.1.6.5.9 1.5 2 2.8 2.6.3.1.5.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .6-.2 1.4-.9 1.8-.6.4-1.6.6-3.1 0-1.9-.8-3.6-2.5-4.4-3.9-.7-1.2-.9-2.3-.5-3.1z" />
    </>
  ),
  x: <path fill="currentColor" d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.3 5.7zm-1 16.2h1.7L7.3 4.7H5.5z" transform="translate(12 12) scale(.82) translate(-12 -12)" />,
  linkedin: <path fill="currentColor" d="M4.5 9h3v11h-3zM6 3.8a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM10 9h2.9v1.5h.04c.4-.8 1.4-1.7 3-1.7 3.1 0 3.7 2.1 3.7 4.7V20h-3v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V20H10z" />,
  email: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.5 7 7.5 6 7.5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
};

export const ShareIcon = ({ name }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    {SHARE_PATHS[name]}
  </svg>
);
