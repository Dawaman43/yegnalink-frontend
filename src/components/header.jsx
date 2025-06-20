import { Globe, Menu, X } from "lucide-react";
import { images } from "../constants/images";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/languageContext";
import translations from "./../constants/languages";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];
  const options = [
    { value: "en", abbr: "EN", label: "English" },
    { value: "am", abbr: "AM", label: "Amharic" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close language dropdown if click is outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
      // Close mobile menu if click is outside and menu is open
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        openMenu &&
        !event.target.closest(
          'button[aria-label="Open menu"], button[aria-label="Close menu"]'
        )
      ) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    document.body.style.overflow = openMenu ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [openMenu]);

  const handleSelect = (value) => {
    toggleLanguage(value);
    setOpen(false);
  };

  const toggleMenu = () => {
    setOpenMenu(!openMenu);
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md h-20 z-50 fixed top-0 left-0 right-0">
      {/* Logo */}
      <img src={images.logo} alt="Logo" className="w-36 object-contain" />

      {/* Desktop Navigation */}
      <ul className="hidden md:flex space-x-8 text-[#423fae] font-medium">
        {[
          { label: t.home, path: "/" },
          { label: t.explore, path: "/explore" },
          { label: t.about, path: "/about-us" },
        ].map((item, index) => {
          const isActive = location.pathname === item.path;

          return (
            <li
              key={index}
              className={`relative cursor-pointer transition-all duration-300 ${
                isActive
                  ? "text-[#2a2b6e] font-bold"
                  : "text-gray-600 hover:text-[#2a2b6e]"
              }`}
            >
              <Link to={item.path} className="no-underline">
                {item.label}
              </Link>
              <span
                className={`absolute left-0 -bottom-1 h-0.5 bg-[#423fae] w-full transform transition-transform duration-300 ${
                  isActive ? "scale-x-100" : "scale-x-0"
                }`}
                style={{ transformOrigin: "left" }}
              />
            </li>
          );
        })}
      </ul>

      {/* Desktop Auth + Language */}
      <div className="hidden md:flex items-center space-x-4">
        <Link
          to="/register"
          className="text-white bg-[#423fae] px-4 py-2 rounded-full font-bold"
        >
          {t.join}
        </Link>
        <Link
          to="/login"
          className="text-[#423fae] border border-[#423fae] bg-white px-4 py-2 rounded-full font-bold"
        >
          {t.login}
        </Link>
        {/* Language Dropdown */}
        <div
          ref={dropdownRef}
          tabIndex={0}
          onClick={() => setOpen(!open)}
          className="relative cursor-pointer flex items-center ml-2 text-[#423fae]"
        >
          <Globe />
          <span className="ml-1 font-medium">
            {options.find((opt) => opt.value === language)?.abbr}
          </span>
          {open && (
            <ul className="absolute top-full right-0 bg-white mt-2 rounded-md shadow-lg w-28 max-h-48 overflow-y-auto z-50">
              {options.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-4 py-2 cursor-pointer ${
                    language === opt.value
                      ? "bg-gray-100 font-semibold"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden block relative"
        onClick={toggleMenu}
        aria-label={openMenu ? "Close menu" : "Open menu"}
        aria-expanded={openMenu}
      >
        {openMenu ? <X /> : <Menu />}
      </button>

      {/* Mobile Menu */}
      {openMenu && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden">
          <div
            ref={menuRef}
            className="absolute top-20 right-0 w-64 bg-white h-[calc(100vh-5rem)] p-6 shadow-lg transform transition-transform duration-300 ease-in-out"
          >
            <ul className="flex flex-col gap-y-6">
              {[
                { label: t.home, path: "/" },
                { label: t.explore, path: "/explore" },
                { label: t.about, path: "/about-us" },
              ].map((item, index) => {
                const isActive = location.pathname === item.path;

                return (
                  <li
                    key={index}
                    className={`relative cursor-pointer transition-all duration-300 ${
                      isActive
                        ? "text-[#2a2b6e] font-bold"
                        : "text-gray-600 hover:text-[#2a2b6e]"
                    }`}
                    onClick={toggleMenu}
                  >
                    <Link to={item.path} className="no-underline">
                      {item.label}
                    </Link>
                    <span
                      className={`absolute left-0 -bottom-1 h-0.5 bg-[#423fae] w-full transform transition-transform duration-300 ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                      style={{ transformOrigin: "left" }}
                    />
                  </li>
                );
              })}
              <li className="mt-6">
                <Link
                  to="/register"
                  className="block text-white bg-[#423fae] px-4 py-2 rounded-full font-bold text-center"
                  onClick={toggleMenu}
                >
                  {t.join}
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="block text-[#423fae] border border-[#423fae] bg-white px-4 py-2 rounded-full font-bold text-center"
                  onClick={toggleMenu}
                >
                  {t.login}
                </Link>
              </li>
              <li className="mt-4">
                <div
                  tabIndex={0}
                  onClick={() => setOpen(!open)}
                  className="relative cursor-pointer flex items-center text-[#423fae]"
                >
                  <Globe />
                  <span className="ml-2 font-medium">
                    {options.find((opt) => opt.value === language)?.label}
                  </span>
                </div>
                {open && (
                  <ul className="bg-white mt-2 rounded-md shadow-lg w-full">
                    {options.map((opt) => (
                      <li
                        key={opt.value}
                        onClick={() => {
                          handleSelect(opt.value);
                          toggleMenu();
                        }}
                        className={`px-4 py-2 cursor-pointer ${
                          language === opt.value
                            ? "bg-gray-100 font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
