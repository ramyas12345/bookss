import { initialsForName } from "../lib/store";
import "./BookCover.css";

// The signature element of the whole product: every book gets the same
// aged-leather shape, tinted per-author with their chosen color and marked
// with their initials, so the shelf reads as one coherent library instead
// of a grid of random cards.
export default function BookCover({ title, coverText, authorName, color, size = "md" }) {
  const initials = initialsForName(authorName);
  return (
    <div className={`cover cover--${size}`} style={{ "--spine-color": color }}>
      <div className="cover__seal">
        <span>{initials}</span>
      </div>
      <div className="cover__title">{title}</div>
      {coverText ? <div className="cover__tagline">{coverText}</div> : null}
      <div className="cover__foot">{authorName}</div>
    </div>
  );
}   