import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./WelcomeToast.css";

// Shows once per browser session, the first time we detect a logged-in
// person after the app loads (covers both "just logged in" and "opened
// the site already logged in"). Uses sessionStorage so it doesn't nag
// on every page navigation within the same visit.
export default function WelcomeToast() {
  const { session, loading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    const key = `welcomed:${session.uid}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [loading, session]);

  if (!visible || !session) return null;

  const firstName = session.name.split(" ")[0];

  return (
    <div className="welcomeToast" role="status">
      <p>
        Hello {firstName}, welcome back, what are you writing today?
      </p>
      <button type="button" className="welcomeToast__close" onClick={() => setVisible(false)} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}