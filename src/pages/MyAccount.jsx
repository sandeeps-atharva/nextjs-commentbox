"use client";

import React, { useEffect, useState, useRef } from "react";
import withAuth from "@/utils/withAuth";
import { Camera, Edit3, X, User, MoveLeft } from "lucide-react";
import Button from "@/Components/Button";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ChangePassword from "@/Components/ChangePassword";

const MyAccount = () => {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    userId: null,
    avatar: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [touched, setTouched] = useState({ firstname: false, lastname: false });

  const isAdminLayout = user?.permissions?.some((permission) => [
    "manage_roles",
    "manage_users",
    "manage_permissions",
  ]);

  const handleBack = () => {
    const redirectPath = isAdminLayout ? "/comments" : "/";
    router.push(redirectPath);
  };

  useEffect(() => {
    if (user) {
      setForm({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        userId: user.id || null,
        avatar: null,
      });
      setPreviewUrl(user.profile_pic || null);
    }
  }, [user]);

  const openFileDialog = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files[0];
    if (file && file.size > 20 * 1024) {
      setError("Image size must be less than 20KB");
      setForm({ ...form, avatar: null });
      setPreviewUrl(user?.profile_pic || null);
      return;
    }
    if (file) {
      setForm({ ...form, avatar: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setForm({ ...form, avatar: null });
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpdate = async () => {
    if (!form.firstname.trim() || !form.lastname.trim()) {
      setError("First name and last name are required");
      return;
    }
    if (form.avatar && form.avatar.size > 20 * 1024) {
      setError("Image size must be less than 20KB");
      return;
    }
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("firstname", form.firstname);
      formData.append("lastname", form.lastname);
      formData.append("userId", form.userId);
      if (form.avatar) formData.append("avatar", form.avatar);

      const res = await fetch("/api/user/update", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(data.profile_pic || null);
        setError("");
      } else {
        setError(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("An error occurred while updating your profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-8 md:mx-auto mt-8 sm:mt-12 bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Banner */}
      <div className="h-3 sm:h-16 p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <Button
          onClick={handleBack}
          variant="primary"
          className="w-full sm:w-auto"
        >
          <MoveLeft size={10} /> Back
        </Button>
      </div>

      {/* Profile Section */}
      <div className="p-6 flex flex-col gap-10">
        {/* Profile Info Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <User size={18} /> Profile Information
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div
              className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 cursor-pointer transition ${
                previewUrl || user.avatar
                  ? "border-green-400 hover:border-green-500"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-gray-100 dark:bg-gray-800"
              }`}
              onClick={openFileDialog}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {previewUrl || user.avatar ? (
                <>
                  <img
                    src={previewUrl || user.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFileDialog();
                      }}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-sm"
                    >
                      <Edit3 size={16} className="text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="ml-3 p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-sm"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-300">
                  <Camera size={22} />
                  <span className="text-[11px] mt-1">Click to upload</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Info & Form */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {user.firstname} {user.lastname}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {user.email}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium dark:text-gray-200">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={form.firstname}
                    onChange={(e) =>
                      setForm({ ...form, firstname: e.target.value })
                    }
                    onBlur={() => setTouched({ ...touched, firstname: true })}
                    placeholder="First name"
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                  />
                  {touched.firstname && !form.firstname.trim() && (
                    <p className="text-red-500 text-xs mt-1">
                      First name is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium dark:text-gray-200">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.lastname}
                    onChange={(e) =>
                      setForm({ ...form, lastname: e.target.value })
                    }
                    onBlur={() => setTouched({ ...touched, lastname: true })}
                    placeholder="Last name"
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                  />
                  {touched.lastname && !form.lastname.trim() && (
                    <p className="text-red-500 text-xs mt-1">
                      Last name is required
                    </p>
                  )}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

              <div className="flex flex-row justify-end gap-3 mt-8">
                <Button
                  onClick={handleUpdate}
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={
                    !form.firstname.trim() ||
                    !form.lastname.trim() ||
                    !!error ||
                    loading
                  }
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <ChangePassword />
      </div>
    </div>
  );
};

export default withAuth(MyAccount);
