import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import WelcomeToast from "./components/WelcomeToast";
import IntroSplash from "./components/IntroSplash";
import ExploreHint from "./components/ExploreHint";
import Landing from "./pages/Landing";
import NewsletterHome from "./pages/NewsletterHome";
import Login from "./pages/Login";
import Shelf from "./pages/Shelf";
import AddBook from "./pages/AddBook";
import Editor from "./pages/Editor";
import BookView from "./pages/BookView";
import { isNewsletterDomain } from "./lib/config";
import { AuthProvider } from "./context/AuthContext";

function Layout({ children }) {
  const location = useLocation();
  const bare = location.pathname === "/";
  return (
    <>
      {!bare && <Nav />}
      {children}
      <WelcomeToast />
      <ExploreHint />
    </>
  );
}

export default function App() {
  const onNewsletterDomain = isNewsletterDomain();
  return (
    <AuthProvider>
      <IntroSplash />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={onNewsletterDomain ? <NewsletterHome /> : <Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/books" element={<Shelf />} />
            <Route path="/add" element={<AddBook />} />
            <Route path="/write/:id" element={<Editor />} />
            <Route path="/book/:id" element={<BookView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}