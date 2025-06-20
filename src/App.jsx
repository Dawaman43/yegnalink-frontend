import { Routes, Route } from "react-router-dom";
import Hero from "./components/hero.jsx";
import Explore from "./components/explore.jsx";
import About from "./components/about.jsx";
import Register from "./components/auth/register.jsx";
import Login from "./components/auth/login.jsx";
import Home from "./components/chat/home.jsx";
import ProtectedRoute from "./token/protectedRoute.jsx";
import { LanguageProvider } from "./context/languageContext";
import Settings from "./components/chat/settings.jsx";
import { ThemeProvider } from "./context/themeContext.jsx";
import Inbox from "./components/chat/inbox.jsx";
import OAuthSuccess from "./components/auth/oauthSuccess.jsx";

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<OAuthSuccess />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/chat/home" element={<Home />} />
            <Route path="/chat/settings" element={<Settings />} />
            <Route path="/chat/inbox" element={<Inbox />} />
          </Route>
        </Routes>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
