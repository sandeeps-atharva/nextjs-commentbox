"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";
import { useState } from "react";
import Header from "@/Components/Header";

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const navItems = [
    { key: "comments", label: "Comments", path: "/comments" },
    { key: "users", label: "Users", path: "/users" },
  ];
  if (user?.permissions.some((p) => p === "manage_permissions")) {
    navItems.push({
      key: "permissions",
      label: "Permissions",
      path: "/permissions",
    });
  }
  return (
    <div className=" h-screen flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden mt-[75px]">
        <aside className="hidden md:flex w-80 flex-col bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white">
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.path}
                className={`block px-4 py-2 rounded-lg transition ${
                  router.pathname === item.path
                    ? "bg-gray-300 dark:bg-gray-700"
                    : "hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div
          className={`fixed inset-0 z-40 bg-black bg-opacity-40 md:hidden ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-full bg-gray-100 dark:bg-gray-800 shadow-xl flex flex-col transform transition-transform duration-300 md:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-6 py-4 flex items-center justify-between border-b">
            <span className="text-xl font-bold">CommentBox</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`block px-4 py-2 rounded-lg transition ${
                  router.pathname === item.path
                    ? "bg-gray-300 dark:bg-gray-700"
                    : "hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto scroll-width">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
