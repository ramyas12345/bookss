import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { CATEGORIES, getBookById, readingTimeMinutes, formatPublishedDate, hasClapped, toggleClap, deleteBook } from "../lib/store";
import { useAuth } from "../context/AuthContext";
import BookCover from "../components/BookCover";
import "./BookView.css";

const IMAGE_MARKER = /\[image (\d+)\]/g;

function renderContent(content, images) {
  const parts = [];
  let lastIndex = 0;
  let match;
  IMAGE_MARKER.lastIndex = 0;
  while ((match = IMAGE_MARKER.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    const imgIdx = parseInt(match[1], 10) - 1;
    if (images[imgIdx]) {
      parts.push({ type: "image", value: images[imgIdx] });
    }
    lastIndex = IMAGE_MARKER.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }
  return parts;
}

export default function BookView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clapped, setClapped] = useState(false);
  const [clapBusy, setClapBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBookById(id).then((b) => {
      if (!cancelled) { setBook(b); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!book || !session) { setClapped(false); return; }
    let cancelled = false;
    hasClapped(book.id, session.uid).then((c) => { if (!cancelled) setClapped(c); });
    return () => { cancelled = true; };
  }, [book, session]);

  if (loading) return null;

  if (!book) {
    return (
      <div className="bookview__missing">
        <p>That book isn't on the shelf.</p>
        <Link to="/books">Back to the shelf</Link>
      </div>
    );
  }

  const categoryLabel = CATEGORIES.find((c) => c.id === book.category)?.label || book.category;
  const isOwner = session && session.uid === book.authorUid;
  const parts = renderContent(book.content || "", book.images || []);
  const isEmpty = !book.content || !book.content.trim();
  const publishedDate = formatPublishedDate(book.createdAt);

  async function handleClap() {
    if (!session) { navigate("/login"); return; }
    if (isOwner || clapBusy) return;
    setClapBusy(true);
    const willBeClapped = !clapped;
    setClapped(willBeClapped);
    setBook((b) => ({ ...b, clapCount: (b.clapCount || 0) + (willBeClapped ? 1 : -1) }));
    try {
      await toggleClap(book, session.uid, session.name);
    } catch (err) {
      console.error(err);
      setClapped(!willBeClapped);
      setBook((b) => ({ ...b, clapCount: (b.clapCount || 0) + (willBeClapped ? -1 : 1) }));
    } finally {
      setClapBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${book.title}" permanently? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteBook(book.id);
      navigate("/books");
    } catch (err) {
      console.error(err);
      alert("Couldn't delete — check your connection and try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="bookview">
      <p className="bookview__eyebrow">Let's get reading</p>
      <aside className="bookview__side">
        <BookCover title={book.title} coverText={book.coverText} authorName={book.authorName} color={book.color} size="lg" />
        {isOwner && (
          <button className="bookview__edit" onClick={() => navigate(`/write/${book.id}`)}>
            Keep writing
          </button>
        )}
        {isOwner && (
          <button className="bookview__delete" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete this book"}
          </button>
        )}
      </aside>

      <article className="bookview__content">
        <p className="bookview__tag">{categoryLabel}</p>
        <h1>{book.title}</h1>
        <p className="bookview__byline">
          by {book.authorName} · {readingTimeMinutes(book.content)} min read
          {publishedDate ? ` · published ${publishedDate}` : ""}
        </p>

        <button
          type="button"
          className={`bookview__clap${clapped ? " bookview__clap--active" : ""}`}
          onClick={handleClap}
          disabled={isOwner}
          title={isOwner ? "You can't clap your own book" : clapped ? "Remove clap" : "Give this book a clap"}
        >
          👏 <span>{book.clapCount || 0}</span>
        </button>

        {isEmpty ? (
          <p className="bookview__empty">
            {isOwner ? "Nothing written yet — go add the first page." : "This book is still an empty cover. Nothing written yet."}
          </p>
        ) : (
          <div className="bookview__body">
            {parts.map((p, i) =>
              p.type === "text" ? (
                <p key={i}>{p.value}</p>
              ) : (
                <img key={i} src={p.value} alt="" className="bookview__image" />
              )
            )}
          </div>
        )}
      </article>
    </div>
  );
}
