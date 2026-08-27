import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Both fields are needed — that's how your books get your name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("That email doesn't look right.");
      return;
    }
    setSubmitting(true);
    try {
      await login(name, email);
      navigate("/books");
    } catch (err) {
      setError("Couldn't log in — check your Firebase setup and connection.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <p className="login__eyebrow">Log in to write</p>
        <h1>Two things, and you're in.</h1>
        <p className="login__hint">
          Your name will appear on your cover. Your email stays private and is only used to sign you in.
        </p>

        <label>
          Full name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meera Nair" autoComplete="name" />
        </label>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="meera@example.com" autoComplete="email" type="email" />
        </label>

        {error ? <p className="login__error">{error}</p> : null}

        <button type="submit" className="login__submit" disabled={submitting}>
          {submitting ? "Entering…" : "Enter"}
        </button>
      </form>
    </div>
  );
}