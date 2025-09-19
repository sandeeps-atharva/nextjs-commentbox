"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function RolePermissionManager() {
  const { user, token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState(new Set());
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [],
  });
  const [editingValues, setEditingValues] = useState({});

  // Toggle expanded role for mobile view
  const toggleRoleExpansion = (roleId) => {
    setExpandedRoles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Fetch roles with permissions
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch permissions");
      const data = await res.json();
      setPermissions(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    if (user?.permissions.includes("manage_permissions") && token) {
      Promise.all([fetchRoles(), fetchPermissions()]).finally(() =>
        setLoading(false)
      );
    } else {
      setError("Access denied. Super Admin role required.");
      setLoading(false);
    }
  }, [user, token, fetchRoles, fetchPermissions]);

  const startEditRole = (role) => {
    setEditingRole(role.id);
    setEditingValues({
      [role.id]: {
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      },
    });
    setExpandedRoles((prev) => new Set([...prev, role.id]));
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditingValues({});
    fetchRoles();
  };

  const updateEditingValue = (roleId, field, value) => {
    setEditingValues((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [field]: value,
      },
    }));
  };

  const handleAddRole = async () => {
    if (!newRole.name.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRole),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create role");
      }

      setNewRole({ name: "", description: "", permissions: [] });
      setShowAddRole(false);
      setError("");
      await fetchRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateRole = async (roleId) => {
    const editingData = editingValues[roleId];
    if (!editingData?.name.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingData.name,
          description: editingData.description,
          permissions: editingData.permissions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      setEditingRole(null);
      setEditingValues({});
      setError("");
      await fetchRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete role");
      }

      setError("");
      await fetchRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePermissionForEditingRole = (roleId, permissionName) => {
    setEditingValues((prev) => {
      const currentPermissions = prev[roleId]?.permissions || [];
      const hasPermission = currentPermissions.includes(permissionName);

      return {
        ...prev,
        [roleId]: {
          ...prev[roleId],
          permissions: hasPermission
            ? currentPermissions.filter((p) => p !== permissionName)
            : [...currentPermissions, permissionName],
        },
      };
    });
  };

  const toggleNewRolePermission = (permissionName) => {
    const hasPermission = newRole.permissions.includes(permissionName);
    setNewRole((prev) => ({
      ...prev,
      permissions: hasPermission
        ? prev.permissions.filter((p) => p !== permissionName)
        : [...prev.permissions, permissionName],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className=" w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Role & Permission Manager
        </h1>
        <button
          onClick={() => setShowAddRole(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Plus size={16} />
          <span>Add Role</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">
          {error}
        </div>
      )}

      {showAddRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Add New Role
                </h2>
                <button
                  onClick={() => {
                    setShowAddRole(false);
                    setError("");
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <input
                type="text"
                placeholder="Role Name"
                value={newRole.name}
                onChange={(e) =>
                  setNewRole((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm sm:text-base"
              />

              <textarea
                placeholder="Role Description"
                value={newRole.description}
                onChange={(e) =>
                  setNewRole((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-sm sm:text-base"
                rows="3"
              />

              <div>
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                  Permissions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newRole.permissions.includes(permission.name)}
                        onChange={() =>
                          toggleNewRolePermission(permission.name)
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <span className="text-xs sm:text-sm capitalize text-gray-700 dark:text-gray-300">
                        {permission.name.replace(/_/g, " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-t dark:border-gray-700">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddRole(false);
                    setError("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  disabled={!newRole.name.trim()}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRole === role.id ? (
                      <input
                        type="text"
                        value={editingValues[role.id]?.name || role.name}
                        onChange={(e) =>
                          updateEditingValue(role.id, "name", e.target.value)
                        }
                        className="w-full text-sm font-medium text-gray-900 dark:text-gray-100 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 dark:bg-gray-700 px-2 py-1 rounded"
                        placeholder="Role name"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {role.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingRole === role.id ? (
                      <textarea
                        value={
                          editingValues[role.id]?.description ||
                          role.description
                        }
                        onChange={(e) =>
                          updateEditingValue(
                            role.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 dark:bg-gray-700 px-2 py-1 rounded resize-none"
                        placeholder="Role description"
                        rows="2"
                      />
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        {role.description || "No description"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-2 max-w-md">
                      {permissions.map((permission) => {
                        const isChecked =
                          editingRole === role.id
                            ? editingValues[role.id]?.permissions.includes(
                                permission.name
                              )
                            : role.permissions.includes(permission.name);

                        return (
                          <label
                            key={permission.id}
                            className={`flex items-center space-x-1 ${
                              editingRole === role.id
                                ? "cursor-pointer"
                                : "cursor-default"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                editingRole === role.id &&
                                togglePermissionForEditingRole(
                                  role.id,
                                  permission.name
                                )
                              }
                              disabled={editingRole !== role.id}
                              className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 ${
                                editingRole !== role.id
                                  ? "cursor-default"
                                  : "cursor-pointer"
                              }`}
                            />
                            <span className="text-xs capitalize text-gray-600 dark:text-gray-400">
                              {permission.name.replace(/_/g, " ")}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      {editingRole === role.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateRole(role.id)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Save changes"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                            title="Cancel editing"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditRole(role)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Edit role"
                          >
                            <Edit size={16} />
                          </button>

                          {user?.role !== role?.name && (
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete role"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:hidden space-y-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => !editingRole && toggleRoleExpansion(role.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  {editingRole === role.id ? (
                    <input
                      type="text"
                      value={editingValues[role.id]?.name || role.name}
                      onChange={(e) =>
                        updateEditingValue(role.id, "name", e.target.value)
                      }
                      className="w-full text-base font-medium text-gray-900 dark:text-gray-100 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 dark:bg-gray-700 px-2 py-1 rounded mb-2"
                      placeholder="Role name"
                    />
                  ) : (
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                      {role.name}
                    </h3>
                  )}

                  {editingRole === role.id ? (
                    <textarea
                      value={
                        editingValues[role.id]?.description || role.description
                      }
                      onChange={(e) =>
                        updateEditingValue(
                          role.id,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 dark:bg-gray-700 px-2 py-1 rounded resize-none"
                      placeholder="Role description"
                      rows="2"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {role.description || "No description"}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {editingRole === role.id ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateRole(role.id);
                        }}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Save changes"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                        title="Cancel editing"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditRole(role);
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Edit role"
                      >
                        <Edit size={16} />
                      </button>

                      {user?.role !== role?.name && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role.id);
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete role"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <button
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
                        title={
                          expandedRoles.has(role.id) ? "Collapse" : "Expand"
                        }
                      >
                        {expandedRoles.has(role.id) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {(expandedRoles.has(role.id) || editingRole === role.id) && (
              <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Permissions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permissions.map((permission) => {
                    const isChecked =
                      editingRole === role.id
                        ? editingValues[role.id]?.permissions.includes(
                            permission.name
                          )
                        : role.permissions.includes(permission.name);

                    return (
                      <label
                        key={permission.id}
                        className={`flex items-center space-x-2 p-2 rounded ${
                          editingRole === role.id
                            ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            : "cursor-default"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            editingRole === role.id &&
                            togglePermissionForEditingRole(
                              role.id,
                              permission.name
                            )
                          }
                          disabled={editingRole !== role.id}
                          className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0 ${
                            editingRole !== role.id
                              ? "cursor-default"
                              : "cursor-pointer"
                          }`}
                        />
                        <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                          {permission.name.replace(/_/g, " ")}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {roles.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            No roles found. Create your first role to get started.
          </div>
        </div>
      )}
    </div>
  );
}

export default RolePermissionManager;
