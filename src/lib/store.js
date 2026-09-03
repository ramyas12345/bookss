// Firestore + Storage data layer. Every page imports only from here —
// same shape as the old localStorage version, just async now.

import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs, setDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./config";

export const CATEGORIES = [
  { id: "science", label: "Science" },
  { id: "maths", label: "Maths" },
  { id: "psychology", label: "Psychology" },
  { id: "ai", label: "AI" },
  { id: "history", label: "History" },
  { id: "health", label: "Health" },
  { id: "business", label: "Business" },
  { id: "literature", label: "Literature" },
];

// Curated palette — every cover pulls from this set, never a raw random
// hue, so the shelf always reads as one designed collection.
export const SPINE_COLORS = [
  "#7A2E2E", "#2E4A3D", "#5E9490", "#C9A227",
  "#3B4A73", "#6B3E5E", "#8A5A2E", "#3E4A5E",
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function colorForName(name) {
  const idx = hashString(name || "anon") % SPINE_COLORS.length;
  return SPINE_COLORS[idx];
}

export function initialsForName(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function readingTimeMinutes(content) {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Firestore Timestamp -> "Aug 27, 2026", for showing when a book was
// first published. Falls back to "" while createdAt is still pending
// (serverTimestamp() reads back as null until the write round-trips).
export function formatPublishedDate(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const booksCol = collection(db, "books");

function fromDoc(snap) {
  return { id: snap.id, ...snap.data() };
}

export async function getBooks() {
  const q = query(booksCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(fromDoc);
}

export async function getBookById(id) {
  const snap = await getDoc(doc(db, "books", id));
  return snap.exists() ? fromDoc(snap) : null;
}

export async function getBooksByAuthor(uid) {
  const q = query(booksCol, where("authorUid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map(fromDoc);
}

// NOTE: no email is ever written onto a book doc — only name + uid.
export async function createBook({ title, category, coverText, author, color }) {
  const payload = {
    title: title.trim(),
    category,
    coverText: coverText?.trim() || "",
    authorName: author.name,
    authorUid: author.uid,
    color: color || colorForName(author.name),
    content: "",
    images: [],
    clapCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(booksCol, payload);
  return { id: ref.id, ...payload };
}

export async function updateBook(id, patch) {
  const ref = doc(db, "books", id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  return getBookById(id);
}

export async function updateBook(id, patch) {
  const ref = doc(db, "books", id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  return getBookById(id);
}

// Permanently deletes a book. Firestore security rules restrict this to
// the book's own author — safe to call from any signed-in user's UI,
// since a non-owner's request is rejected server-side regardless.
export async function deleteBook(id) {
  await deleteDoc(doc(db, "books", id));
}

// Claps are the whole "reaction instead of comments" system: one clap per
// reader per book (toggleable, like a like-button), no text input, so
// there's nothing to moderate. Tracked as a tiny subcollection doc so we
// can check "did this person already clap" without scanning anything,
// with a denormalized clapCount on the book itself for cheap reads.
export async function hasClapped(bookId, uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "books", bookId, "claps", uid));
  return snap.exists();
}

export async function toggleClap(book, uid, clapperName) {
  const clapRef = doc(db, "books", book.id, "claps", uid);
  const bookRef = doc(db, "books", book.id);
  const existing = await getDoc(clapRef);

  if (existing.exists()) {
    await deleteDoc(clapRef);
    await updateDoc(bookRef, { clapCount: increment(-1) });
    return false;
  }

  await setDoc(clapRef, { createdAt: serverTimestamp() });
  await updateDoc(bookRef, { clapCount: increment(1) });

  // Notify the author, unless they're clapping their own book somehow.
  if (book.authorUid && book.authorUid !== uid) {
    await addDoc(collection(db, "notifications"), {
      toUid: book.authorUid,
      bookId: book.id,
      bookTitle: book.title,
      fromName: clapperName,
      type: "clap",
      read: false,
      createdAt: serverTimestamp(),
    });
  }
  return true;
}

export async function getNotifications(uid) {
  const q = query(
    collection(db, "notifications"),
    where("toUid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markNotificationsRead(ids) {
  await Promise.all(
    ids.map((id) => updateDoc(doc(db, "notifications", id), { read: true }))
  );
}

// Uploads image files to Cloudinary (free tier, no billing card needed —
// unlike Firebase Storage, which requires the paid Blaze plan even at
// $0 actual usage) and returns their public URLs. Those URL strings get
// stored on the book doc, same shape as before — far lighter than
// embedding base64 in Firestore either way.
export async function uploadBookImages(files, uid, bookId) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary isn't configured yet — set CLOUDINARY_CLOUD_NAME and " +
      "CLOUDINARY_UPLOAD_PRESET in src/lib/config.js"
    );
  }
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const urls = [];
  for (const file of files) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    form.append("folder", `athenaeum/${uid}/${bookId}`);
    const res = await fetch(uploadUrl, { method: "POST", body: form });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Cloudinary upload failed: ${errBody}`);
    }
    const data = await res.json();
    urls.push(data.secure_url);
  }
  return urls;
}
