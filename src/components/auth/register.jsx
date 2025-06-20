import { useState, useEffect } from "react";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  // Validation rules
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "username":
        if (!value) {
          newErrors.username = "Username is required";
        } else if (value.length < 3) {
          newErrors.username = "Username must be at least 3 characters long";
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username =
            "Username can only contain letters, numbers, and underscores";
        } else {
          delete newErrors.username;
        }
        break;
      case "email":
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 8) {
          newErrors.password = "Password must be at least 8 characters long";
        } else if (
          !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            value
          )
        ) {
          newErrors.password =
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
        } else {
          delete newErrors.password;
        }
        break;
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (value !== formData.password) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      default:
        break;
    }

    return newErrors;
  };

  // Real-time validation
  useEffect(() => {
    const validationErrors = Object.keys(formData).reduce((acc, key) => {
      return { ...acc, ...validateField(key, formData[key]) };
    }, {});
    setErrors(validationErrors);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Check for any validation errors
    const validationErrors = Object.keys(formData).reduce((acc, key) => {
      return { ...acc, ...validateField(key, formData[key]) };
    }, {});

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMessage("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/user/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (!(response.status >= 200 && response.status < 300)) {
        throw new Error(response.data.message || "Registration failed");
      }

      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      console.error("Error during registration:", error);
      const errorMsg =
        error.response?.data?.message &&
        !error.message.toLowerCase().includes("successful")
          ? error.response.data.message
          : error.message || "Registration failed. Please try again.";
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

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
        }
        .input-field:focus + .input-label,
        .input-field:not(:placeholder-shown) + .input-label {
          top: -0.75rem;
          left: 0.75rem;
          font-size: 0.75rem;
          color: #423fae;
          background: #ffffff;
          padding: 0 0.25rem;
        }
        .input-field {
          border: 2px solid #e5e7eb;
          color: #1f2937;
          transition: all 0.3s ease;
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          outline: none;
        }
        .input-field.error {
          border-color: #dc2626;
          box-shadow: 0 0 8px rgba(220, 38, 38, 0.3);
        }
        .input-field:focus {
          border-color: #423fae;
          box-shadow: 0 0 8px rgba(66, 63, 174, 0.3);
          transform: scale(1.01);
        }
        .error-message {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          animation: slideIn 0.3s ease;
        }
        .submit-button {
          position: relative;
          background: #423fae;
          overflow: hidden;
          color: white;
          font-weight: bold;
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          background-size: 200%;
          transition: background-position 0.5s ease;
          pointer-events: none;
        }
        .submit-button:hover::before {
          animation: shine 1s ease;
        }
        .submit-button:hover {
          background: #5c4fd8;
        }
        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .back-button {
          position: relative;
          color: #423fae;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem 1rem;
        }
        .back-button::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -2px;
          left: 0;
          background: #423fae;
          transition: width 0.3s ease;
        }
        .back-button:hover::after {
          width: 100%;
        }
        .message {
          animation: slideIn 0.5s ease forwards;
          text-align: center;
          margin-top: 0.5rem;
          word-break: break-word;
        }
        @media (max-width: 640px) {
          .form-container {
            padding: 1.5rem;
          }
          .input-label {
            left: 0.75rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animated-bg,
          .input-field,
          .submit-button,
          .message,
          .input-label,
          .error-message {
            transition: none;
            animation: none;
          }
          .submit-button::before {
            background: none;
          }
        }
      `}</style>
      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <form
          className="w-full max-w-md flex flex-col gap-4 p-6 form-container rounded-xl sm:p-8"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2 className="text-center font-bold text-[#423fae] text-2xl sm:text-3xl">
            Register
          </h2>
          <div className="input-container">
            <input
              type="text"
              id="username"
              name="username"
              placeholder=" "
              className={`input-field ${errors.username ? "error" : ""}`}
              onChange={handleChange}
              value={formData.username}
              aria-describedby={errors.username ? "username-error" : undefined}
              aria-invalid={!!errors.username}
            />
            <label htmlFor="username" className="input-label">
              Username
            </label>
            {errors.username && (
              <div id="username-error" className="error-message">
                {errors.username}
              </div>
            )}
          </div>
          <div className="input-container">
            <input
              type="email"
              id="email"
              name="email"
              placeholder=" "
              className={`input-field ${errors.email ? "error" : ""}`}
              onChange={handleChange}
              value={formData.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
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
                className={`input-field ${errors.password ? "error" : ""}`}
                onChange={handleChange}
                value={formData.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                aria-invalid={!!errors.password}
              />
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
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
          <div className="input-container">
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder=" "
                className={`input-field ${
                  errors.confirmPassword ? "error" : ""
                }`}
                onChange={handleChange}
                value={formData.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
                aria-invalid={!!errors.confirmPassword}
              />
              <label htmlFor="confirmPassword" className="input-label">
                Confirm Password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#423fae] hover:text-[#5c4fd8] text-sm"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <div id="confirm-password-error" className="error-message">
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {message && (
            <div
              id="form-error"
              className={`message text-sm ${
                message.toLowerCase().includes("successful")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex justify-between gap-4 mt-4">
            <button
              type="button"
              className="back-button"
              onClick={() => (window.location.href = "/login")}
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={isLoading || Object.keys(errors).length > 0}
              className={`submit-button ${
                isLoading || Object.keys(errors).length > 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Register;
