import { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import translations from "../../constants/languages";
import { useLanguage } from "../../context/languageContext";
import { useTheme } from "../../context/themeContext";
import { ArrowLeftCircleIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Modal = ({ isOpen, onClose, onConfirm, message }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Confirm Language Change
        </h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#423fae] text-white py-2 px-4 rounded-lg hover:bg-[#4a47b8] transition-all duration-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: "",
    selectedLanguage: "",
  });
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const backButtonRef = useRef(null);
  const logoutButtonRef = useRef(null);
  const { language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const t = translations[language];

  const languages = [
    { code: "am", name: "Amharic (አማርኛ)" },
    { code: "en", name: "English" },
  ];

  useEffect(() => {
    // Debug refs
    console.log("Logout Button Ref:", logoutButtonRef.current);
    console.log("Dropdown Menu Ref:", dropdownMenuRef.current);

    // Container animations
    gsap.fromTo(
      containerRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );
    gsap.fromTo(
      containerRef.current.children,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.4,
      }
    );
    // Back button animation
    gsap.fromTo(
      backButtonRef.current,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.2 }
    );
    // Logout button animation
    gsap.fromTo(
      logoutButtonRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.6 }
    );

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const dropdownMenu = dropdownMenuRef.current;
    if (open && dropdownMenu) {
      const height = dropdownMenu.scrollHeight;
      gsap.fromTo(
        dropdownMenu,
        { height: 0, opacity: 0 },
        { height, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
      const items = dropdownMenu.querySelectorAll("li");
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.3,
            ease: "power2.out",
            delay: 0.2,
          }
        );
      }
    } else if (dropdownMenu) {
      gsap.to(dropdownMenu, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power3.in",
      });
    }
  }, [open]);

  const handleLanguageSelect = (langCode) => {
    setModalState({
      isOpen: true,
      message: `Do you want to change the language to ${
        languages.find((l) => l.code === langCode).name
      }?`,
      selectedLanguage: langCode,
    });
    setOpen(false);
  };

  const confirmLanguageChange = () => {
    toggleLanguage(modalState.selectedLanguage);
    setModalState({ isOpen: false, message: "", selectedLanguage: "" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("theme");
    navigate("/login");
  };

  const filteredLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-br from-[#423fae] to-[#3a38a3]"
          : "bg-gradient-to-br from-white to-[#f0f0f0]"
      } relative overflow-hidden`}
    >
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/20 rounded-full w-2 h-2 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center justify-center p-8 min-h-screen relative z-10">
        <div className="w-full max-w-lg mb-4">
          <Link to="/chat/home">
            <ArrowLeftCircleIcon
              ref={backButtonRef}
              className={`h-10 w-10 ${
                isDarkMode ? "text-white" : "text-[#423fae]"
              } hover:scale-110 transition-transform duration-200`}
              aria-label="Back to home"
              onMouseEnter={() =>
                gsap.to(backButtonRef.current, {
                  scale: 1.2,
                  rotate: 5,
                  duration: 0.3,
                  ease: "power2.out",
                })
              }
              onMouseLeave={() =>
                gsap.to(backButtonRef.current, {
                  scale: 1,
                  rotate: 0,
                  duration: 0.3,
                  ease: "power2.out",
                })
              }
            />
          </Link>
        </div>

        <div className="flex justify-between items-center w-full max-w-lg mb-8">
          <h1
            className={`text-5xl font-extrabold tracking-tight ${
              isDarkMode ? "text-white" : "text-[#423fae]"
            }`}
          >
            {t.settings || "Settings"}
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[#423fae] text-white hover:bg-[#4a47b8] transition-all duration-200"
            aria-label={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {isDarkMode ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>

        <div
          ref={containerRef}
          className={`w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 ${
            isDarkMode ? "text-white" : "text-[#423fae]"
          }`}
        >
          <h2 className="text-2xl font-bold mb-6">
            {t.chooseLanguage || "Choose Language"}
          </h2>
          <div ref={dropdownRef} className="relative z-20">
            <button
              onClick={() => setOpen(!open)}
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-left flex justify-between items-center hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-expanded={open}
              aria-label="Select language"
            >
              <span>
                {languages.find((lang) => lang.code === language)?.name ||
                  "Select Language"}
              </span>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              ref={dropdownMenuRef}
              className={`dropdown-menu absolute w-full mt-2 ${
                isDarkMode ? "bg-gray-800/95" : "bg-white/95"
              } backdrop-blur-lg rounded-lg shadow-xl border border-white/20 overflow-hidden ${
                open ? "block" : "hidden"
              }`}
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchLanguage || "Search language..."}
                className={`w-full px-4 py-2 bg-transparent border-b border-white/30 focus:outline-none focus:ring-0 ${
                  isDarkMode ? "text-white" : "text-[#423fae]"
                }`}
                aria-label="Search languages"
              />
              <ul role="menu" className="max-h-60 overflow-y-auto">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang, index) => (
                    <li
                      role="menuitem"
                      key={lang.code}
                      className={`${
                        isDarkMode ? "text-white" : "text-[#423fae]"
                      }`}
                      onMouseEnter={() =>
                        gsap.to(
                          dropdownMenuRef.current.querySelectorAll("li")[index],
                          {
                            scale: 1.02,
                            backgroundColor: isDarkMode
                              ? "rgba(66, 63, 174, 0.5)"
                              : "rgba(66, 63, 174, 0.3)",
                            duration: 0.2,
                            ease: "power2.out",
                          }
                        )
                      }
                      onMouseLeave={() =>
                        gsap.to(
                          dropdownMenuRef.current.querySelectorAll("li")[index],
                          {
                            scale: 1,
                            backgroundColor: "transparent",
                            duration: 0.2,
                            ease: "power2.out",
                          }
                        )
                      }
                    >
                      <button
                        onClick={() => handleLanguageSelect(lang.code)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleLanguageSelect(lang.code);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-[#423fae]/70 focus:bg-[#423fae]/70 transition-all duration-200 focus:outline-none ${
                          isDarkMode ? "text-white" : "text-[#423fae]"
                        }`}
                        aria-label={`Select ${lang.name}`}
                        tabIndex={0}
                      >
                        {lang.name}
                      </button>
                    </li>
                  ))
                ) : (
                  <li
                    className={`px-4 py-3 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {t.noResults || "No languages found"}
                  </li>
                )}
              </ul>
            </div>
          </div>

          <button
            ref={logoutButtonRef}
            onClick={handleLogout}
            className={`mt-6 w-full rounded-lg bg-[#423fae]/90 text-white py-3 px-6 font-medium transition-all duration-300 shadow-md hover:bg-[#4a47b8]/90 focus:outline-none focus:ring-2 focus:ring-white/50 z-30`}
            aria-label="Log out"
            onMouseEnter={() =>
              gsap.to(logoutButtonRef.current, {
                scale: 1.05,
                duration: 0.3,
                ease: "power2.out",
              })
            }
            onMouseLeave={() =>
              gsap.to(logoutButtonRef.current, {
                scale: 1,
                duration: 0.3,
                ease: "power2.out",
              })
            }
          >
            Log out
          </button>
        </div>

        <Modal
          isOpen={modalState.isOpen}
          onClose={() =>
            setModalState({ isOpen: false, message: "", selectedLanguage: "" })
          }
          onConfirm={confirmLanguageChange}
          message={modalState.message}
        />
      </div>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); opacity: 0.3; }
            50% { transform: translateY(-20px); opacity: 0.6; }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .dropdown-menu.hidden {
            display: none;
          }
          .dropdown-menu.block {
            display: block;
          }
        `}
      </style>
    </div>
  );
};

export default Settings;
