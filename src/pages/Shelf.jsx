import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, getBooks } from "../lib/store";
import BookCover from "../components/BookCover";
import "./Shelf.css";

export default function Shelf() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getBooks()
      .then((b) => { if (!cancelled) setBooks(b); })
      .catch((err) => { console.error(err); if (!cancelled) setError("Couldn't load the shelf — check your connection."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchesCategory = category === "all" || b.category === category;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q || b.authorName.toLowerCase().includes(q) || b.title.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [books, category, query]);

  return (
    <div className="shelf">
      <div className="shelf__header">
        <h1>The shelf</h1>
        <p>{books.length} book{books.length === 1 ? "" : "s"}, written by people who bothered to explain something.</p>
      </div>

      <div className="shelf__controls">
        <input
          className="shelf__search"
          placeholder="Search by title or author..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="shelf__filters">
          <button
            className={category === "all" ? "shelf__filter shelf__filter--active" : "shelf__filter"}
            onClick={() => setCategory("all")}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={category === c.id ? "shelf__filter shelf__filter--active" : "shelf__filter"}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="shelf__loading">Loading the shelf…</p>
      ) : error ? (
        <p className="shelf__loading">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="shelf__empty">
          <p>Nothing here yet.</p>
          <Link to="/add">Be the first to shelve something →</Link>
        </div>
      ) : (
        <div className="shelf__grid">
          {filtered.map((b) => (
            <Link to={`/book/${b.id}`} key={b.id} className="shelf__item">
              <BookCover title={b.title} coverText={b.coverText} authorName={b.authorName} color={b.color} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
