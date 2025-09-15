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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Avatar,
  Box,
  FormControl,
  InputLabel,
} from "@mui/material";
import Button from "./Button";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";
import hasPermission from "@/utils/hasPermission";
import Pagination from "./Pagination";
import useDebounce from "@/utils/useDebounce";

const UserTable = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const debouncedSearchInput = useDebounce(searchInput, 300);

  const search =
    debouncedSearchInput.length >= 2 || debouncedSearchInput.length === 0
      ? debouncedSearchInput
      : "";

  const canManageRole = hasPermission(user, "manage_roles");
  const canManageUser = hasPermission(user, "manage_users");

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    role_id: null,
    isSendEmail: false,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
        roleFilter: roleFilter,
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
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, search, roleFilter]);

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
  }, [search, roleFilter]);

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

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role_id: user.role_id || user.role_id,
    });
    setOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      role_id: null,
    });
    setOpen(true);
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      setActionLoading("form");
      const url = editingUser
        ? `/api/admin/${editingUser.id}`
        : "/api/admin/addUser";

      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user": JSON.stringify(user) || "{}",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save user");

      setOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseModal = () => {
    setOpen(false);
    setEditingUser(null);
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      role_id: null,
      isSendEmail: false,
    });
  };

  const clearSearch = () => {
    setSearchInput("");
    setPage(1);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const clearRoleFilter = () => {
    setRoleFilter("");
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
    <div className="mx-2 pt-24">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center w-full">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-md">
            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500"
              placeholder="Search by ID, Name, or Email (min 2 chars)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <span
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white flex items-center"
              >
                <X size={16} />
              </span>
            )}
          </div>

          <FormControl
            size="small"
            sx={{ minWidth: 150 }}
            className="w-full sm:w-auto"
          >
            <div className="relative">
              <select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className="w-full sm:min-w-[200px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-[11px] focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </FormControl>
        </div>

        {canManageUser && (
          <button
            variant="primary"
            className="w-full sm:w-auto px-3 py-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-200 rounded-md"
            onClick={handleAdd}
          >
            Add User
          </button>
        )}
      </div>

      <div className="flex flex-row gap-2 md:gap-0 py-3 justify-between items-start md:items-center w-full">
        {(search || roleFilter) && (
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
            {roleFilter && (
              <Typography
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
                Role: {roles.find((r) => r.id === parseInt(roleFilter))?.name}
                <X
                  size={14}
                  style={{ cursor: "pointer" }}
                  onClick={clearRoleFilter}
                />
              </Typography>
            )}
          </Box>
        )}
        {(search || roleFilter) && (
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
            {users.length === 0 ? (
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
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar src={u.profile_pic || ""}>
                        {!u.profile_pic && u.firstname?.charAt(0).toUpperCase()}
                      </Avatar>
                      <span>
                        {u.firstname} {u.lastname}
                      </span>
                    </Box>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {u.role_name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-row gap-2">
                      {u.id !== user.id ? (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => handleEdit(u)}
                            disabled={actionLoading === u.id}
                          >
                            {actionLoading === u.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              "Edit"
                            )}
                          </Button>
                          {canManageUser && (
                            <Button
                              variant="danger"
                              onClick={() => handleDelete(u.id)}
                              disabled={actionLoading === u.id}
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

      {/* Pagination - Only show if there are users or filters applied */}
      {(users.length > 0 || search || roleFilter) && (
        <div className="flex justify-between items-center mt-4">
          <Pagination setPage={setPage} page={page} totalPages={totalPages} />
        </div>
      )}

      {/* Modal */}
      <Dialog
        open={open}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          variant="subtitle1"
          fontWeight="bold"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 1,
            backgroundColor: "#f5f5f5",
            color: "black",
            fontWeight: "bold",
            fontSize: "1.25rem",
          }}
        >
          {editingUser ? "Edit User" : "Add User"}
          <Box
            component="span"
            onClick={handleCloseModal}
            sx={{
              cursor: "pointer",
              fontSize: 20,
              fontWeight: "bold",
              lineHeight: 1,
              color: "black",
            }}
          >
            ×
          </Box>
        </DialogTitle>

        <DialogContent
          className="!pt-6"
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          {canManageUser && (
            <>
              <TextField
                label="First Name"
                value={formData.firstname}
                onChange={(e) =>
                  setFormData({ ...formData, firstname: e.target.value })
                }
                fullWidth
                required
                variant="outlined"
              />
              <TextField
                label="Last Name"
                value={formData.lastname}
                onChange={(e) =>
                  setFormData({ ...formData, lastname: e.target.value })
                }
                fullWidth
                required
                variant="outlined"
              />
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                fullWidth
                required
                variant="outlined"
              />
            </>
          )}

          {canManageRole && (
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role_id}
                onChange={(e) =>
                  setFormData({ ...formData, role_id: e.target.value })
                }
                label="Role"
              >
                {roles.map((role, i) => (
                  <MenuItem key={i} value={role.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {role.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!editingUser && (
            <FormControl>
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
                  checked={formData.isSendEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, isSendEmail: e.target.checked })
                  }
                />
                Send invite email
              </label>
            </FormControl>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, backgroundColor: "grey.50" }}>
          <Button variant="primary" color="inherit" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            variant="warning"
            color="primary"
            onClick={handleSubmit}
            disabled={
              actionLoading === "form" ||
              !formData.firstname ||
              !formData.lastname ||
              !formData.email
            }
          >
            {actionLoading === "form" ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingUser ? (
              "Update"
            ) : (
              "Add"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserTable;
