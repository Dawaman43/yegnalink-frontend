import { HomeIcon, Inbox, Menu, Settings, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";

const menuItems = [
  {
    label: "Home",
    href: "/chat/home",
    icon: <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    label: "Inbox",
    href: "/chat/inbox",
    icon: <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    label: "Settings",
    href: "/chat/settings",
    icon: <Settings className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
];

const Sidebar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuItemsRef = useRef([]);
  const toggleButtonRef = useRef(null);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const menuItems = menuItemsRef.current.map((item) =>
      item.querySelector(".menu-label")
    );

    if (window.innerWidth < 640) {
      // Mobile: Slide-in from top
      gsap.to(sidebar, {
        y: menuOpen ? 0 : "-100%",
        opacity: menuOpen ? 1 : 0,
        duration: 0.5,
        ease: "power3.inOut",
      });
      gsap.to(menuItems, {
        y: menuOpen ? 0 : -20,
        opacity: menuOpen ? 1 : 0,
        stagger: 0.1,
        duration: 0.4,
        ease: "power2.out",
        display: menuOpen ? "block" : "none",
      });
    } else {
      // Desktop: Expand width
      gsap.to(sidebar, {
        width: menuOpen ? 256 : 80,
        duration: 0.6,
        ease: "power3.inOut",
      });
      gsap.to(menuItems, {
        x: menuOpen ? 0 : -100,
        opacity: menuOpen ? 1 : 0,
        stagger: 0.1,
        duration: 0.4,
        ease: "power2.out",
        display: menuOpen ? "block" : "none",
      });
    }

    gsap.to(toggleButtonRef.current.children[0], {
      rotate: menuOpen ? 90 : 0,
      duration: 0.4,
      ease: "power2.inOut",
    });
  }, [menuOpen]);

  const handleHoverEnter = (index) => {
    gsap.to(menuItemsRef.current[index].querySelector(".icon-container"), {
      scale: 1.2,
      rotate: 5,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleHoverLeave = (index) => {
    gsap.to(menuItemsRef.current[index].querySelector(".icon-container"), {
      scale: 1,
      rotate: 0,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleToggle = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="bg-gradient-to-b from-[#423fae] to-[#3a38a3] shadow-xl">
      {/* Mobile Header */}
      <header className="sm:hidden flex items-center justify-between p-4 w-full h-16">
        <button
          ref={toggleButtonRef}
          onClick={handleToggle}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-2 hover:bg-[#4a47b8] transition-colors duration-200"
        >
          {menuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </header>

      {/* Sidebar / Mobile Menu */}
      <nav
        ref={sidebarRef}
        className={`sm:flex flex-col h-screen sm:w-20 sm:min-w-[80px] sm:p-5 sm:items-center sm:overflow-hidden fixed sm:static top-16 left-0 w-full sm:h-screen bg-gradient-to-b from-[#423fae] to-[#3a38a3] z-50 transform sm:transform-none ${
          menuOpen ? "translate-y-0" : "-translate-y-full"
        } sm:translate-y-0 transition-transform duration-500 sm:duration-0`}
        aria-expanded={menuOpen}
      >
        {/* Close Button for Mobile Menu */}
        {menuOpen && window.innerWidth < 640 && (
          <button
            onClick={handleToggle}
            aria-label="Close menu"
            className="absolute top-4 right-4 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-2 hover:bg-[#4a47b8] transition-colors duration-200"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Toggle Button for Desktop Sidebar */}
        <button
          ref={toggleButtonRef}
          onClick={handleToggle}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="mb-6 sm:mb-8 self-end focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-2 hover:bg-[#4a47b8] transition-colors duration-200 hidden sm:block"
        >
          {menuOpen ? (
            <X className="w-8 h-8 text-white" />
          ) : (
            <Menu className="w-8 h-8 text-white" />
          )}
        </button>

        <ul className="flex flex-col sm:space-y-6 space-y-4 w-full px-4 sm:px-0 pt-12 sm:pt-0">
          {menuItems.map(({ label, href, icon }, index) => (
            <li
              key={label}
              ref={(el) => (menuItemsRef.current[index] = el)}
              className="flex items-center"
              onMouseEnter={() =>
                window.innerWidth >= 640 && handleHoverEnter(index)
              }
              onMouseLeave={() =>
                window.innerWidth >= 640 && handleHoverLeave(index)
              }
            >
              <a
                href={href}
                className="flex items-center w-full text-white hover:bg-[#4a47b8] rounded-lg p-3 transition-colors duration-200 group relative"
                title={
                  !menuOpen && window.innerWidth >= 640 ? label : undefined
                }
                onClick={() => setMenuOpen(false)}
              >
                <div className="icon-container flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                  {icon}
                </div>
                <span
                  className={`menu-label ml-3 text-base sm:text-lg font-medium ${
                    menuOpen || window.innerWidth < 640 ? "block" : "hidden"
                  }`}
                >
                  {label}
                </span>
                {!menuOpen && window.innerWidth >= 640 && (
                  <span className="absolute left-full ml-3 bg-[#4a47b8] text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
                    {label}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
