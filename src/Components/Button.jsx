export default function Button({
  children,
  onClick,
  disabled = false,
  variant = "default",
  className = "",
}) {
  const base =
    "px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1";

  const variants = {
    default:
      "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200",
    primary:
      "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-200",
    danger:
      "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200",
    warning:
      "bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900 dark:hover:bg-amber-800 dark:text-amber-200",
    cancel:
      "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200",
    link: "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-200 dark:hover:bg-indigo-900",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
