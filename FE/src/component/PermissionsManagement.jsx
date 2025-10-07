import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
  Box,
  Alert,
  Snackbar,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Edit, Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import { fetchWithAuth } from "../services/authService";

const PermissionsManagement = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const permissions = [
    {
      "id": "d8b6e42d-59f9-4462-97f3-70870188dfcd",
      "name": "ag.manage",
      "description": "Quản lý AG",
      "resource": "ag",
      "resourceDisplayName": "AG",
    },
    {
      "id": "19b33d3c-0f63-4369-b0c4-efe59d2ebe66",
      "name": "masothe.manage",
      "description": "Quản lý mã số thẻ",
      "resource": "masothe",
      "displayName": "Quản lý mã số thẻ",
      "resourceDisplayName": "Mã số thẻ",
    },
    {
      "id": "ddb09dfc-066e-4299-a839-99838724263e",
      "name": "agodaaccount.manage",
      "description": "Quản lý tài khoản Agoda",
      "resource": "agodaaccount",
      "displayName": "Quản lý tài khoản Agoda",
      "resourceDisplayName": "Tài khoản Agoda",
    },
    {
      "id": "cc7b0d30-8d9c-4294-acb1-1c94c23ad4d2",
      "name": "tripaccount.manage",
      "description": "Quản lý tài khoản Trip",
      "resource": "tripaccount",
      "displayName": "Quản lý tài khoản Trip",
      "resourceDisplayName": "Tài khoản Trip",
    },
    {
      "id": "gmailaccount-manage-id",
      "name": "gmailaccount.manage",
      "description": "Quản lý Gmail",
      "resource": "gmailaccount",
      "displayName": "Quản lý Gmail",
      "resourceDisplayName": "Gmail",
    },
    {
      "id": "52e35eda-5b82-4271-8bb8-24141f05b8a5",
      "name": "users.manage",
      "description": "Quản lý người dùng",
      "resource": "users",
      "displayName": "Quản lý người dùng",
      "resourceDisplayName": "Người dùng",
    },
    {
      "id": "2d4f0949-c64c-4c7b-917d-ecfa1a1ba859",
      "name": "permissions.manage",
      "description": "Quản lý quyền hạn",
      "resource": "permissions",
      "displayName": "Quản lý quyền hạn",
      "resourceDisplayName": "Quyền hạn",
    },
  ];
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({
    email: "",
    password: "",
    isActive: true,
  });
  const [userPermissions, setUserPermissions] = useState({});
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const openSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const result = await fetchWithAuth("/User/list", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }, openSnackbar);

      // Handle the new API response structure
      if (result && result.users) {
        setUsers(result.users);
        setTotalUsers(result.totalUsers || result.users.length);
      } else {
        setUsers(result || []);
        setTotalUsers(result?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      openSnackbar("Có lỗi xảy ra khi tải danh sách người dùng.", "error");
    }
  }, [openSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      openSnackbar("Vui lòng điền đầy đủ thông tin.", "warning");
      return;
    }

    try {
      const selectedPermissionNames = Object.keys(selectedPermissions).filter(name => selectedPermissions[name]);

      const createPayload = {
        ...newUser,
        permissionNames: selectedPermissionNames
      };

      await fetchWithAuth("/User/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      }, openSnackbar);

      openSnackbar("Tạo tài khoản thành công!", "success");
      setNewUser({ email: "", password: "" });
      setSelectedPermissions({});
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      openSnackbar("Có lỗi xảy ra khi tạo tài khoản.", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      return;
    }

    try {
      await fetchWithAuth(`/User/delete/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }, openSnackbar);
      openSnackbar("Xóa tài khoản thành công!", "success");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      openSnackbar("Có lỗi xảy ra khi xóa tài khoản.", "error");
    }
  };

  const handleEditUser = async (user) => {
    setEditingUser(user);
    setEditUserData({
      email: user.email,
      password: "",
      isActive: user.isActive,
    });
    // Set current user permissions
    const currentPermissions = {};
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach(permission => {
        currentPermissions[permission.name] = true;
      });
    }
    setUserPermissions(currentPermissions);
    setEditUserOpen(true);
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;

    if (!editUserData.email) {
      openSnackbar("Vui lòng nhập email.", "warning");
      return;
    }

    try {
      const selectedPermissionNames = Object.keys(userPermissions).filter(name => userPermissions[name]);

      const updatePayload = {
        userId: editingUser.userId,
        email: editUserData.email,
        isActive: editUserData.isActive,
        permissionNames: selectedPermissionNames
      };

      // Only include password if it's provided
      if (editUserData.password && editUserData.password.trim()) {
        updatePayload.password = editUserData.password;
      }

      await fetchWithAuth("/User/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      }, openSnackbar);

      openSnackbar("Cập nhật tài khoản thành công!", "success");
      setEditUserOpen(false);
      setEditingUser(null);
      setEditUserData({ email: "", password: "", isActive: true });
      setUserPermissions({});
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      openSnackbar("Có lỗi xảy ra khi cập nhật tài khoản.", "error");
    }
  };

  const handlePermissionChange = (permissionName, checked, isEditMode = false) => {
    if (isEditMode) {
      setUserPermissions(prev => ({
        ...prev,
        [permissionName]: checked
      }));
    } else {
      setSelectedPermissions(prev => ({
        ...prev,
        [permissionName]: checked
      }));
    }
  };

  const getUserPermissionNames = (user) => {
    if (!user.permissions || !Array.isArray(user.permissions)) return [];
    return user.permissions.map(permission => permission.description || permission.name);
  };

  // Component for permission tags - display all tags without +N
  const PermissionTags = ({ user }) => {
    const userPermissions = getUserPermissionNames(user);

    if (userPermissions.length === 0) {
      return (
        <span style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
          Chưa có quyền
        </span>
      );
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {userPermissions.map((permName, index) => (
          <span
            key={index}
            style={{
              backgroundColor: "#e0f2fe",
              color: "#0369a1",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: "12px",
              fontWeight: "500",
              border: "1px solid #bae6fd",
              whiteSpace: "nowrap",
            }}
          >
            {permName}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        className="section-title"
        style={{
          margin: "0 0 24px 0",
          color: "#1e293b",
          fontSize: "28px",
          fontWeight: "700",
        }}
      >
        Quản lý tài khoản và phân quyền
      </Typography>

      {/* Create User Section */}
      <div style={{ padding: "20px" }}>
        <div
          style={{
            width: "100%",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            border: "1px solid #e2e8f0",
            margin: "16px 0",
            background: "white",
          }}
        >
          <div style={{ padding: "20px" }}>
            <Typography
              variant="h6"
              gutterBottom
              style={{
                margin: "0 0 16px 0",
                color: "#1e293b",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              Tạo tài khoản mới
            </Typography>

            <div style={{ margin: "16px 0" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Nhập email"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 15,
                      background: "#f9fafb",
                      outline: "none",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "border-color 0.2s",
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <input
                    type="text"
                    value={newUser.userName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="Nhập tên tài khoản"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 15,
                      background: "#f9fafb",
                      outline: "none",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "border-color 0.2s",
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Nhập mật khẩu"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        paddingRight: "45px",
                        border: "1.5px " +
                          "solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: 15,
                        background: "#f9fafb",
                        outline: "none",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        transition: "border-color 0.2s",
                      }}
                    />
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        padding: "4px",
                      }}
                    >
                      {showPassword ? <VisibilityOff size={18} /> : <Visibility size={18} />}
                    </IconButton>
                  </div>
                </Grid>
              </Grid>
            </div>

            <Typography
              variant="h6"
              gutterBottom
              style={{
                margin: "24px 0 12px 0",
                color: "#1e293b",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Chọn quyền hạn
            </Typography>

            <div
              style={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                padding: "16px",
                margin: "12px 0",
              }}
            >
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px"
              }}>
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      backgroundColor: "white",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f1f5f9";
                      e.target.style.borderColor = "rgb(59, 130, 246)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "white";
                      e.target.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions[permission.name] || false}
                      onChange={(e) => handlePermissionChange(permission.name, e.target.checked, false)}
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "rgb(59, 130, 246)",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{
                      color: "#374151",
                      fontWeight: "500",
                      flex: 1,
                    }}>
                      {permission.description}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      backgroundColor: "#f3f4f6",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontWeight: "500",
                    }}>
                      {permission.resourceDisplayName}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <Button
                onClick={handleCreateUser}
                style={{
                  backgroundColor: "#4caf50",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "none",
                  border: "none",
                  cursor: "pointer",
                  minWidth: 140,
                }}
              >
                Tạo tài khoản
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <Typography
            variant="h6"
            gutterBottom
            className="section-title"
            style={{
              margin: "0",
              color: "#1e293b",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            Danh sách tài khoản
          </Typography>
          <div style={{
            backgroundColor: "#e0f2fe",
            color: "#0369a1",
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: "14px",
            fontWeight: "600",
            border: "1px solid #bae6fd",
          }}>
            Tổng số: {totalUsers} tài khoản
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <Button
            onClick={fetchUsers}
            style={{
              backgroundColor: "rgb(59, 130, 246)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "none",
              border: "none",
              cursor: "pointer",
              minWidth: 120,
            }}
          >
            Làm mới
          </Button>
        </div>

        <div
          style={{
            width: "100%",
            overflowX: "auto",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            border: "1px solid #e2e8f0",
            margin: "16px 0",
            maxHeight: 500,
            overflowY: "auto",
          }}
        >
          <table
            style={{
              minWidth: 800,
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              background: "white",
            }}
          >
            <thead>
              <tr>
                <th style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  borderBottom: "2px solid #e2e8f0",
                  padding: "12px 20px",
                  background: "#f8fafc",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#374151",
                }}>
                  Email
                </th>
                <th style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  borderBottom: "2px solid #e2e8f0",
                  padding: "12px 20px",
                  background: "#f8fafc",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#374151",
                }}>
                  Tên tài khoản
                </th>
                <th style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  borderBottom: "2px solid #e2e8f0",
                  padding: "12px 20px",
                  background: "#f8fafc",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#374151",
                }}>
                  Vai trò
                </th>
                <th style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  borderBottom: "2px solid #e2e8f0",
                  padding: "12px 20px",
                  background: "#f8fafc",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#374151",
                }}>
                  Quyền hạn
                </th>
                <th style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  borderBottom: "2px solid #e2e8f0",
                  padding: "12px 20px",
                  background: "#f8fafc",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#374151",
                }}>
                  Trạng thái
                </th>
                <th style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  borderBottom: "2px solid #e2e8f0",
                  padding: "12px 20px",
                  background: "#f8fafc",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#374151",
                }}>
                  Ngày tạo
                </th>
                <th style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 4,
                  borderBottom: "2px solid #e2e8f0",
                  padding: "12px 20px",
                  background: "#f8fafc",
                  textAlign: "center",
                  fontWeight: "600",
                  color: "#374151",
                }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, rowIndex) => (
                <tr
                  key={user.userId}
                  style={{
                    background: rowIndex % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  <td style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px 20px",
                    fontSize: "14px",
                  }}>
                    {user.email}
                  </td>
                  <td style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px 20px",
                    fontSize: "14px",
                  }}>
                    {user.userName || 'N/A'}
                  </td>
                  <td style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px 20px",
                    fontSize: "14px",
                  }}>
                    <span style={{
                      backgroundColor: user.role?.type === 1 ? "#fef3c7" : "#e0f2fe",
                      color: user.role?.type === 1 ? "#92400e" : "#0369a1",
                      padding: "4px 8px",
                      borderRadius: 12,
                      fontSize: "12px",
                      fontWeight: "500",
                      border: user.role?.type === 1 ? "1px solid #fbbf24" : "1px solid #bae6fd",
                    }}>
                      {user.role?.typeName || 'N/A'}
                    </span>
                  </td>
                  <td style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px 20px",
                    fontSize: "14px",
                    maxWidth: "250px", // Set maximum width for permissions column
                  }}>
                    <PermissionTags user={user} />
                  </td>
                  <td style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px 20px",
                    fontSize: "14px",
                  }}>
                    <span style={{
                      backgroundColor: user.isActive ? "#dcfce7" : "#fee2e2",
                      color: user.isActive ? "#166534" : "#991b1b",
                      padding: "4px 8px",
                      borderRadius: 12,
                      fontSize: "12px",
                      fontWeight: "500",
                      border: user.isActive ? "1px solid #bbf7d0" : "1px solid #fecaca",
                    }}>
                      {user.isActive ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                  <td style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px 20px",
                    fontSize: "14px",
                  }}>
                    {user.createdTime ? new Date(user.createdTime).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td style={{
                    borderBottom: "1px solid #e2e8f0",
                    padding: "12px 20px",
                    textAlign: "center",
                  }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      {((window.Permissions?.roleType === 2 && user.role?.type !== 1) || window.Permissions?.roleType === 1) && (
                        <button
                          onClick={() => handleEditUser(user)}
                          style={{
                            backgroundColor: "rgb(59, 130, 246)",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "background-color 0.2s",
                          }}
                          title="Chỉnh sửa tài khoản"
                        >
                          <Edit style={{ fontSize: 16 }} />
                        </button>
                      )}

                      {user.role?.type !== 1 && (
                        <button
                          onClick={() => handleDeleteUser(user.userId)}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "background-color 0.2s",
                          }}
                          title="Xóa tài khoản"
                        >
                          <Delete style={{ fontSize: 16 }} />
                        </button>
                      )}

                      {(window.permission?.roleType === 2 && user.role?.type === 1) && (
                        <span style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          fontStyle: "italic",
                          padding: "6px 8px",
                        }}>
                          Không có thao tác
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={editUserOpen}
        onClose={() => setEditUserOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }
        }}
      >
        <DialogTitle style={{
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "20px",
          fontSize: "18px",
          fontWeight: "600",
          color: "#1e293b",
        }}>
          Chỉnh sửa tài khoản: {editingUser?.email}
        </DialogTitle>
        <DialogContent style={{ padding: "20px" }}>
          <div style={{ marginBottom: "24px" }}>
            <Typography
              variant="h6"
              style={{
                margin: "0 0 16px 0",
                color: "#1e293b",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Thông tin tài khoản
            </Typography>

            <Grid container spacing={2} style={{ marginBottom: "16px" }}>
              <Grid item xs={12} md={6}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151"
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Nhập email"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 15,
                    background: "#f9fafb",
                    outline: "none",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "border-color 0.2s",
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151"
                }}>
                  Tên người dùng
                </label>
                <input
                  type="text"
                  value={editUserData.userName}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, userName: e.target.value }))}
                  placeholder="Nhập tên người dùng"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 15,
                    background: "#f9fafb",
                    outline: "none",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "border-color 0.2s",
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151"
                }}>
                  Mật khẩu mới (để trống nếu không đổi)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editUserData.password}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Nhập mật khẩu mới"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      paddingRight: "45px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 15,
                      background: "#f9fafb",
                      outline: "none",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <IconButton
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "4px",
                    }}
                  >
                    {showEditPassword ? <VisibilityOff size={18} /> : <Visibility size={18} />}
                  </IconButton>
                </div>
              </Grid>
            </Grid>

            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Trạng thái
              </label>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                backgroundColor: "white",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                fontSize: "14px",
                width: "fit-content",
              }}>
                <input
                  type="checkbox"
                  checked={editUserData.isActive}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, isActive: e.target.checked }))}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "rgb(59, 130, 246)",
                    cursor: "pointer",
                  }}
                />
                <span style={{
                  color: "#374151",
                  fontWeight: "500",
                }}>
                  Tài khoản hoạt động
                </span>
              </label>
            </div>
          </div>

          <div>
            <Typography
              variant="h6"
              style={{
                margin: "0 0 16px 0",
                color: "#1e293b",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Phân quyền
            </Typography>

            <div
              style={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                padding: "16px",
              }}
            >
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px"
              }}>
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      backgroundColor: "white",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f1f5f9";
                      e.target.style.borderColor = "rgb(59, 130, 246)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "white";
                      e.target.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={userPermissions[permission.name] || false}
                      onChange={(e) => handlePermissionChange(permission.name, e.target.checked, true)}
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "rgb(59, 130, 246)",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{
                      color: "#374151",
                      fontWeight: "500",
                      flex: 1,
                    }}>
                      {permission.description}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      backgroundColor: "#f3f4f6",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontWeight: "500",
                    }}>
                      {permission.resourceDisplayName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions style={{
          backgroundColor: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          padding: "16px 20px",
          gap: "12px",
        }}>
          <Button
            onClick={() => setEditUserOpen(false)}
            style={{
              backgroundColor: "#f3f4f6",
              color: "#374151",
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: "14px",
              fontWeight: "500",
              textTransform: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveEditUser}
            style={{
              backgroundColor: "#4caf50",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: "14px",
              fontWeight: "500",
              textTransform: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PermissionsManagement;