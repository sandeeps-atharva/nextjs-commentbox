"use client";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [validationError, setValidationError] = useState("");
  const [touched, setTouched] = useState(false);

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return "Please enter a valid email address";
    return "";
  };

  useEffect(() => {
    if (touched) {
      setValidationError(validateEmail(email));
    }
  }, [email, touched]);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (!touched) {
      setTouched(true);
    }
    if (error) setError("");
    if (message) setMessage("");
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const isFormValid = () => {
    return validateEmail(email) === "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched(true);

    if (!isFormValid()) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage("✅ Password reset link sent! Check your email inbox.");
      } else {
        throw new Error(data.message || "Failed to send reset link");
      }
    } catch (err) {
      setError(err.message);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = () => {
    const baseClassName =
      "w-full border rounded-lg px-3 py-2 pl-10 focus:outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100";

    if (validationError && touched) {
      return `${baseClassName} border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500`;
    } else if (touched && !validationError && email) {
      return `${baseClassName} border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500`;
    }

    return `${baseClassName} border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`;
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 w-96 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              We've sent a password reset link to
            </p>
            <p className="font-medium text-indigo-600 mt-1">{email}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Didn't receive the email?</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure the email address is correct</li>
              <li>• Wait a few minutes for delivery</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail("");
                setTouched(false);
                setMessage("");
                setError("");
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Try Different Email
            </button>

            <button
              onClick={() => router.push("/auth")}
              className="w-full text-indigo-600 hover:text-indigo-400 font-medium flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 w-96 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-3">
              <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Forgot Password?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            No worries! Enter your email address and we'll send you a reset
            link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-[10px] w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="email"
              placeholder="Enter your email address"
              className={getInputClassName()}
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={loading}
            />
            {validationError && touched && (
              <p className="mt-1 text-sm text-red-600">{validationError}</p>
            )}
            {!validationError && touched && email && (
              <div className="mt-2 text-xs text-green-600">
                ✓ Valid email address
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm text-center">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <>
                <Mail size={16} />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/auth")}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm flex items-center justify-center space-x-2 w-full"
            disabled={loading}
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
