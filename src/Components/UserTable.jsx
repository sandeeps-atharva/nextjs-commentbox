"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  TextField,
  Select,
  MenuItem,
  Avatar,
  Box,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from "@mui/material";

import { useAuth } from "@/context/AuthContext";
import { X, Check, Edit, Plus } from "lucide-react";
import hasPermission from "@/utils/hasPermission";

import useDebounce from "@/utils/useDebounce";
import RoleMultiSelect from "@/Components/RoleMultiSelect";
import Button from "@/Components/Button";
import Pagination from "@/Components/Pagination";

const UserTable = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [roleFilters, setRoleFilters] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(5); // Make limit dynamic
  const [total, setTotal] = useState(0); // Add total count

  const debouncedSearchInput = useDebounce(searchInput, 300);

  const search =
    debouncedSearchInput.length >= 2 || debouncedSearchInput.length === 0
      ? debouncedSearchInput
      : "";

  const canManageRole = hasPermission(user, "manage_roles");
  const canManageUser = hasPermission(user, "manage_users");

  console.log("canManageUser", canManageUser);
  console.log("canManageRole", canManageRole);

  // Inline editing states
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Add user form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    role_id: null,
    isSendEmail: false,
  });

  const fetchUsers = useCallback(async () => {
    let timer;

    try {
      setError(null);

      // only show loader if it takes longer than 300ms
      timer = setTimeout(() => setLoading(true), 300);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
      });

      roleFilters.forEach((roleId) => {
        params.append("roleFilter", roleId);
      });

      const res = await fetch(`/api/admin/getuser?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();

      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, [token, page, limit, search, roleFilters]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilters, limit]); // Reset page when limit changes

  // Handle items per page change
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page
  };

  const handleDelete = useCallback(
    async (id) => {
      try {
        setActionLoading(id);
        const response = await fetch(`/api/admin/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to delete user");
        fetchUsers();
      } catch (error) {
        setError(error.message);
      } finally {
        setActionLoading(null);
      }
    },
    [fetchUsers, token]
  );

  // Start inline editing
  const handleStartEdit = (user) => {
    setEditingUserId(user.id);
    setEditFormData({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role_id: user.role_id || user.role_id,
    });
  };

  // Cancel inline editing
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({});
  };

  // Save inline edit
  const handleSaveEdit = async (userId) => {
    try {
      setActionLoading(`edit-${userId}`);
      const response = await fetch(`/api/admin/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user": JSON.stringify(user) || "{}",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error("Failed to update user");

      setEditingUserId(null);
      setEditFormData({});
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Show add user form
  const handleShowAddForm = () => {
    setShowAddForm(true);
    setAddFormData({
      firstname: "",
      lastname: "",
      email: "",
      role_id: null,
      isSendEmail: false,
    });
  };

  // Hide add user form
  const handleHideAddForm = () => {
    setShowAddForm(false);
    setAddFormData({
      firstname: "",
      lastname: "",
      email: "",
      role_id: null,
      isSendEmail: false,
    });
  };

  // Submit add user form
  const handleAddUser = async () => {
    try {
      setActionLoading("add-form");
      const response = await fetch("/api/admin/addUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user": JSON.stringify(user) || "{}",
        },
        body: JSON.stringify(addFormData),
      });

      if (!response.ok) throw new Error("Failed to add user");

      handleHideAddForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setPage(1);
  };

  const clearRoleFilter = () => {
    setRoleFilters([]);
    setPage(1);
  };

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ mt: 4 }}>
        {error}
      </Typography>
    );
  }

  return (
    <div className="mx-2">
      <div className="flex flex-col md:flex-row justify-between gap-3 items-stretch md:items-center w-full">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-1/2">
          <input
            className="px-3 py-2 border md:w-[43%] border-gray-300 dark:border-gray-600 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500"
            placeholder="Search by ID, Name, or Email (min 2 chars)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <FormControl
            size="small"
            sx={{ minWidth: 150 }}
            className="w-full sm:w-auto"
          >
            <RoleMultiSelect
              roles={roles}
              roleFilters={roleFilters}
              setRoleFilters={setRoleFilters}
            />
          </FormControl>
        </div>

        {canManageUser && (
          <button
            className="w-full sm:w-auto px-3 py-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-200 rounded-md flex items-center justify-center gap-2"
            onClick={handleShowAddForm}
          >
            <Plus size={16} />
            Add User
          </button>
        )}
      </div>

      <div className="flex flex-row gap-2 md:gap-0 py-3 justify-between items-start md:items-center w-full">
        {(search || roleFilters.length > 0) && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {search && (
              <Typography
                variant="body2"
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  backgroundColor: "primary.main",
                  color: "white",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                Search: "{search}"
                <X
                  size={14}
                  style={{ cursor: "pointer" }}
                  onClick={clearSearch}
                />
              </Typography>
            )}
            {roleFilters.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {roleFilters.map((roleId) => {
                  const role = roles.find((r) => r.id === roleId);
                  return (
                    <Typography
                      key={roleId}
                      variant="body2"
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        backgroundColor: "secondary.main",
                        color: "white",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      Role: {role?.name}
                      <X
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setRoleFilters(
                            roleFilters.filter((id) => id !== roleId)
                          )
                        }
                      />
                    </Typography>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
        {(search || roleFilters.length > 0) && (
          <Button
            variant="primary"
            onClick={() => {
              clearSearch();
              clearRoleFilter();
            }}
            style={{ minHeight: "20px" }}
          >
            <X size={15} />
          </Button>
        )}
      </div>

      {showAddForm && canManageUser && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 4 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Add New User
              </Typography>
              <Button variant="secondary" onClick={handleHideAddForm}>
                <X size={16} />
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr" },
                gap: 3,
              }}
            >
              <TextField
                label="First Name"
                value={addFormData.firstname}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, firstname: e.target.value })
                }
                fullWidth
                required
                variant="standard"
              />

              <TextField
                label="Last Name"
                value={addFormData.lastname}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, lastname: e.target.value })
                }
                fullWidth
                required
                variant="standard"
              />

              <TextField
                label="Email"
                type="email"
                value={addFormData.email}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, email: e.target.value })
                }
                fullWidth
                required
                variant="standard"
              />

              {canManageRole && (
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={addFormData.role_id || ""}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        role_id: e.target.value,
                      })
                    }
                    label="Role"
                    variant="standard"
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <FormControl sx={{ mt: 2 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={addFormData.isSendEmail}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      isSendEmail: e.target.checked,
                    })
                  }
                />
                Send invite email
              </label>
            </FormControl>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 3,
                justifyContent: "flex-end",
              }}
            >
              <Button variant="secondary" onClick={handleHideAddForm}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddUser}
                disabled={
                  actionLoading === "add-form" ||
                  !addFormData.firstname ||
                  !addFormData.lastname ||
                  !addFormData.email
                }
              >
                {actionLoading === "add-form" ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Add User"
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: 3,
          bgcolor: "background.paper",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["ID", "User", "Email", "Role", "Actions"].map((header, i) => (
                <TableCell
                  key={i}
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "background.default",
                    color: "text.primary",
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No users found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u, index) => (
                <TableRow
                  key={u.id}
                  sx={{
                    bgcolor:
                      index % 2 === 0
                        ? "background.default"
                        : "background.paper",
                    "&:hover": {
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark" ? "grey.800" : "grey.100",
                    },
                  }}
                >
                  <TableCell>{u.id}</TableCell>

                  {/* User Name - Inline editing */}
                  <TableCell>
                    {editingUserId === u.id && canManageUser ? (
                      <Box display="flex" flexDirection="row" gap={1}>
                        <TextField
                          size="small"
                          value={editFormData.firstname || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              firstname: e.target.value,
                            })
                          }
                          placeholder="First Name"
                          variant="outlined"
                          sx={{ minWidth: 50 }}
                        />
                        <TextField
                          size="small"
                          value={editFormData.lastname || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              lastname: e.target.value,
                            })
                          }
                          placeholder="Last Name"
                          variant="outlined"
                          sx={{ minWidth: 50 }}
                        />
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar src={u.profile_pic || ""}>
                          {!u.profile_pic &&
                            u.firstname?.charAt(0).toUpperCase()}
                        </Avatar>
                        <span>
                          {u.firstname} {u.lastname}
                        </span>
                      </Box>
                    )}
                  </TableCell>

                  {/* Email - Inline editing */}
                  <TableCell>
                    {editingUserId === u.id && canManageUser ? (
                      <TextField
                        size="small"
                        value={editFormData.email || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            email: e.target.value,
                          })
                        }
                        placeholder="Email"
                        variant="outlined"
                        sx={{ minWidth: 200 }}
                      />
                    ) : (
                      u.email
                    )}
                  </TableCell>

                  {/* Role - Inline editing */}
                  <TableCell>
                    {editingUserId === u.id && canManageRole ? (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={editFormData.role_id || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              role_id: e.target.value,
                            })
                          }
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        {u.role_name}
                      </Box>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex flex-row gap-2">
                      {u.id !== user?.id ? (
                        <>
                          {editingUserId === u.id ? (
                            <>
                              <Button
                                variant="primary"
                                onClick={() => handleSaveEdit(u.id)}
                                disabled={actionLoading === `edit-${u.id}`}
                              >
                                {actionLoading === `edit-${u.id}` ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <Check size={16} />
                                )}
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={handleCancelEdit}
                                disabled={actionLoading === `edit-${u.id}`}
                              >
                                <X size={16} />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={() => handleStartEdit(u)}
                              disabled={editingUserId !== null}
                            >
                              <Edit size={16} />
                            </Button>
                          )}
                          {canManageUser && editingUserId !== u.id && (
                            <Button
                              variant="danger"
                              onClick={() => handleDelete(u.id)}
                              disabled={
                                actionLoading === u.id || editingUserId !== null
                              }
                            >
                              {actionLoading === u.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          )}
                        </>
                      ) : (
                        "Logged In"
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {(users.length > 0 || search || roleFilters.length > 0) && (
        <div className="flex justify-between items-center mt-4">
          <Pagination setPage={setPage} page={page} totalPages={totalPages} />
          <div className="flex items-center gap-2">
            <label
              htmlFor="users-per-page"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Users per page
            </label>

            <select
              id="users-per-page"
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="px-3 py-[10px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
