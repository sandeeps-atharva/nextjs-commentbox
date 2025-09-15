"use client";

import { useAuth } from "@/context/AuthContext";
import withAuth from "@/utils/withAuth";
import AdminDashboard from "@/Components/AdminDashboard";
import CommentSection from "@/Components/CommentSection";
import Header from "@/Components/Header";

function Home() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
      </div>
    );
  }

  return (
    <>
      {user.permissions.includes("manage_roles") ||
      user.permissions.includes("manage_users") ||
      user.permissions.includes("manage_permissions") ? (
        <AdminDashboard />
      ) : (
        <>
          <Header />
          <CommentSection />
        </>
      )}
    </>
  );
}

export default withAuth(Home);
