import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, session, loading } = useAuth();
  const navigate = useNavigate();

  // Already signed in? Skip the login screen.
  useEffect(() => {
    if (!loading && session) navigate("/books", { replace: true });
  }, [loading, session, navigate]);

  async function handleGoogle() {
    setError("");
    setSubmitting(true);
    try {
      await login();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(
          err.code === "auth/unauthorized-domain"
            ? "This domain isn't authorized in Firebase yet."
            : "Couldn't sign in — please try again."
        );
        console.error(err);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <p className="login__eyebrow">Log in to write</p>
        <h1>One click, and you're in.</h1>
        <p className="login__hint">
          Your name will appear on your cover. Your email stays private and is
          only used to sign you in.
        </p>

        {error ? <p className="login__error">{error}</p> : null}

        <button type="button" className="login__submit" onClick={handleGoogle} disabled={submitting}>
          {submitting ? "Opening Google…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
