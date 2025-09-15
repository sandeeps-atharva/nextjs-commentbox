"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback } from "react";

export default function Pagination({ totalPages, page, setPage }) {
  const handleClick = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages, setPage]
  );

  return (
    <div className="flex justify-center px-3 py-2  gap-2">
      <button
        onClick={() => handleClick(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 rounded-lg text-sm 
          bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50
          dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      >
        <ChevronLeft />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          onClick={() => handleClick(num)}
          className={`px-3 py-1 rounded-lg text-sm 
            ${
              page === num
                ? "bg-indigo-500 text-white dark:bg-indigo-400"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
        >
          {num}
        </button>
      ))}
      <button
        onClick={() => handleClick(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1 rounded-lg text-sm 
          bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50
          dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
