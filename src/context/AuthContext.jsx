import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// How identity works here:
// - Every visitor gets a Firebase anonymous auth uid automatically. That uid
//   is what Firestore Security Rules check ("only the owner can edit this
//   book"), so we get real per-person write protection with no password.
// - The name+email the person types goes into a PRIVATE doc at
//   /users/{uid} — rules only let that uid read its own doc, so nobody
//   else's email is ever exposed by the app.
// - Public book documents only ever store authorName + authorUid, never
//   email, so the shelf and every book page are safe to read for anyone.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { uid, name, email } | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSession(null);
        setLoading(false);
        return;
      }
      const profileRef = doc(db, "users", user.uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const data = snap.data();
        setSession({ uid: user.uid, name: data.name, email: data.email });
      } else {
        setSession(null); // signed in anonymously but hasn't completed login form yet
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(name, email) {
    let user = auth.currentUser;
    if (!user) {
      const cred = await signInAnonymously(auth);
      user = cred.user;
    }
    const profile = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", user.uid), profile, { merge: true });
    const next = { uid: user.uid, name: profile.name, email: profile.email };
    setSession(next);
    return next;
  }

  function logout() {
    // We keep the anonymous auth session (so their books stay theirs if
    // they log back in with the same email on the same device) but clear
    // the app-level session so the UI treats them as logged out.
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
