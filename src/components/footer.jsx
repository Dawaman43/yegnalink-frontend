import { useLanguage } from "../context/languageContext";
import translations from "../constants/languages";
const Footer = () => {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    <footer className="bg-[#423fae] text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} የኛ Link. All rights reserved.
          </p>
          <div>
            <p> Quick Links</p>
            <ul className="flex flex-col md:flex-row gap-4 mt-2">
              <li>
                <a href="/explore" className="text-sm hover:underline">
                  Explore
                </a>
              </li>
              <li>
                <a href="/about" className="text-sm hover:underline">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact" className="text-sm hover:underline">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-sm hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="text-sm hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
