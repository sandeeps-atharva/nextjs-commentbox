"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { login } = useAuth();
  const [status, setStatus] = useState("loading");
  const [userData, setUserData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setError("No invitation token found in URL");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/admin/verify-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, preview: true }),
        });

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setUserData(data.user);
          setError("");
        } else {
          setStatus("invalid");
          setError(data.error || "Invalid invitation token");
        }
      } catch (err) {
        console.error("Error verifying invite:", err);
        setStatus("error");
        setError("Network error while verifying invitation");
      }
    };

    verify();
  }, [token]);

  const handleAccept = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/admin/verify-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accept: true }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.token, data.user);
        alert(
          `Welcome! Your account has been created successfully.\n\nTemporary Password: ${data.tempPassword}\n\nYou can change this password in your profile settings.`
        );
        router.push("/");
      } else {
        setError(data.error || "Failed to accept invitation");
        setStatus("error");
      }
    } catch (err) {
      console.error("Accept error:", err);
      setError("Network error while accepting invitation");
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    if (confirm("Are you sure you want to reject this invitation?")) {
      router.push("/login");
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          ⏳ Verifying invitation...
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we verify your invitation token.
        </p>
      </div>
    );
  }

  // Error or invalid states
  if (status !== "success") {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
          ❌ Invalid or Expired Invite
        </h1>
        <p className="text-red-600 dark:text-red-400 mb-6">
          {error || "This invitation link is invalid or has expired."}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Please contact the administrator for a new invitation link.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          🎉 You've been invited!
        </h1>

        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-6 shadow-sm">
          <p className="text-gray-800 dark:text-gray-100">
            Hi{" "}
            <strong>
              {userData?.firstname} {userData?.lastname}
            </strong>
            ,
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            You have been invited to join as a <strong>{userData?.role}</strong>
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            Email: <strong>{userData?.email}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className={`px-6 py-3 rounded-lg font-bold text-white transition ${
              isProcessing
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            }`}
          >
            {isProcessing ? "⏳ Creating Account..." : "✅ Accept Invitation"}
          </button>

          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-6 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition"
          >
            ❌ Reject Invitation
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          By accepting this invitation, a temporary password will be assigned to
          your account. You can change it after logging in.
        </p>
      </div>
    </div>
  );
}
