import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-white dark:bg-gray-900 transition-colors">
      <h1 className="text-6xl font-bold mb-4 text-gray-900 dark:text-white">
        404
      </h1>
      <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
        Page Not Found
      </h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Sorry, the requested resource could not be found.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Return Home
      </Link>
    </div>
  );
}
