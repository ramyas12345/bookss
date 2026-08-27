import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markNotificationsRead } from "../lib/store";
import "./NotificationBell.css";

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    getNotifications(session.uid).then(setNotifications);
  }, [session]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!session) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      const current = notifications;
      setNotifications(current.map((n) => ({ ...n, read: true })));
      markNotificationsRead(session.uid, current);
    }
    if (next) {
      setLoading(true);
      const fresh = await getNotifications(session.uid);
      setNotifications(fresh);
      setLoading(false);
    }
  }

  return (
    <div className="bell" ref={panelRef}>
      <button className="bell__trigger" onClick={handleToggle} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className="bell__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="bell__panel">
          <p className="bell__title">Notifications</p>
          {loading ? (
            <p className="bell__empty">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="bell__empty">No claps yet — share your book and check back.</p>
          ) : (
            <ul className="bell__list">
              {notifications.map((n) => (
                <li key={n.id} className={n.read ? "" : "bell__item--unread"}>
                  <Link to={`/book/${n.bookId}`} onClick={() => setOpen(false)}>
                    👏 <strong>{n.fromName}</strong> clapped for <em>{n.bookTitle}</em>
                    <span className="bell__time">{timeAgo(n.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}