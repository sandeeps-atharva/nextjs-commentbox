"use client";
import React, { useState } from "react";
import withAuth from "@/utils/withAuth";
import { Eye, EyeOff, Lock } from "lucide-react";
import Button from "@/Components/Button";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

const ChangePassword = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({ current: "", new: "", confirm: "" });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: "", success: "" });

  const handleBack = () => {
    router.push(
      user?.permissions?.includes("manage_users")
        ? "/admin/dashboard"
        : "/account"
    );
  };

  const handleChangePassword = async () => {
    setMsg({ error: "", success: "" });

    if (!form.current || !form.new || !form.confirm) {
      return setMsg({ error: "All fields are required" });
    }
    if (form.new !== form.confirm) {
      return setMsg({ error: "New passwords do not match" });
    }
    if (form.current === form.new) {
      return setMsg({ error: "New password must be different" });
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.current,
          newPassword: form.new,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ success: data.message || "Password changed successfully!" });
        setForm({ current: "", new: "", confirm: "" });
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/auth");
        }, 2000);
      } else {
        setMsg({ error: data.message || "Failed to change password" });
      }
    } catch (e) {
      setMsg({ error: "Something went wrong, try again." });
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
        <Lock size={18} /> Change Password
      </h2>

      <div className="space-y-4">
        {["current", "new", "confirm"].map((field) => (
          <div key={field} className="flex flex-col">
            <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300 capitalize">
              {field === "confirm" ? "Confirm Password" : `${field} Password`}
            </label>
            <div className="relative">
              <input
                type={show[field] ? "text" : "password"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={`Enter ${field} password`}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => toggleShow(field)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show[field] ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      {msg.error && <p className="text-red-500 text-sm mt-3">{msg.error}</p>}
      {msg.success && (
        <p className="text-green-500 text-sm mt-3">{msg.success}</p>
      )}

      <div className="flex gap-3 mt-6 justify-end">
        <Button
          onClick={handleChangePassword}
          variant="primary"
          className="px-4 py-2"
          disabled={loading}
        >
          {loading ? "Changing..." : "Change Password"}
        </Button>
      </div>
    </div>
  );
};

export default withAuth(ChangePassword);
