import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getBooksByAuthor, getNotifications, markNotificationsRead, initialsForName } from "../lib/store";
import "./Nav.css";

export default function Nav() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const wrapperRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!session) { setBooks([]); setNotifications([]); return; }
    let cancelled = false;
    getBooksByAuthor(session.uid).then((b) => { if (!cancelled) setBooks(b); });
    getNotifications(session.uid).then((n) => { if (!cancelled) setNotifications(n); });
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function toggleNotifications() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      markNotificationsRead(unreadIds).catch(console.error);
    }
  }

  return (
    <header className="nav">
      <div className="nav__left">
        <button type="button" className="nav__back" onClick={() => navigate(-1)} aria-label="Go back">
          ×
        </button>
        <Link to="/books" className="nav__brand">Books</Link>
      </div>
      <nav className="nav__links">
        <Link to="/books">Shelf</Link>
        {loading ? null : session ? (
          <>
            <Link to="/add" className="nav__cta">Add a book</Link>

            <div className="nav__profile" ref={notifRef}>
              <button
                type="button"
                className="nav__bell"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && <span className="nav__bellBadge">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="nav__dropdown">
                  <p className="nav__dropdownName">Notifications</p>
                  {notifications.length === 0 ? (
                    <p className="nav__dropdownEmpty">Nothing yet — claps on your books will show up here.</p>
                  ) : (
                    <ul className="nav__dropdownBooks">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <strong>{n.fromName}</strong> clapped for <em>{n.bookTitle}</em>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="nav__profile" ref={wrapperRef}>
              <button
                type="button"
                className="nav__avatar"
                onClick={() => setOpen((o) => !o)}
                aria-label="Profile"
              >
                {initialsForName(session.name)}
              </button>
              {open && (
                <div className="nav__dropdown">
                  <p className="nav__dropdownName">{session.name}</p>
                  {books.length === 0 ? (
                    <p className="nav__dropdownEmpty">No books yet.</p>
                  ) : (
                    <ul className="nav__dropdownBooks">
                      {books.map((b) => (
                        <li key={b.id}>{b.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="nav__cta">Log in</Link>
        )}
      </nav>
    </header>
  );
}