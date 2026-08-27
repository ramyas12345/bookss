import { useEffect, useState } from "react";
import "./IntroSplash.css";

const SEEN_KEY = "intro-splash-seen";
const HOLD_MS = 2600;  // how long "Books / by RoLabs" stays fully visible
const FADE_MS = 700;   // how long the fade-to-homepage takes

// A one-time splash shown the first time the site loads in a browser tab
// (sessionStorage-gated, same pattern as WelcomeToast) — not shown again
// on internal route navigation, only on a fresh visit.
export default function IntroSplash() {
  const [phase, setPhase] = useState(() =>
    sessionStorage.getItem(SEEN_KEY) ? "done" : "visible"
  );

  useEffect(() => {
    if (phase !== "visible") return;
    const t = setTimeout(() => setPhase("fading"), HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "fading") return;
    sessionStorage.setItem(SEEN_KEY, "1");
    const t = setTimeout(() => setPhase("done"), FADE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div className={`introSplash${phase === "fading" ? " introSplash--fadeOut" : ""}`}>
      <h1 className="introSplash__title">Books</h1>
      <p className="introSplash__byline">by RoLabs</p>
    </div>
  );
}