import { useEffect, useState } from "react";
import axios from "axios";
const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  // Update form data on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/user/login`, formData);

      if (response.status !== 200) {
        throw new Error(response.data.message || "Login failed");
      }

      localStorage.setItem("token", response.data.generateToken);

      setMessage("Login successful! Redirecting...");
      // Redirect after successful login
      window.location.href = "/chat/home";
    } catch (error) {
      console.error("Login error:", error);
      setMessage(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Login component mounted");

    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);

    if (token) {
      import("jwt-decode")
        .then((module) => {
          const decoded = module.default(token);
          console.log("Decoded JWT full payload:", decoded);
          if (decoded._id) {
            localStorage.setItem("userId", decoded._id);
          } else {
            console.log("User ID not found in token.");
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            alert("User ID not found. Please log in again.");
            window.location.href = "/login";
          }
        })
        .catch((err) => {
          console.error("Error importing jwt-decode or decoding token:", err);
        });
    } else {
      console.log("No token found in localStorage.");
    }
  }, []);

  useEffect(() => {
    console.log("test");
  });

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
          background: #ffffff;
          box-shadow: 0 10px 20px rgba(66, 63, 174, 0.2);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
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
          background: white;
          padding: 0 0.25rem;
        }
        .input-field:focus + .input-label,
        .input-field:not(:placeholder-shown) + .input-label {
          top: -0.75rem;
          left: 0.75rem;
          font-size: 0.75rem;
          color: #423fae;
        }
        .input-field {
          border: 2px solid #e5e7eb;
          color: #1f2937;
          border-radius: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
        }
        .input-field:focus {
          border-color: #423fae;
          box-shadow: 0 0 8px rgba(66, 63, 174, 0.3);
          transform: scale(1.01);
          outline: none;
        }
        .submit-button {
          position: relative;
          background: #423fae;
          color: white;
          font-weight: 700;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          cursor: pointer;
          overflow: hidden;
          transition: background-color 0.3s ease;
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
        }
        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .back-button {
          background: none;
          border: none;
          color: #423fae;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          padding: 0;
          font-size: 0.9rem;
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
          .animated-bg {
            animation: none;
            background: #423fae;
          }
          .input-field,
          .submit-button,
          .message,
          .input-label {
            transition: none;
            animation: none;
          }
          .submit-button::before {
            background: none;
          }
        }
      `}</style>

      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <form className="form-container" onSubmit={handleSubmit} noValidate>
          <h2 className="text-center font-bold text-[#423fae] text-2xl sm:text-3xl">
            Login
          </h2>

          <div className="input-container">
            <input
              type="email"
              id="email"
              name="email"
              placeholder=" "
              required
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              aria-describedby={
                message && message.toLowerCase().includes("email")
                  ? "email-error"
                  : undefined
              }
              autoComplete="email"
            />
            <label htmlFor="email" className="input-label">
              Email
            </label>
          </div>

          <div className="input-container">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder=" "
                required
                className="input-field"
                value={formData.password}
                onChange={handleChange}
                aria-describedby={
                  message && message.toLowerCase().includes("password")
                    ? "password-error"
                    : undefined
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

          <div className="flex justify-between mt-4">
            <button
              type="button"
              className="back-button"
              onClick={() => (window.location.href = "/register")}
            >
              Back to Register
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
