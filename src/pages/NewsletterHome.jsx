import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBookById, readingTimeMinutes } from "../lib/store";
import { NEWSLETTER_BOOK_ID } from "../lib/config";
import BookCover from "../components/BookCover";
import "./NewsletterHome.css";

// Standalone front door for the newsletter's own domain. Same deployment
// as the platform — just a different first screen. Pulls the book's own
// content so the domain always shows the newsletter's latest writing,
// with a link through to the full Athenaeum shelf.
export default function NewsletterHome() {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(!!NEWSLETTER_BOOK_ID);

  useEffect(() => {
    if (!NEWSLETTER_BOOK_ID) return;
    let cancelled = false;
    getBookById(NEWSLETTER_BOOK_ID).then((b) => {
      if (!cancelled) { setBook(b); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  if (!book) {
    return (
      <div className="nlhome nlhome--unset">
        <p className="nlhome__eyebrow">Newsletter domain</p>
        <h1>Not connected to a book yet.</h1>
        <p>
          Set <code>NEWSLETTER_BOOK_ID</code> in <code>src/lib/config.js</code> to
          the id of your book once you've created it on the platform.
        </p>
        <Link to="/books" className="nlhome__link">Go to the shelf →</Link>
      </div>
    );
  }

  const preview = (book.content || "").slice(0, 420);

  return (
    <div className="nlhome">
      <section className="nlhome__hero">
        <p className="nlhome__eyebrow">The newsletter</p>
        <h1>{book.title}</h1>
        <p className="nlhome__byline">by {book.authorName} · {readingTimeMinutes(book.content)} min read</p>
        <p className="nlhome__preview">{preview}{book.content.length > 420 ? "…" : ""}</p>
        <div className="nlhome__actions">
          <Link to={`/book/${book.id}`} className="nlhome__primary">Read the full issue →</Link>
          <Link to="/books" className="nlhome__secondary">See the whole shelf</Link>
        </div>
      </section>
      <BookCover title={book.title} coverText={book.coverText} authorName={book.authorName} color={book.color} size="lg" />
    </div>
  );
}
