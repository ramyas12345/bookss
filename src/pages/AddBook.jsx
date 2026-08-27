import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, SPINE_COLORS, colorForName, createBook } from "../lib/store";
import { useAuth } from "../context/AuthContext";
import BookCover from "../components/BookCover";
import "./AddBook.css";

export default function AddBook() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [coverText, setCoverText] = useState("");
  const [color, setColor] = useState(() => colorForName(session?.name));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (!session) {
    navigate("/login");
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give it a title first — that's what goes on the spine.");
      return;
    }
    setSubmitting(true);
    try {
      const book = await createBook({ title, category, coverText, author: session, color });
      navigate(`/write/${book.id}`);
    } catch (err) {
      setError("Couldn't create the book — check your connection and try again.");
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="addbook">
      <form className="addbook__form" onSubmit={handleSubmit}>
        <p className="addbook__eyebrow">New book</p>
        <h1>What are you putting on the shelf?</h1>

        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="On Interest Rates" />
        </label>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          Cover text <span className="addbook__optional">(optional, one line)</span>
          <input value={coverText} onChange={(e) => setCoverText(e.target.value)} placeholder="a plain-language primer" maxLength={60} />
        </label>

        <label>
          Cover color
          <div className="addbook__swatches">
            {SPINE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`addbook__swatch${c === color ? " addbook__swatch--active" : ""}`}
                style={{ "--swatch": c }}
                onClick={() => setColor(c)}
                aria-label={`Use color ${c}`}
              />
            ))}
          </div>
        </label>

        {error ? <p className="addbook__error">{error}</p> : null}

        <button type="submit" className="addbook__submit" disabled={submitting}>
          {submitting ? "Creating…" : "Start writing →"}
        </button>
      </form>

      <div className="addbook__preview">
        <p className="addbook__previewLabel">Your cover</p>
        <BookCover
          title={title || "Untitled"}
          coverText={coverText}
          authorName={session.name}
          color={color}
          size="lg"
        />
      </div>
    </div>
  );
}