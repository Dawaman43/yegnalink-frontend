import { useState, useRef, useEffect } from "react";
import { images } from "../../constants/images";
import Sidebar from "./sidebar";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { useLanguage } from "../../context/languageContext";
import { useTheme } from "../../context/themeContext";
import translations from "../../constants/languages";

const API_URL = import.meta.env.VITE_API_URL;

const validateImageFile = (file) => {
  const validTypes = ["image/jpeg", "image/png", "image/gif"];
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (!validTypes.includes(file.type)) {
    return "Only JPEG, PNG, or GIF images are allowed.";
  }
  if (file.size > maxSize) {
    return "Image size must be less than 5MB.";
  }
  return null;
};

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (err) {
    console.error("Token decoding failed:", err.message);
    return true;
  }
};

const Modal = ({ isOpen, onClose, message, isSuccess }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
      <div
        ref={modalRef}
        className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 sm:p-8 w-full max-w-md mx-auto shadow-2xl border border-white/20"
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`p-3 rounded-full ${
              isSuccess ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <svg
              className={`w-6 h-6 sm:w-8 sm:h-8 ${
                isSuccess ? "text-green-600" : "text-red-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSuccess ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              )}
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            {isSuccess ? "Success" : "Error"}
          </h3>
        </div>
        <p className="text-gray-700 mb-6 sm:mb-8 text-sm sm:text-base">
          {message}
        </p>
        <button
          onClick={onClose}
          className="w-full bg-[#423fae] text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-[#4a47b8] transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-[#423fae] text-sm sm:text-base"
          aria-label="Close modal"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const Home = () => {
  const { language } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const t = translations[language];
  const [preview, setPreview] = useState(null);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: "",
    isSuccess: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameValid, setUsernameValid] = useState(true);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const profilePicRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      gsap.from(formRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
      gsap.from(profilePicRef.current, {
        scale: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
        delay: 0.2,
      });
      gsap.from(formRef.current.children, {
        y: 20,
        opacity: 0,
        stagger: 0.2,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.4,
      });
    }
  }, [isLoading]);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found in localStorage");
      return null;
    }
    try {
      const decoded = jwtDecode(token);
      console.log("Decoded token:", decoded);
      if (!decoded._id) {
        console.warn("Token does not contain user ID");
        return null;
      }
      return decoded._id;
    } catch (err) {
      console.error("Error decoding token:", err.message);
      return null;
    }
  };

  const getUserData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      setModalState({
        isOpen: true,
        message: "Session expired. Please log in again.",
        isSuccess: false,
      });
      localStorage.removeItem("token");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      setModalState({
        isOpen: true,
        message: "User ID not found in token. Please log in again.",
        isSuccess: false,
      });
      localStorage.removeItem("token");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Fetching profile from: ${API_URL}/profile/${userId}`);
      const response = await axios.get(`${API_URL}/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const { username, bio, profilePicture, email } =
          response.data.data || {};
        setUsername(username || "");
        setBio(bio || "");
        setEmail(email || "");
        setPreview(
          profilePicture?.startsWith("http")
            ? profilePicture
            : images.defaultProfile
        );
      }
    } catch (error) {
      console.error("Error fetching user data:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response?.status === 404) {
        const decoded = jwtDecode(token);
        setUsername(decoded.username || "");
        setEmail(decoded.email || "");
        setBio("");
        setPreview(images.defaultProfile);
        setModalState({
          isOpen: true,
          message: "No profile found. Please create your profile.",
          isSuccess: false,
        });
      } else {
        const errorMessage =
          error.response?.status === 401
            ? "Invalid or expired token. Please log in again."
            : error.response?.data?.message || "Failed to load user data.";
        setModalState({
          isOpen: true,
          message: errorMessage,
          isSuccess: false,
        });
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setModalState({
          isOpen: true,
          message: validationError,
          isSuccess: false,
        });
        setPreview(null);
        return;
      }
      setModalState({ isOpen: false, message: "", isSuccess: false });
      const newPreview = URL.createObjectURL(file);
      setPreview(newPreview);
      gsap.from(profilePicRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    }
  };

  const handleRemovePhoto = () => {
    gsap.to(profilePicRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setPreview(null);
        setModalState({ isOpen: false, message: "", isSuccess: false });
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        gsap.from(profilePicRef.current, {
          scale: 0.8,
          opacity: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)",
        });
      },
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    gsap.to(formRef.current.querySelector("button[type='submit']"), {
      scale: 0.95,
      duration: 0.2,
      ease: "power2.inOut",
    });

    const userId = getUserIdFromToken();
    if (!userId) {
      setModalState({
        isOpen: true,
        message: "User ID not found. Please log in again.",
        isSuccess: false,
      });
      navigate("/login");
      setIsSubmitting(false);
      return;
    }

    const file = fileInputRef.current?.files[0];
    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);
    formData.append("email", email);
    if (file) {
      formData.append("profilePicture", file);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        setModalState({
          isOpen: true,
          message: "Session expired. Please log in again.",
          isSuccess: false,
        });
        localStorage.removeItem("token");
        navigate("/login");
        setIsSubmitting(false);
        return;
      }

      let response;
      try {
        console.log(`Checking profile at: ${API_URL}/profile/${userId}`);
        await axios.get(`${API_URL}/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(`Updating profile at: ${API_URL}/profile/${userId}`);
        response = await axios.put(`${API_URL}profile/${userId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`Creating profile at: ${API_URL}/profile/create`);
          try {
            response = await axios.post(`${API_URL}/profile/create`, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (createError) {
            console.error(
              "Profile creation failed:",
              createError.response?.data
            );
            throw createError;
          }
        } else {
          throw error;
        }
      }

      if (response.status === 200 || response.status === 201) {
        setModalState({
          isOpen: true,
          message: "Profile saved successfully!",
          isSuccess: true,
        });
        await getUserData();
      }
    } catch (error) {
      console.error("Error saving profile:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.status === 404
          ? "Profile creation endpoint not found. Please contact support."
          : error.response?.status === 400
          ? error.response.data.message || "Invalid profile data provided."
          : error.response?.status === 401
          ? "Invalid or expired token. Please log in again."
          : error.response?.data?.message || "Failed to save profile.";
      setModalState({
        isOpen: true,
        message: errorMessage,
        isSuccess: false,
      });
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
      gsap.to(formRef.current.querySelector("button[type='submit']"), {
        scale: 1,
        duration: 0.2,
        ease: "power2.inOut",
      });
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameValid(value.length >= 3 && value.length <= 20);
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-br from-[#423fae] to-[#3a38a3]"
          : "bg-gradient-to-br from-white to-[#f0f0f0]"
      } transition-all duration-500 relative overflow-hidden pt-16 sm:pt-0 sm:flex-row`}
    >
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/20 rounded-full w-1 h-1 sm:w-2 sm:h-2 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <Sidebar />
      <main className="flex flex-col flex-1 items-center justify-start p-4 sm:p-6 md:p-8 relative z-10 w-full space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-md sm:max-w-lg">
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight ${
              isDarkMode ? "text-white" : "text-[#423fae]"
            } text-center sm:text-left mb-4 sm:mb-0`}
          >
            {t.welcome}
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[#423fae] text-white hover:bg-[#4a47b8] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#423fae]"
            aria-label={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {isDarkMode ? (
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
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
                className="w-5 h-5 sm:w-6 sm:h-6"
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

        {isLoading ? (
          <div className="flex items-center justify-center w-full max-w-md sm:max-w-lg">
            <svg
              className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-[#423fae]"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <>
            <div
              className={`w-full max-w-md sm:max-w-lg bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 ${
                isDarkMode ? "text-white" : "text-[#423fae]"
              }`}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center sm:text-left">
                Your Profile
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <img
                  src={preview || images.defaultProfile}
                  alt="Profile picture"
                  className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-2 border-white/30 object-cover mx-auto sm:mx-0"
                />
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-lg font-medium">
                    Username: {username}
                  </p>
                  <p className="text-xs sm:text-sm opacity-80">
                    Email: {email}
                  </p>
                  <p className="text-xs sm:text-sm opacity-80">
                    Bio: {bio || "No bio provided"}
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={formRef}
              className={`w-full max-w-md sm:max-w-lg bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 ${
                isDarkMode ? "text-white" : "text-[#423fae]"
              }`}
            >
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <div className="flex flex-col items-center">
                  <div
                    ref={profilePicRef}
                    className="relative h-32 w-32 sm:h-48 sm:w-48 group"
                    onMouseEnter={() =>
                      window.innerWidth >= 640 &&
                      gsap.to(profilePicRef.current, {
                        scale: 1.1,
                        duration: 0.4,
                        ease: "elastic.out(1, 0.5)",
                      })
                    }
                    onMouseLeave={() =>
                      window.innerWidth >= 640 &&
                      gsap.to(profilePicRef.current, {
                        scale: 1,
                        duration: 0.4,
                        ease: "power2.out",
                      })
                    }
                  >
                    <img
                      src={preview || images.defaultProfile}
                      alt="Profile picture"
                      className="h-32 w-32 sm:h-48 sm:w-48 rounded-full border-4 border-white/30 object-cover shadow-lg group-hover:ring-4 group-hover:ring-white/50 transition-all duration-300"
                      onClick={triggerFileInput}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && triggerFileInput()}
                      aria-label="Change profile picture"
                    />
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 rounded-full bg-[#423fae] p-2 sm:p-3 text-white shadow-md hover:bg-[#4a47b8] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#423fae]"
                      aria-label="Upload new profile picture"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-6 sm:w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 7h2l2-3h6l2 3h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
                        />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleImageChange}
                    aria-label="Profile picture upload"
                  />

                  {preview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="mt-3 sm:mt-4 rounded-lg bg-red-500 px-4 sm:px-6 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-medium hover:bg-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Remove Photo
                    </button>
                  )}
                  <span className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium opacity-80">
                    Profile Picture
                  </span>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <label
                    htmlFor="username"
                    className="text-xs sm:text-sm font-medium opacity-90"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className={`w-full rounded-lg border border-white/30 bg-white/10 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-white focus:border-white transition-all duration-300 ${
                      isDarkMode ? "text-white" : "text-[#423fae]"
                    } ${usernameValid ? "" : "border-red-400"}`}
                    placeholder="Enter your username (3-20 characters)"
                    required
                    aria-invalid={!usernameValid}
                    aria-describedby="username-error"
                  />
                  {!usernameValid && (
                    <p id="username-error" className="text-xs text-red-400">
                      Username must be 3-20 characters long
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <label
                    htmlFor="bio"
                    className="text-xs sm:text-sm font-medium opacity-90"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={`w-full rounded-lg border border-white/30 bg-white/10 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-white focus:border-white transition-all duration-300 ${
                      isDarkMode ? "text-white" : "text-[#423fae]"
                    }`}
                    rows="4"
                    placeholder="Tell us about yourself..."
                    maxLength={200}
                    aria-describedby="bio-counter"
                  />
                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 36 36">
                      <path
                        className="text-white/30"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        className="text-[#423fae]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${(bio.length / 200) * 100}, 100`}
                      />
                    </svg>
                    <p id="bio-counter" className="text-xs opacity-80">
                      {bio.length}/200 characters
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !usernameValid}
                  className={`w-full rounded-lg bg-[#423fae] text-white py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-medium transition-all duration-300 shadow-md ${
                    isSubmitting || !usernameValid
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#4a47b8]"
                  }`}
                  onMouseEnter={(e) =>
                    !isSubmitting &&
                    window.innerWidth >= 640 &&
                    gsap.to(e.target, {
                      scale: 1.05,
                      duration: 0.3,
                      ease: "power2.out",
                    })
                  }
                  onMouseLeave={(e) =>
                    !isSubmitting &&
                    window.innerWidth >= 640 &&
                    gsap.to(e.target, {
                      scale: 1,
                      duration: 0.3,
                      ease: "power2.out",
                    })
                  }
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </form>
            </div>
          </>
        )}

        <Modal
          isOpen={modalState.isOpen}
          onClose={() =>
            setModalState({ isOpen: false, message: "", isSuccess: false })
          }
          message={modalState.message}
          isSuccess={modalState.isSuccess}
        />
      </main>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); opacity: 0.3; }
            50% { transform: translateY(-20px); opacity: 0.6; }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          @media (max-width: 640px) {
            .animate-float {
              display: none; /* Hide floating dots on small screens for performance */
            }
          }
        `}
      </style>
    </div>
  );
};

export default Home;
