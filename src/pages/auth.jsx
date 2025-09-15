import { useAuth } from "@/context/AuthContext";
import { Eye, EyeClosed, EyeClosedIcon, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function Auth() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: "",
    role_id: 9,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [validationErrors, setValidationErrors] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: "",
  });

  const [touched, setTouched] = useState({
    firstname: false,
    lastname: false,
    email: false,
    password: false,
    confirmPassword: false,
    avatar: false,
  });

  const router = useRouter();

  const handleChange = (e) => {
    const { name, type, files, value } = e.target;

    if (type === "file") {
      if (files[0] && files[0].size > 20 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          avatar: "Avatar must be <= 20KB",
        }));
        return;
      }
      setForm({ ...form, [name]: files[0] });
      setValidationErrors((prev) => ({ ...prev, avatar: "" }));
    } else {
      setForm({ ...form, [name]: value });

      if (!touched[name]) {
        setTouched((prev) => ({ ...prev, [name]: true }));
      }
    }
  };

  // const handleGoogleLogin = () => {
  //   window.location.href = "/api/auth/google";
  // };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const validateName = (name, label) => {
    if (!name.trim()) return `${label} is required`;
    if (name.length < 2) return `${label} must be at least 2 characters`;
    if (name.length > 20) return `${label} must be less than 20 characters`;
    if (!/^[a-zA-Z]+$/.test(name)) return `${label} can only contain letters`;
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length <= 8) return "Password must be at least 8 characters";
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

    if (touched.firstname && !isLogin) {
      newErrors.firstname = validateName(form.firstname, "First name");
    }

    if (touched.lastname && !isLogin) {
      newErrors.lastname = validateName(form.lastname, "Last name");
    }

    if (touched.email) {
      newErrors.email = validateEmail(form.email);
    }

    if (touched.password) {
      newErrors.password = validatePassword(form.password);
    }

    if (touched.confirmPassword && !isLogin) {
      newErrors.confirmPassword = validateConfirmPassword(
        form.confirmPassword,
        form.password
      );
    }

    setValidationErrors(newErrors);
  }, [form, touched, isLogin]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setForm({
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
      avatar: "",
    });
    setMessage("");
    setError("");
    setValidationErrors({
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
      avatar: "",
    });
    setTouched({
      firstname: false,
      lastname: false,
      email: false,
      password: false,
      confirmPassword: false,
      avatar: false,
    });
  };

  const isFormValid = () => {
    const emailValid = validateEmail(form.email) === "";
    const passwordValid = validatePassword(form.password) === "";

    if (isLogin) {
      return emailValid && passwordValid;
    } else {
      const firstnameValid = validateName(form.firstname, "First name") === "";
      const lastnameValid = validateName(form.lastname, "Last name") === "";
      const confirmPasswordValid =
        validateConfirmPassword(form.confirmPassword, form.password) === "";
      return (
        firstnameValid &&
        lastnameValid &&
        emailValid &&
        passwordValid &&
        confirmPasswordValid
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      firstname: true,
      lastname: true,
      email: true,
      password: true,
      confirmPassword: true,
      avatar: true,
    });

    if (!isFormValid()) {
      setError("Please fix all validation errors before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      let res;

      if (isLogin) {
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
      } else {
        const formData = new FormData();
        formData.append("firstname", form.firstname);
        formData.append("lastname", form.lastname);
        formData.append("email", form.email);
        formData.append("password", form.password);
        formData.append("role_id", form.role_id);
        if (form.avatar) formData.append("avatar", form.avatar);

        res = await fetch(endpoint, { method: "POST", body: formData });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      if (isLogin) {
        login(data.token, data.user);
        setMessage("✅ Login successful!");
      } else {
        setMessage("✅ Registered successfully!");
        setTimeout(() => setIsLogin(true), 800);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName, hasError) => {
    const baseClassName =
      "w-full border rounded-lg px-3 py-2 focus:outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100";

    if (hasError && touched[fieldName]) {
      return `${baseClassName} border-red-300 dark:border-red-500 focus:ring-2 focus:ring-red-500`;
    } else if (touched[fieldName] && !hasError) {
      return `${baseClassName} border-green-300 dark:border-green-500 focus:ring-2 focus:ring-green-500`;
    }

    return `${baseClassName} border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 w-96 space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md transition-colors ${
                isLogin
                  ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md transition-colors ${
                !isLogin
                  ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <input
                  name="firstname"
                  placeholder="First Name"
                  className={getInputClassName(
                    "firstname",
                    validationErrors.firstname
                  )}
                  value={form.firstname}
                  onChange={handleChange}
                  onBlur={() => handleBlur("firstname")}
                  required
                />
                {validationErrors.firstname && touched.firstname && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.firstname}
                  </p>
                )}
              </div>

              <div>
                <input
                  name="lastname"
                  placeholder="Last Name"
                  className={getInputClassName(
                    "lastname",
                    validationErrors.lastname
                  )}
                  value={form.lastname}
                  onChange={handleChange}
                  onBlur={() => handleBlur("lastname")}
                  required
                />
                {validationErrors.lastname && touched.lastname && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.lastname}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className={getInputClassName("email", validationErrors.email)}
              value={form.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              required
            />
            {validationErrors.email && touched.email && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className={getInputClassName(
                "password",
                validationErrors.password
              )}
              value={form.password}
              onChange={handleChange}
              onBlur={() => handleBlur("password")}
              required
            />
            <span className="absolute right-4 top-[10px] text-gray-500 hover:text-gray-700 cursor-pointer">
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
            {!isLogin && touched.password && !validationErrors.password && (
              <div className="mt-2 text-xs text-green-600">
                ✓ Password meets all requirements
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                className={getInputClassName(
                  "confirmPassword",
                  validationErrors.confirmPassword
                )}
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur("confirmPassword")}
                required
              />
              <span className="absolute right-4 top-[10px] text-gray-500 hover:text-gray-700 cursor-pointer">
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
          )}

          {!isLogin && (
            <div>
              <input
                type="file"
                name="avatar"
                onChange={handleChange}
                onBlur={() => handleBlur("avatar")}
                className={getInputClassName("avatar", validationErrors.avatar)}
                accept="image/*"
              />
              {validationErrors.avatar && touched.avatar && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.avatar}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Optional: Upload an avatar (max 20KB)
              </p>
              {/* <select
                name="role"
                className="w-full border p-2 rounded"
                onChange={handleChange}
              >
                <option value="guest">Guest</option>
                <option value="admin">Admin</option>
              </select> */}
            </div>
          )}

          {/* {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}"; "
            </div>
          )} */}

          {/* {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
              {message}
            </div>
          )} */}

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
          >
            {loading
              ? isLogin
                ? "Logging in..."
                : "Creating Account..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>
        </form>
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
        <div>
          <Link
            href={"/forgot-password"}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm"
          >
            Forgot password ?
          </Link>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={toggleMode}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            {isLogin ? "Sign up here" : "Login here"}
          </button>
        </div>
        {/* <button
          onClick={handleGoogleLogin}
          className="px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Login with Google
        </button> */}
      </div>
    </div>
  );
}
