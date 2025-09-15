"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ResetPassword() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const params = useParams();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 9) return "Password must be at least 9 characters";
    if (password.length > 15) return "Password must be less than 15 characters";
    if (!/(?=.*[a-z])/.test(password))
      return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password))
      return "Password must contain at least one number";
    if (!/(?=.*[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?])/.test(password))
      return "Password must contain at least one special character";
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  useEffect(() => {
    const newErrors = { ...validationErrors };
    if (touched.password) {
      newErrors.password = validatePassword(form.password);
    }
    if (touched.confirmPassword) {
      newErrors.confirmPassword = validateConfirmPassword(
        form.confirmPassword,
        form.password
      );
    }
    setValidationErrors(newErrors);
  }, [form, touched]);

  const isFormValid = () => {
    const passwordValid = validatePassword(form.password) === "";
    const confirmPasswordValid =
      validateConfirmPassword(form.confirmPassword, form.password) === "";
    return passwordValid && confirmPasswordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });

    if (!isFormValid()) {
      setError("Please fix all validation errors before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password reset failed");

      setMessage("✅ " + data.message);
      setTimeout(() => router.push("/auth"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName, hasError) => {
    const baseClassName =
      "w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";

    if (hasError && touched[fieldName]) {
      return `${baseClassName} border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500`;
    } else if (touched[fieldName] && !hasError) {
      return `${baseClassName} border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500`;
    }

    return `${baseClassName} border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-96 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter new password"
              className={getInputClassName(
                "password",
                validationErrors.password
              )}
              value={form.password}
              onChange={handleChange}
              onBlur={() => handleBlur("password")}
              required
            />
            <span className="absolute right-4 top-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
              {showPassword ? (
                <EyeOff
                  size={20}
                  onClick={() => setShowPassword(!showPassword)}
                />
              ) : (
                <Eye size={20} onClick={() => setShowPassword(!showPassword)} />
              )}
            </span>
            {validationErrors.password && touched.password && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.password}
              </p>
            )}
            {touched.password &&
              !validationErrors.password &&
              form.password && (
                <div className="mt-2 text-xs text-green-600">
                  ✓ Password meets all requirements
                </div>
              )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm new password"
              className={getInputClassName(
                "confirmPassword",
                validationErrors.confirmPassword
              )}
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur("confirmPassword")}
              required
            />
            <span className="absolute right-4 top-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
              {showConfirmPassword ? (
                <EyeOff
                  size={20}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              ) : (
                <Eye
                  size={20}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}
            </span>
            {validationErrors.confirmPassword && touched.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.confirmPassword}
              </p>
            )}
            {!validationErrors.confirmPassword &&
              touched.confirmPassword &&
              form.confirmPassword &&
              form.password && (
                <div className="mt-2 text-xs text-green-600">
                  ✓ Passwords match
                </div>
              )}
          </div>

          {/* Errors & Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm text-center">
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center">
          <Link
            href={"/auth"}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
