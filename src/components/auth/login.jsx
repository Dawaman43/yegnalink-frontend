import { useEffect, useState } from "react";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update form data on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/user/login`, formData);

      if (!(response.status >= 200 && response.status < 300)) {
        throw new Error(response.data.message || "Login failed");
      }

      localStorage.setItem("token", response.data.generateToken);

      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/chat/home";
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg =
        error.response?.data?.message &&
        !error.message.toLowerCase().includes("successful")
          ? error.response.data.message
          : error.message || "Login failed. Please try again.";
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      import("jwt-decode")
        .then((module) => {
          try {
            const decoded = module.default(token);
            if (decoded._id) {
              localStorage.setItem("userId", decoded._id);
              window.location.href = "/chat/home";
            } else {
              throw new Error("Invalid token");
            }
          } catch (err) {
            console.error("Token validation error:", err);
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            setMessage("Invalid session. Please log in again.");
          }
        })
        .catch((err) => {
          console.error("Error importing jwt-decode:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          setMessage("Session error. Please log in again.");
        });
    }
  }, []);

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slideIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shine {
          0% { background-position: -200%; }
          100% { background-position: 200%; }
        }
        .animated-bg {
          background: linear-gradient(135deg, #2e2b7a, #423fae, #5c4fd8);
          background-size: 200% 200%;
          animation: gradientShift 15s ease infinite;
        }
        .form-container {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 20px rgba(66, 63, 174, 0.2);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
          backdrop-filter: blur(10px);
        }
        .input-container {
          position: relative;
          margin-bottom: 1.5rem;
        }
        .input-label {
          position: absolute;
          left: 1rem;
          top: 0.75rem;
          color: #6b7280;
          transition: all 0.3s ease;
          pointer-events: none;
          font-size: 0.9rem;
          background: transparent;
          padding: 0 0.25rem;
        }
        .input-field:focus + .input-label,
        .input-field:not(:placeholder-shown) + .input-label {
          top: -0.75rem;
          left: 0.75rem;
          font-size: 0.7rem;
          color: #423fae;
          background: #ffffff;
          padding: 0 0.25rem;
        }
        .input-field {
          border: 2px solid #e5e7eb;
          color: #1f2937;
          border-radius: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          outline: none;
        }
        .input-field:focus {
          border-color: #423fae;
          box-shadow: 0 0 8px rgba(66, 63, 174, 0.3);
          transform: scale(1.01);
        }
        .input-field-error {
          border-color: #ef4444;
        }
        .submit-button {
          position: relative;
          background: #423fae;
          color: white;
          font-weight: 600;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          border: none;
        }
        .submit-button::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          background-size: 200%;
          transition: background-position 0.5s ease;
          pointer-events: none;
        }
        .submit-button:hover::before {
          animation: shine 1s ease forwards;
        }
        .submit-button:hover {
          background: #5c4fd8;
          transform: translateY(-2px);
        }
        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .back-button {
          background: none;
          border: none;
          color: #423fae;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .back-button::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0;
          height: 2px;
          background: #423fae;
          transition: width 0.3s ease;
        }
        .back-button:hover::after {
          width: 100%;
        }
        .message {
          animation: slideIn 0.5s ease forwards;
          text-align: center;
          font-size: 0.9rem;
          word-break: break-word;
        }
        .error-message {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        @media (max-width: 640px) {
          .form-container {
            padding: 1.5rem;
          }
          .input-field {
            padding: 0.75rem;
          }
          .input-label {
            left: 0.75rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animated-bg, .input-field, .submit-button, .message, .input-label, .back-button {
            transition: none;
            animation: none;
          }
          .submit-button::before {
            background: none;
          }
        }
      `}</style>

      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <div className="form-container">
          <h2 className="text-center font-bold text-[#423fae] text-2xl sm:text-3xl mb-6">
            Sign In
          </h2>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="input-container">
              <input
                type="email"
                id="email"
                name="email"
                placeholder=" "
                required
                className={`input-field ${
                  errors.email ? "input-field-error" : ""
                }`}
                value={formData.email}
                onChange={handleChange}
                aria-describedby={errors.email ? "email-error" : undefined}
                autoComplete="email"
                autoFocus
              />
              <label htmlFor="email" className="input-label">
                Email
              </label>
              {errors.email && (
                <div id="email-error" className="error-message">
                  {errors.email}
                </div>
              )}
            </div>

            <div className="input-container">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder=" "
                  required
                  className={`input-field ${
                    errors.password ? "input-field-error" : ""
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  autoComplete="current-password"
                />
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#423fae] hover:text-[#5c4fd8] text-sm"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <div id="password-error" className="error-message">
                  {errors.password}
                </div>
              )}
            </div>

            {message && (
              <div
                id="form-error"
                className={`message ${
                  message.toLowerCase().includes("successful")
                    ? "text-green-600"
                    : "text-red-600"
                } mt-2`}
              >
                {message}
              </div>
            )}

            <div className="flex justify-between mt-6 gap-4">
              <button
                type="button"
                className="back-button"
                onClick={() => (window.location.href = "/register")}
              >
                Create Account
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            <button
              type="button"
              className="back-button"
              onClick={() => (window.location.href = "/")}
            >
              Go to home
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
