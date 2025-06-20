import Header from "./header";
import { Github, Mail } from "lucide-react";
import { Linkedin } from "lucide-react";
import Footer from "./footer";
import { useLanguage } from "../context/languageContext";
import translations from "./../constants/languages";

const About = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const Socials = [
    {
      name: "GitHub",
      url: "https://github.com/Dawaman43",
      icon: Github,
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/dawit-worku-jima",
      icon: Linkedin,
    },
    {
      name: "Email",
      url: "mailto:dawitworkujima@gmail.com",
      icon: Mail,
    },
  ];

  return (
    <>
      <Header />
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-[#423fae] via-[#332ebc] to-[#2a2599] text-white px-4 pt-20">
        <span className="text-center text-2xl sm:text-3xl font-bold mt-12 mb-6 animate-fade-in max-w-2xl">
          {t.aboutMe}
        </span>
        <h1 className="text-xl font-semibold mb-4">{t.mySocials}</h1>
        <div className="flex gap-8 mt-2">
          {Socials.map((social) => {
            const Icon = social.icon;

            return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform duration-300"
                title={`Visit my ${social.name}`}
              >
                <Icon className="w-10 h-10 text-white hover:text-gray-300" />
              </a>
            );
          })}
        </div>
      </div>

      <Footer />
    </>
  );
};
export default About;
