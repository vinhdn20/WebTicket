import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import { refreshAccessToken } from "../../constant";
import {
  Snackbar,
  Alert,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const generateMatrixValues = (rows, cols, startValue = 11) => {
  const matrix = [];
  let value = startValue;
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(value++);
    }
    matrix.push(row);
  }
  return matrix;
};

export default function TKTripForm({ open, onClose, type }) {
  const API_URL = process.env.REACT_APP_API_URL;

  const [formData, setFormData] = useState(() => {
    const rows = 1;
    const cols = 8; // email, password, name, accountName, medal, status, recoveryPhone, recoveryEmail
    const matrix = generateMatrixValues(rows, cols);
    return Array.from({ length: rows }, (_, rowIndex) => ({
      email: "",
      password: "",
      name: "",
      accountName: "",
      medal: "",
      status: 1, // default: Hoạt động
      recoveryPhone: "",
      recoveryEmail: "",
      matrixValue: matrix[rowIndex],
    }));
  });

  const [apiData, setApiData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedApiRows, setSelectedApiRows] = useState([]);
  const [currentFocusRow, setCurrentFocusRow] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isApi, setIsApi] = useState(false);
  const hasFetchedRef = useRef(false); // guard to fetch once per open

  // Hàm để lấy accessToken
  const getAccessToken = useCallback(() => {
    return localStorage.getItem("accessToken");
  }, []);

  // Hàm để mở snackbar
  const openSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Hàm để đóng snackbar
  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const fetchApiData = useCallback(async () => {
    let accessToken = getAccessToken();
    try {
      const response = await fetch(
        type === 1 ? `${API_URL}/Ve/trip` : `${API_URL}/Ve/agoda`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          const retryResponse = await fetch(
            type === 1 ? `${API_URL}/Ve/trip` : `${API_URL}/Ve/agoda`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (!retryResponse.ok) throw new Error("Failed to fetch");
          const retryResult = await retryResponse.json();
          updateApiData(retryResult);
          return;
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      updateApiData(result);
    } catch (error) {
      console.error("Error fetching data", error);
      openSnackbar("Có lỗi xảy ra khi tải dữ liệu tài khoản Trip.", "error");
    }
  }, [getAccessToken, openSnackbar, API_URL, type]); // include type

  // Map dữ liệu API -> bảng
  const updateApiData = useCallback((api) => {
    const mapped = api.map((item) => ({
      id: item.id,
      email: item.email || "",
      password: item.password || "",
      name: item.name || "",
      accountName: item.accountName || "",
      medal: item.medal || "",
      status: item.status ?? 1,
      recoveryPhone: item.recoveryPhone || "",
      recoveryEmail: item.recoveryEmail || "",
      type: item.type ?? "",
    }));
    setApiData(mapped);
  }, []);

  // Lọc tìm kiếm theo email, name, accountName
  const filteredApiData = useMemo(() => {
    if (!searchText.trim()) return apiData;
    const lower = searchText.toLowerCase();
    return apiData.filter(
      (row) =>
        (row.email && row.email.toLowerCase().includes(lower)) ||
        (row.name && row.name.toLowerCase().includes(lower)) ||
        (row.accountName && row.accountName.toLowerCase().includes(lower))
    );
  }, [apiData, searchText]);

  // Fetch dữ liệu khi mở dialog - only once per open
  useEffect(() => {
    if (open && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchApiData();
    } else if (!open) {
      hasFetchedRef.current = false; // reset when dialog closes
      // Reset formData và các state khi đóng dialog
      setFormData([
        {
          email: "",
          password: "",
          name: "",
          accountName: "",
          medal: "",
          status: 1,
          recoveryPhone: "",
          recoveryEmail: "",
          matrixValue: [],
        },
      ]);
      setSelectedRows([]);
      setSelectedApiRows([]);
    }
  }, [open, fetchApiData]);

  // Xử lý paste từ clipboard vào bảng
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData
        .split("\n")
        .map((row) => row.split("\t"))
        .filter((row) => row.some((cell) => cell.trim() !== "")); // Bỏ dòng trống

      if (currentFocusRow === null) return; // Kiểm tra nếu chưa có hàng focus

      setFormData((prev) => {
        const fieldNames = [
          "email",
          "password",
          "name",
          "accountName",
          "medal",
          "recoveryPhone",
          "recoveryEmail",
        ];
        const updated = [...prev];
        const requiredRows = currentFocusRow + rows.length;
        if (requiredRows > updated.length) {
          const cols = fieldNames.length;
          const matrix = generateMatrixValues(requiredRows, cols, 11);
          for (let i = updated.length; i < requiredRows; i++) {
            const newRow = {
              email: "",
              password: "",
              name: "",
              accountName: "",
              medal: "",
              status: 1,
              recoveryPhone: "",
              recoveryEmail: "",
              matrixValue: matrix[i],
            };
            updated.push(newRow);
          }
        }
        rows.forEach((rowValues, rowOffset) => {
          const targetRow = currentFocusRow + rowOffset;
          if (updated[targetRow]) {
            fieldNames.forEach((field, idx) => {
              if (rowValues[idx] !== undefined) {
                updated[targetRow][field] = rowValues[idx];
              }
            });
          }
        });
        return updated;
      });
    },
    [currentFocusRow]
  );

  // Xử lý thay đổi ô dữ liệu
  const handleCellChange = useCallback((rowIndex, field, value) => {
    setFormData((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex ? { ...row, [field]: value } : row
      )
    );
  }, []);

  const handleAddRow = useCallback(() => {
    const currentRows = formData.length;
    const cols = 8; // Thêm cột status
    const matrix = generateMatrixValues(currentRows + 1, cols, 11);

    setFormData((prev) => [
      ...prev,
      {
        email: "",
        password: "",
        name: "",
        accountName: "",
        medal: "",
        status: 1, // default: Hoạt động
        recoveryPhone: "",
        recoveryEmail: "",
        matrixValue: matrix[currentRows],
      },
    ]);
  }, [formData.length]);

  // Xử lý chọn/huỷ chọn hàng trong formData
  const handleCheckboxChange = useCallback((rowIndex) => {
    setSelectedRows((prev) =>
      prev.includes(rowIndex)
        ? prev.filter((index) => index !== rowIndex)
        : [...prev, rowIndex]
    );
  }, []);

  // Xử lý xóa các hàng đã chọn trong formData
  const handleDeleteSelectedRows = useCallback(() => {
    setFormData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
  }, [selectedRows]);

  // Xử lý chọn/huỷ chọn hàng trong apiData
  const handleApiCheckboxChange = useCallback((id) => {
    setSelectedApiRows((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  // Xử lý xóa các hàng đã chọn trong apiData
  const handleDeleteSelectedApiRows = useCallback(async () => {
    if (selectedApiRows.length === 0) {
      openSnackbar("Không có hàng nào được chọn để xóa.", "warning");
      return;
    }
    let accessToken = getAccessToken();
    const payload = selectedApiRows;
    try {
      const response = await fetch(
        type === 1 ? `${API_URL}/Ve/trip` : `${API_URL}/Ve/agoda`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          const retryResponse = await fetch(
            type === 1 ? `${API_URL}/Ve/trip` : `${API_URL}/Ve/agoda`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(payload),
            }
          );
          if (!retryResponse.ok) throw new Error("Failed to delete");
          openSnackbar("Đã xóa các tài khoản Trip đã chọn!", "success");
          setSelectedApiRows([]);
          fetchApiData();
          return;
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }
      if (!response.ok) throw new Error("Failed to delete rows");
      openSnackbar("Đã xóa các tài khoản Trip đã chọn!", "success");
      setSelectedApiRows([]);
      fetchApiData();
    } catch (error) {
      console.error("Error deleting data", error);
      openSnackbar("Có lỗi xảy ra khi xóa tài khoản Trip.", "error");
    }
  }, [selectedApiRows, getAccessToken, fetchApiData, openSnackbar, API_URL, type]);

  const handleSave = useCallback(async () => {
    for (const row of formData) {
      if (!row.email || !row.password || !row.accountName) {
        openSnackbar(
          "Vui lòng nhập email, password và accountName.",
          "warning"
        );
        return;
      }
    }
    let accessToken = getAccessToken();
    const payload = formData.map((r) => ({
      email: r.email,
      password: r.password,
      name: r.name,
      accountName: r.accountName,
      medal: r.medal,
      status: r.status ?? 1,
      recoveryPhone: r.recoveryPhone,
      recoveryEmail: r.recoveryEmail,
    }));
    try {
      const response = await fetch(
        type === 1 ? `${API_URL}/Ve/trip` : `${API_URL}/Ve/agoda`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          const retryResponse = await fetch(
            type === 1 ? `${API_URL}/Ve/trip` : `${API_URL}/Ve/agoda`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(payload),
            }
          );
          if (!retryResponse.ok) throw new Error("Failed to save");
          openSnackbar("Lưu tài khoản Trip thành công!", "success");
          onClose(null);
          fetchApiData();
          return;
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) throw new Error("Network response was not ok");
      openSnackbar("Lưu tài khoản Trip thành công!", "success");
      onClose(null);
      fetchApiData();
    } catch (error) {
      console.error("Error saving data", error);
      openSnackbar("Có lỗi xảy ra khi lưu tài khoản Trip.", "error");
    }
  }, [formData, getAccessToken, fetchApiData, openSnackbar, onClose, API_URL]);

  const handleOpenDeleteDialogForNormal = useCallback(() => {
    setIsApi(false);
    setOpenDeleteDialog(true);
  }, []);

  const handleOpenDeleteDialogForAPI = useCallback(() => {
    setIsApi(true);
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    isApi ? handleDeleteSelectedApiRows() : handleDeleteSelectedRows();
    setOpenDeleteDialog(false);
  }, [handleDeleteSelectedApiRows, handleDeleteSelectedRows, isApi]);

  // Import file lên API AGCustomer/import
  const importDataFromApi = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      try {
        const accessToken = localStorage.getItem("accessToken");
        const response = await fetch(`${API_URL}/AGCustomer/import`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formDataUpload,
        });
        if (!response.ok) {
          throw new Error("Không thể import dữ liệu từ API.");
        }
        const result = await response.json();
        if (Array.isArray(result)) {
          setFormData(
            result.map(({ tenAG, sdt, mail }) => ({ tenAG, sdt, mail }))
          );
          openSnackbar("Import dữ liệu thành công!", "success");
          onClose(null);
          fetchApiData();
        } else {
          openSnackbar("Dữ liệu trả về không hợp lệ!", "error");
        }
      } catch (error) {
        openSnackbar(error.message || "Có lỗi khi import dữ liệu!", "error");
      }
    };
    input.click();
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          position: "absolute",
          bottom: 0,
          margin: 0,
          minWidth: "100%",
          height: "100%",
          borderRadius: "10px 10px 0 0",
          boxShadow: 3,
        },
      }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            alignContent: "space-between",
            width: "100%",
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => onClose(null)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {type === 1 ? "Nhập tài khoản Trip" : "Nhập tài khoản Agoda"}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Table for Input */}
      <div style={{ padding: "20px" }} onPaste={handlePaste}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Button
            autoFocus
            color="inherit"
            onClick={handleSave}
            style={{
              backgroundColor: "#4caf50",
              color: "#fff",
              marginRight: "30px",
            }}
          >
            Save
          </Button>

          <Button
            autoFocus
            color="inherit"
            onClick={() => importDataFromApi()}
            style={{
              backgroundColor: "#4caf50",
              color: "#fff",
              marginRight: "30px",
            }}
          >
            Import dữ liệu
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
            maxHeight: 340,
            overflowY: "auto",
          }}
        >
          <table
            style={{
              minWidth: 600,
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              background: "white",
              tableLayout: "fixed", // đảm bảo theo colgroup
            }}
          >
            {/* Cố định độ rộng từng cột */}
            <colgroup>
              <col style={{ width: 52 }} /> {/* checkbox */}
              <col style={{ width: "18%" }} /> {/* Email */}
              <col style={{ width: "16%" }} /> {/* Password */}
              <col style={{ width: "16%" }} /> {/* Name */}
              <col style={{ width: "16%" }} /> {/* Account Name */}
              <col style={{ width: "12%" }} /> {/* Medal */}
              <col style={{ width: "10%" }} /> {/* Status */}
              <col style={{ width: "11%" }} /> {/* Recovery Phone */}
              <col style={{ width: "11%" }} /> {/* Recovery Email */}
            </colgroup>
            {/* Header INPUT TABLE: move sticky to th */}
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 5,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 8px",
                    textAlign: "center",
                    background: "#f8fafc",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      formData.length > 0 &&
                      selectedRows.length === formData.length
                    }
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedRows(formData.map((_, idx) => idx));
                      else setSelectedRows([]);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                {[
                  "Email",
                  "Password",
                  "Name",
                  "Account Name",
                  "Medal",
                  "Status",
                  "Recovery Phone",
                  "Recovery Email",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 4,
                      borderBottom: "2px solid #e2e8f0",
                      padding: "12px 8px",
                      background: "#f8fafc",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    background: rowIndex % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                      textAlign: "center",
                      position: "sticky",
                      left: 0,
                      background: rowIndex % 2 === 0 ? "#fff" : "#f8fafc",
                      zIndex: 2,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rowIndex)}
                      onChange={() => handleCheckboxChange(rowIndex)}
                    />
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "email", e.target.value)
                      }
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    <input
                      type="text"
                      value={row.password}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "password", e.target.value)
                      }
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "name", e.target.value)
                      }
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    <input
                      type="text"
                      value={row.accountName}
                      onChange={(e) =>
                        handleCellChange(
                          rowIndex,
                          "accountName",
                          e.target.value
                        )
                      }
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    <input
                      type="text"
                      value={row.medal}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "medal", e.target.value)
                      }
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                  {/* NEW: Status dropdown */}
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    <select
                      value={row.status ?? 1}
                      onChange={(e) =>
                        handleCellChange(
                          rowIndex,
                          "status",
                          Number(e.target.value)
                        )
                      }
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value={1}>Hoạt động</option>
                      <option value={2}>Không hoạt động</option>
                      <option value={3}>Lỗi</option>
                    </select>
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    <input
                      type="text"
                      value={row.recoveryPhone}
                      onChange={(e) =>
                        handleCellChange(
                          rowIndex,
                          "recoveryPhone",
                          e.target.value
                        )
                      }
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    <input
                      type="email"
                      value={row.recoveryEmail}
                      onChange={(e) =>
                        handleCellChange(
                          rowIndex,
                          "recoveryEmail",
                          e.target.value
                        )
                      }
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#f9fafb",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}
        >
          <Button
            onClick={handleAddRow}
            variant="contained"
            color="primary"
            style={{ minWidth: 120, borderRadius: 8, fontWeight: 600 }}
          >
            Thêm Hàng
          </Button>
          <Button
            onClick={handleOpenDeleteDialogForNormal}
            variant="contained"
            color="secondary"
            style={{
              minWidth: 160,
              borderRadius: 8,
              fontWeight: 600,
              opacity: selectedRows.length === 0 ? 0.5 : 1,
              cursor: selectedRows.length === 0 ? "not-allowed" : "pointer",
            }}
            disabled={selectedRows.length === 0}
          >
            Xóa Hàng Đã Chọn
          </Button>
        </div>
      </div>

      {/* Table for API Data */}
      <div style={{ padding: "20px" }}>
        <h2 className="section-title">
          Bảng dữ liệu tài khoản {type === 1 ? "Trip" : "Agoda"}
        </h2>
        <div
          style={{
            margin: "12px 0 20px 0",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo email, name hoặc accountName..."
            style={{
              width: 320,
              maxWidth: "100%",
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
        </div>
        <div
          style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}
        >
          <Button
            onClick={handleOpenDeleteDialogForAPI}
            variant="contained"
            color="secondary"
            style={{
              minWidth: 160,
              borderRadius: 8,
              fontWeight: 600,
              opacity: selectedApiRows.length === 0 ? 0.5 : 1,
              cursor: selectedApiRows.length === 0 ? "not-allowed" : "pointer",
            }}
            disabled={selectedApiRows.length === 0}
          >
            Xóa Hàng Đã Chọn
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
            maxHeight: 340,
            overflowY: "auto",
          }}
        >
          <table
            style={{
              minWidth: 900,
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              background: "white",
              tableLayout: "fixed",
              textAlign: "center", // center the data table content
            }}
          >
            {/* Header API TABLE: move sticky to th */}
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 5,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 8px",
                    textAlign: "center",
                    background: "#f8fafc",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      filteredApiData.length > 0 &&
                      selectedApiRows.length === filteredApiData.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedApiRows(
                          filteredApiData.map((row) => row.id)
                        );
                      } else {
                        setSelectedApiRows([]);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                {[
                  "Email",
                  "Password",
                  "Name",
                  "Account Name",
                  "Medal",
                  "Status",
                  "Recovery Phone",
                  "Recovery Email",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 4,
                      borderBottom: "2px solid #e2e8f0",
                      padding: "12px 8px",
                      background: "#f8fafc",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredApiData.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  style={{
                    background: rowIndex % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                      textAlign: "center",
                      position: "sticky",
                      left: 0,
                      background: rowIndex % 2 === 0 ? "#fff" : "#f8fafc",
                      zIndex: 2,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedApiRows.includes(row.id)}
                      onChange={() => handleApiCheckboxChange(row.id)}
                    />
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.email}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.password}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.name}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.accountName}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.medal}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.status == 1
                      ? "Hoạt động"
                      : row.status == 2
                      ? "Không hoạt động"
                      : "Lỗi"}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.recoveryPhone}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.recoveryEmail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-confirmation-dialog-title"
        aria-describedby="delete-confirmation-dialog-description"
      >
        <DialogTitle id="delete-confirmation-dialog-title">
          Xác nhận xóa
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-confirmation-dialog-description">
            Bạn có chắc chắn muốn xóa {selectedRows.length} hàng đã chọn? Hành
            động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Hủy
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary" autoFocus>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </Dialog>
  );
}
