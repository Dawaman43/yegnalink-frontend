import { Link } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import { useLanguage } from "../context/languageContext";
import translations from "../constants/languages";

const Explore = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <>
      <Header />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#423fae] via-[#332ebc] to-[#2a2599] text-white">
        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 animate-fade-in">
              {t.discover}
            </h2>
            <p className="text-lg sm:text-xl text-gray-200 mb-8">
              {t.community}
            </p>
            <Link
              to="/login"
              className="inline-block bg-[#423fae] text-white font-bold py-4 px-8 rounded-full hover:bg-[#332ebc] hover:scale-105 transition-all duration-300 shadow-lg"
            >
              {t.start}
            </Link>
          </div>

          {/* Topics Section */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
            {t.topics.map((topic) => (
              <div
                key={topic}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:scale-105 transition-all duration-300 cursor-pointer shadow-md"
              >
                <span className="text-lg font-semibold text-white">
                  {topic}
                </span>
              </div>
            ))}
          </div>

          {/* Privacy Assurance */}
          <div className="mt-12 text-center max-w-2xl">
            <p className="text-sm sm:text-base text-gray-300">
              {t.privacy}{" "}
              <Link to="/privacy" className="text-[#a1a7ff] hover:underline">
                Learn more
              </Link>
            </p>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
};

export default Explore;
