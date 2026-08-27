import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./ExploreHint.css";

const ALLOWED_PATHS = ["/", "/books"];
const SEEN_KEY = "explore-hint-seen";
const SHOW_DELAY_MS = 4500;  // wait until they've clearly just been browsing

// A small floating tip with a mascot, shown to anyone lingering on the
// landing page or the shelf (browsing, not mid-task) — separate from
// WelcomeToast, which only fires for a logged-in person right after load.
// Stays up until manually closed; no auto-hide timer.
export default function ExploreHint() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ALLOWED_PATHS.includes(location.pathname)) {
      setVisible(false);
      return;
    }
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(showTimer);
  }, [location.pathname]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(SEEN_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div className="exploreHint" role="status">
      <svg className="exploreHint__mascot" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="27" cy="52" rx="10" ry="3" fill="#000000" opacity="0.08" />
        <path d="M22 44v5M32 44v5" stroke="#3A2A12" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="27" cy="30" r="16" fill="#F4C15C" stroke="#3A2A12" strokeWidth="2" />
        <circle cx="24" cy="15" r="3.5" fill="#F4C15C" stroke="#3A2A12" strokeWidth="2" />
        <circle cx="21" cy="27" r="2" fill="#3A2A12" />
        <circle cx="32" cy="27" r="2" fill="#3A2A12" />
        <ellipse cx="18" cy="33" rx="3" ry="2" fill="#F2A65A" opacity="0.8" />
        <ellipse cx="35" cy="33" rx="3" ry="2" fill="#F2A65A" opacity="0.8" />
        <path d="M24 32c1.5 1.6 4.5 1.6 6 0" stroke="#3A2A12" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M38 24c4 0 8-3 10-7" stroke="#3A2A12" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="48" cy="17" r="2.5" fill="#F4C15C" stroke="#3A2A12" strokeWidth="2" />
        <path d="M52 10l1 3M56 13l-3 2M55 8l-2 3" stroke="#3A2A12" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <div className="exploreHint__text">
        <p className="exploreHint__title">Just looking around?</p>
        <p className="exploreHint__sub"> Write what you know. Read, review and discover what others know. What you know could become someone's next read!</p>
      </div>
      <button type="button" className="exploreHint__close" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}