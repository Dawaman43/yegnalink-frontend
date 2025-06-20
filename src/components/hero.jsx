import { images } from "../constants/images";
import { videos } from "../constants/videos";
import { Link } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import translations from "../constants/languages";
import { useLanguage } from "../context/languageContext";

const Hero = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const API_URL = import.meta.env.VITE_API_URL;
  console.log("API_URL:", API_URL);

  return (
    <>
      <Header />

      {/* Hero Section */}
      <main className="flex flex-col md:flex-row justify-between items-center px-8 py-16 pt-24 min-h-[calc(100vh-5rem)] bg-white">
        {/* Left Side */}
        <div className="flex flex-col gap-8 items-center md:items-start text-center md:text-left w-full md:w-1/2">
          <span className="text-5xl md:text-6xl font-bold text-[#423fae] leading-tight">
            {t.welcome}
          </span>

          <a href={`${API_URL}/user/google`} className="w-64 md:w-72">
            <button className="w-full h-14 border-2 border-[#423fae] rounded-full flex items-center justify-center gap-2 text-[#423fae] font-semibold text-lg hover:bg-[#423fae] hover:text-white px-8">
              <img src={images.google} alt="google logo" className="w-8" />
              <span>{t.loginGoogle}</span>
            </button>
          </a>

          <Link to="/login" className="w-64 md:w-72">
            <button className="w-full h-14 border-2 rounded-full flex items-center justify-center gap-2 text-white bg-[#423fae] font-semibold text-lg px-8 cursor-pointer">
              {t.loginEmail}
            </button>
          </Link>
        </div>

        {/* Right Side - Video */}
        <div className="w-full md:w-1/2 mt-12 md:mt-0">
          <video
            autoPlay
            loop
            muted
            className="w-full h-auto max-h-[70vh] object-cover rounded-lg"
          >
            <source src={videos.hero} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Hero;
