"use client";
import { useState } from "react";
import CommentSection from "./CommentSection";
import UserTable from "./UserTable";
import Header from "./Header";
import RolePermissionManager from "./RolePermissionManager";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [{ key: "comments", label: "Comments" }];
  if (
    user.permissions.includes("manage_users") ||
    user.permissions.includes("manage_roles")
  ) {
    navItems.push({ key: "users", label: "Users" });
  }
  if (user.permissions.includes("manage_permissions")) {
    navItems.push({ key: "permissions", label: "Permissions" });
  }

  return (
    <div className="flex h-screen">
      <aside className="hidden md:flex w-64 flex-col bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white transition-colors">
        <div className="px-6 py-[19px] text-2xl font-bold border-b border-gray-300 dark:border-gray-700">
          CommentBox
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                activeTab === item.key
                  ? "bg-gray-300 dark:bg-gray-700"
                  : "hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white shadow-xl flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-300 dark:border-gray-700">
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
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    activeTab === item.key
                      ? "bg-gray-300 dark:bg-gray-700"
                      : "hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors overflow-y-auto">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {activeTab === "users" && <UserTable />}
        {activeTab === "comments" && <CommentSection />}
        {activeTab === "permissions" && <RolePermissionManager />}
      </main>
    </div>
  );
}

export default AdminDashboard;
