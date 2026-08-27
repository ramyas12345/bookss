// Point your standalone domain at this SAME deployment (add it as an
// extra custom domain in your host's settings — Vercel/Netlify/Firebase
// Hosting all support multiple domains -> one deployment).
//
// When the app is opened on NEWSLETTER_DOMAIN, it shows a dedicated
// newsletter front door (NewsletterHome) instead of the generic shelf
// landing — built from your own book's content. Everywhere else it
// behaves like the normal platform.

export const NEWSLETTER_DOMAIN = "upiratlasnewsletter.com";

// Set this once you've created your book on the platform — copy the id
// from the URL when viewing it, e.g. /book/bk_172938_ab12c -> "bk_172938_ab12c"
export const NEWSLETTER_BOOK_ID = "";

export function isNewsletterDomain() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.replace(/^www\./, "");
  return host === NEWSLETTER_DOMAIN;
}

// Cloudinary — free image hosting, no billing card required (unlike
// Firebase Storage, which needs the paid Blaze plan even at $0 actual
// usage). Create a free account at cloudinary.com, then:
//   1. Dashboard shows your "Cloud name" at the top — put it here.
//   2. Settings → Upload → Upload presets → Add upload preset →
//      set Signing Mode to "Unsigned" → Save → copy its name here.
export const CLOUDINARY_CLOUD_NAME = "oicgu4h7";
export const CLOUDINARY_UPLOAD_PRESET = "authbooks";
