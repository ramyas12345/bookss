import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SPINE_COLORS, getBookById, readingTimeMinutes, updateBook, uploadBookImages } from "../lib/store";
import { useAuth } from "../context/AuthContext";
import BookCover from "../components/BookCover";
import "./Editor.css";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

export default function Editor() {
  const { id } = useParams();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const importInputRef = useRef(null);

  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBookById(id).then((b) => {
      if (cancelled) return;
      if (!b) { navigate("/books"); return; }
      setBook(b);
      setContent(b.content || "");
      setImages(b.images || []);
      setLoadingBook(false);
    });
    return () => { cancelled = true; };
  }, [id, navigate]);

  if (authLoading || loadingBook) return null;
  if (!session) { navigate("/login"); return null; }
  if (!book) return null;

  if (book.authorUid !== session.uid) {
    return (
      <div className="editor__blocked">
        <p>This book belongs to {book.authorName}. You can only write in your own.</p>
      </div>
    );
  }

  async function save(patch = {}) {
    const updated = await updateBook(book.id, { content, images, ...patch });
    setBook(updated);
    setStatus("Saved");
    setTimeout(() => setStatus(""), 1500);
  }

  async function changeColor(color) {
    setBook((b) => ({ ...b, color }));
    await save({ color });
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Up to ${MAX_IMAGES} images per book — you've got ${images.length} already.`);
      return;
    }
    const oversized = files.find((f) => f.size > MAX_IMAGE_BYTES);
    if (oversized) {
      setError(`"${oversized.name}" is over 2MB — try a smaller image.`);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const startIdx = images.length;
      const urls = await uploadBookImages(files, session.uid, book.id);
      const nextImages = [...images, ...urls];
      // Auto-embed each newly uploaded image at the end of the current
      // draft, so there's no separate "insert" step to remember or miss.
      const markers = urls.map((_, i) => `\n[image ${startIdx + i + 1}]\n`).join("");
      const nextContent = content + markers;
      setImages(nextImages);
      setContent(nextContent);
      await save({ images: nextImages, content: nextContent });
    } catch (err) {
      setError("Upload failed — check your connection and Firebase Storage setup.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx) {
    const removedNumber = idx + 1;
    const next = images.filter((_, i) => i !== idx);
    const nextContent = content
      .replace(/\[image (\d+)\]/g, (match, numStr) => {
        const num = parseInt(numStr, 10);
        if (num === removedNumber) return "";
        if (num > removedNumber) return `[image ${num - 1}]`;
        return match;
      })
      .replace(/\n{3,}/g, "\n\n");
    setImages(next);
    setContent(nextContent);
    save({ images: next, content: nextContent });
  }

  async function insertImageTag(idx) {
    const marker = `\n[image ${idx + 1}]\n`;
    const ta = textareaRef.current;
    const pos = ta ? ta.selectionStart : content.length;
    const next = content.slice(0, pos) + marker + content.slice(pos);
    setContent(next);
    await save({ content: next });
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.match(/\.(txt|md)$/i)) {
      setError("Import supports plain text (.txt, .md) for now — paste content from Word or PDF directly instead.");
      return;
    }
    const text = await file.text();
    setContent((prev) => (prev ? prev + "\n\n" + text : text));
    setError("");
  }

  return (
    <div className="editor">
      <p className="editor__eyebrow">Share your literate insights</p>
      <div className="editor__meta">
        <span className="editor__title">{book.title}</span>
        <span className="editor__reading">{readingTimeMinutes(content)} min read</span>
        {status ? <span className="editor__status">{status}</span> : null}
      </div>

      <div className="editor__coverRow">
        <BookCover title={book.title} coverText={book.coverText} authorName={book.authorName} color={book.color} size="md" />
        <div className="editor__swatches">
          <p className="editor__swatchLabel">Cover color</p>
          <div className="editor__swatchRow">
            {SPINE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`editor__swatch${c === book.color ? " editor__swatch--active" : ""}`}
                style={{ "--swatch": c }}
                onClick={() => changeColor(c)}
                aria-label={`Use color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="editor__textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write what you know. Paste in a draft, or import a text file below. Uploaded images are added to the end of your draft automatically — move the [image 1], [image 2]... marker anywhere in the text to reposition it."
      />

      {error ? <p className="editor__error">{error}</p> : null}

      <div className="editor__images">
        {images.map((src, i) => (
          <div key={i} className="editor__thumb">
            <img src={src} alt={`upload ${i + 1}`} />
            <div className="editor__thumbActions">
              <button type="button" onClick={() => insertImageTag(i)}>Insert here</button>
              <button type="button" onClick={() => removeImage(i)}>Remove</button>
            </div>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button type="button" className="editor__addImage" onClick={() => imageInputRef.current.click()} disabled={uploading}>
            {uploading ? "Uploading…" : `+ Image (${images.length}/${MAX_IMAGES})`}
          </button>
        )}
        <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
      </div>

      <div className="editor__actions">
        <button type="button" className="editor__import" onClick={() => importInputRef.current.click()}>
          Import .txt / .md
        </button>
        <input ref={importInputRef} type="file" accept=".txt,.md" hidden onChange={handleImport} />

        <div className="editor__actionsRight">
          <button type="button" className="editor__save" onClick={() => save()}>Save draft</button>
          <button type="button" className="editor__publish" onClick={async () => { await save(); navigate(`/book/${book.id}`); }}>
            Save &amp; view →
          </button>
        </div>
      </div>
    </div>
  );
}