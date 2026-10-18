import { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// Identity = the person's Google account. Same uid on every browser and
// device, so their books stay theirs. Name + email live in a private
// /users/{uid} doc; public book docs only carry authorName + authorUid.

const AuthContext = createContext(null);
const provider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { uid, name, email } | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      // Old anonymous sessions from before this change don't count as logged in.
      if (!user || user.isAnonymous) {
        setSession(null);
        setLoading(false);
        return;
      }
      try {
        const profileRef = doc(db, "users", user.uid);
        const snap = await getDoc(profileRef);
        let name;
        let email;
        if (snap.exists()) {
          ({ name, email } = snap.data());
        } else {
          name = user.displayName || (user.email || "Reader").split("@")[0];
          email = (user.email || "").toLowerCase();
          await setDoc(profileRef, { name, email, updatedAt: serverTimestamp() });
        }
        setSession({ uid: user.uid, name, email });
      } catch (err) {
        console.error(err);
        setSession(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login() {
    // onAuthStateChanged takes it from here and builds the session.
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
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
