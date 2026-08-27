# Athenaeum — book-cover newsletter platform (Firebase-backed)

Users log in with just a name + email, write a short educational
newsletter, and it's shelved as a book with a generated cover (color +
initials based on their name). Now backed by Firebase, so it's real
multi-user data, not per-browser localStorage.

## How login/privacy works (read this first)

- Every visitor is signed in with **Firebase Anonymous Auth** in the
  background — that gives every session a real `uid`, which is what
  Firestore's security rules use to enforce "only you can edit your
  book," with no password to manage.
- The name + email someone types goes into a **private** doc at
  `/users/{uid}` — rules only let that uid read its own doc.
- Public book documents only ever store `authorName` + `authorUid`,
  **never email** — so the shelf, search, and every book page are safe
  to show to anyone. Security rules also technically block writing an
  `email`/`authorEmail` field onto a book, as a second layer.

## Setup

1. **Create a Firebase project** at https://console.firebase.google.com
   (free tier is enough for an MVP).
2. In the project, enable:
   - **Authentication** → Sign-in method → enable **Anonymous**
   - **Firestore Database** → create in production mode
   - (Skip Firebase Storage — it requires the paid Blaze plan even at
     $0 actual usage. Images use Cloudinary instead, see below.)
3. Project settings → General → "Your apps" → add a **Web app** → copy
   the config values.
4. Copy `.env.example` to `.env` and fill in the Firebase values:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
5. **Set up Cloudinary for image uploads** (free, no card needed):
   - Create a free account at https://cloudinary.com
   - Your **Cloud name** is shown on the dashboard — copy it
   - Go to Settings (gear icon) → Upload tab → Upload presets →
     Add upload preset → set **Signing Mode to "Unsigned"** → Save →
     copy the preset's name
   - Open `src/lib/config.js` and fill in `CLOUDINARY_CLOUD_NAME` and
     `CLOUDINARY_UPLOAD_PRESET` with those two values
6. Publish the Firestore security rules — paste the contents of
   `firestore.rules` into Firestore → Rules tab in the console →
   Publish. (Or install the Firebase CLI and run
   `firebase deploy --only firestore:rules`.)
7. Run it:
   ```
   npm install
   npm run dev
   ```

## What's already built

- Passwordless login (name + email), backed by Firebase Anonymous Auth
  + a private Firestore profile doc
- "Add a book" flow: title, category, optional one-line cover text,
  live cover preview
- Auto-generated cover: consistent shape, color from a curated
  palette keyed to the author's name, large initials
- Writing editor: textarea, up to 5 images (2MB cap each) uploaded to
  Cloudinary, `.txt`/`.md` import, images referenced inline as
  `[image 1]` etc.
- Public shelf (Firestore-backed, real multi-user): filter by
  category, search by title/author
- Individual book page rendering cover, content, and inline images
- Newsletter-style landing page at `/`
- Standalone newsletter domain support (see below) — same deployment,
  a second front door

## Standalone newsletter domain + platform, one deployment

1. Deploy this app once (Vercel/Netlify/Firebase Hosting all work).
2. In your host's dashboard, add BOTH domains as custom domains on
   that same deployment — your main platform domain, and
   `upiratlasnewsletter.com`.
3. Create your newsletter as a book on the platform as normal
   (`/add` → write it → note the id in the URL, e.g. `/book/abc123`).
4. Open `src/lib/config.js` and set `NEWSLETTER_DOMAIN` to your real
   domain and `NEWSLETTER_BOOK_ID` to that book's id.
5. Redeploy.

Visiting the platform domain shows the normal shelf. Visiting the
newsletter domain shows a dedicated front door built from that book's
own content, with a link into the same book on the platform and a link
through to the rest of the shelf.

## Not built yet (by design, to hit 7 days)

- PDF import (paste text in, or import `.txt`/`.md` — real PDF parsing
  is a rabbit hole not worth the time right now)
- Email verification (Anonymous Auth + a self-reported email means
  someone could type someone else's email; fine for an MVP demo, not
  for production — a real fix is Firebase's passwordless email-link
  sign-in, which is a natural next step, not a rewrite)
