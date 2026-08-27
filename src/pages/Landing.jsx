import { Link } from "react-router-dom";
import BookCover from "../components/BookCover";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing">
      <section className="landing__hero">
        <h1>Books</h1>
        <div className="landing__actions">
          <Link to="/books" className="landing__primary">Explore the shelf →</Link>
          <Link to="/login" className="landing__secondary">Write your own</Link>
        </div>
        <p className="landing__sub">
         Everyone knows something, here it becomes a Book. A place where people turn what they know into something others can read. 
        </p>
      </section>

      <section className="landing__display">
        <BookCover title="On Interest Rates" authorName="Meera Nair" size="lg" coverText="a plain-language primer" variant="leather" />
        <BookCover title="Sourdough, Explained" authorName="Theo Alvarez" size="lg" coverText="why your starter dies" variant="leather" />
        <BookCover title="The Anxious Mind" authorName="Priya Kapoor" size="lg" coverText="notes from clinic" variant="leather" />
      </section>
    </div>
  );
}