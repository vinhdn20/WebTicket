import React, { useEffect, useState, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { refreshAccessToken } from "../../constant";
import "../../style/table.css";
import {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const generateMatrixValues = (rows, cols, startValue = 11) => {
  const matrix = [];
  let value = startValue; // Bắt đầu từ 11
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(value++);
    }
    matrix.push(row);
  }
  return matrix;
};

export default function FullScreenSoTheDialog({ open, onClose }) {
  const API_URL = process.env.REACT_APP_API_URL;
  const [formData, setFormData] = useState(() => {
    const rows = 1;
    const cols = 1;
    const matrix = generateMatrixValues(rows, cols);
    return Array.from({ length: rows }, (_, rowIndex) => ({
      dongThe: "",
      soODuoi: "",
      bank: "",
      tenTk: "",
      soThe: "",
      matrixValue: matrix[rowIndex],
    }));
  });
  const [apiData, setApiData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedApiRows, setSelectedApiRows] = useState([]);
  const [currentFocusRow, setCurrentFocusRow] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isApi, setIsApi] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const getAccessToken = useCallback(() => {
    return localStorage.getItem("accessToken");
  }, []);

  const openSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const callApiWithAuth = useCallback(
    async (url, options) => {
      let accessToken = getAccessToken();
      try {
        let response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            accessToken = newToken;
            // Retry request với token mới
            response = await fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (!response.ok) {
              throw new Error(response.statusText);
            }
          } else {
            window.location.href = "/";
            throw new Error("Failed to refresh access token");
          }
        }

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        return response.json();
      } catch (error) {
        throw error;
      }
    },
    [getAccessToken]
  );

  const fetchApiData = useCallback(async () => {
    try {
      const result = await callApiWithAuth(`${API_URL}/Ve/card`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      updateApiData(result);
    } catch (error) {
      console.error("Error fetching data", error);
      openSnackbar("Có lỗi xảy ra khi tải dữ liệu từ API.", "error");
    }
  }, [callApiWithAuth, openSnackbar]);

  const updateApiData = useCallback((apiData) => {
    const mappedData = apiData.map((item) => ({
      id: item.id,
      soThe: item.soThe || "",
    }));
    setApiData(mappedData);
  }, []);

  useEffect(() => {
    if (open) {
      fetchApiData();
    } else {
      setFormData([
        {
          dongThe: "",
          soODuoi: "",
          bank: "",
          tenTk: "",
          soThe: "",
          matrixValue: [],
        },
      ]);
      setSelectedRows([]);
      setSelectedApiRows([]);
    }
  }, [open, fetchApiData]);

  // Helper function to generate soThe from components
  const generateSoThe = (dongThe, soODuoi, bank, tenTk) => {
    if (!dongThe && !soODuoi && !bank && !tenTk) return "";
    return `${dongThe || ""} - ${soODuoi || ""} - ${bank || ""} - ${tenTk || ""}`.replace(/\s*-\s*$/, "").replace(/^\s*-\s*/, "");
  };

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData
        .split("\n")
        .map((row) => row.trim())
        .filter((row) => row !== "");
      
      if (currentFocusRow === null) return;
      
      setFormData((prevFormData) => {
        let updatedFormData = [...prevFormData];
        const requiredRows = currentFocusRow + rows.length;
        
        if (requiredRows > updatedFormData.length) {
          const cols = 1;
          const matrix = generateMatrixValues(requiredRows, cols, 11);
          for (let i = updatedFormData.length; i < requiredRows; i++) {
            updatedFormData.push({
              dongThe: "",
              soODuoi: "",
              bank: "",
              tenTk: "",
              soThe: "",
              matrixValue: matrix[i],
            });
          }
        }
        
        rows.forEach((rowValue, rowOffset) => {
          const targetRow = currentFocusRow + rowOffset;
          if (updatedFormData[targetRow]) {
            // Check if the pasted value contains the payment card format (contains " - ")
            if (rowValue.includes(" - ")) {
              // Parse the payment card format: "MTER - 6200 - VTIN - NGO XUAN BAO"
              const parts = rowValue.split(" - ").map(part => part.trim());
              
              if (parts.length >= 4) {
                updatedFormData[targetRow].dongThe = parts[0] || "";
                updatedFormData[targetRow].soODuoi = parts[1] || "";
                updatedFormData[targetRow].bank = parts[2] || "";
                updatedFormData[targetRow].tenTk = parts[3] || "";
                updatedFormData[targetRow].soThe = rowValue;
              } else {
                // If format is not complete, just put the value in soThe
                updatedFormData[targetRow].soThe = rowValue;
              }
            } else {
              // If it doesn't contain the format, check if it's tab-separated data
              const tabParts = rowValue.split("\t");
              if (tabParts.length > 1) {
                // Handle tab-separated data
                if (tabParts[0] !== undefined)
                  updatedFormData[targetRow].dongThe = tabParts[0];
                if (tabParts[1] !== undefined)
                  updatedFormData[targetRow].soODuoi = tabParts[1];
                if (tabParts[2] !== undefined)
                  updatedFormData[targetRow].bank = tabParts[2];
                if (tabParts[3] !== undefined)
                  updatedFormData[targetRow].tenTk = tabParts[3];
                
                // Auto-generate soThe
                const { dongThe, soODuoi, bank, tenTk } = updatedFormData[targetRow];
                updatedFormData[targetRow].soThe = generateSoThe(dongThe, soODuoi, bank, tenTk);
              } else {
                // Single value, put it in the first available field or soThe
                updatedFormData[targetRow].soThe = rowValue;
              }
            }
          }
        });
        
        return updatedFormData;
      });
    },
    [currentFocusRow]
  );

  const handleCellChange = useCallback((rowIndex, field, value) => {
    setFormData((prev) =>
      prev.map((row, idx) => {
        if (idx === rowIndex) {
          const updatedRow = { ...row, [field]: value };
          // Auto-generate soThe when any component field changes
          if (['dongThe', 'soODuoi', 'bank', 'tenTk'].includes(field)) {
            updatedRow.soThe = generateSoThe(
              updatedRow.dongThe,
              updatedRow.soODuoi,
              updatedRow.bank,
              updatedRow.tenTk
            );
          }
          return updatedRow;
        }
        return row;
      })
    );
  }, []);

  const handleAddRow = useCallback(() => {
    const currentRows = formData.length;
    const cols = 1;
    const matrix = generateMatrixValues(currentRows + 1, cols, 11);

    setFormData((prev) => [
      ...prev,
      {
        dongThe: "",
        soODuoi: "",
        bank: "",
        tenTk: "",
        soThe: "",
        matrixValue: matrix[currentRows],
      },
    ]);
  }, [formData.length]);

  const handleCheckboxChange = useCallback((rowIndex) => {
    setSelectedRows((prev) =>
      prev.includes(rowIndex)
        ? prev.filter((index) => index !== rowIndex)
        : [...prev, rowIndex]
    );
  }, []);

  const handleDeleteSelectedRows = useCallback(() => {
    setFormData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
  }, [selectedRows]);

  const handleApiCheckboxChange = useCallback((id) => {
    setSelectedApiRows((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  const handleDeleteSelectedApiRows = useCallback(async () => {
    if (selectedApiRows.length === 0) {
      openSnackbar("Không có hàng nào được chọn để xóa.", "warning");
      return;
    }

    const payload = selectedApiRows;

    try {
      await callApiWithAuth(`${API_URL}/Ve/card`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      openSnackbar("Các hàng đã chọn được xóa thành công!", "success");
      setSelectedApiRows([]);
      fetchApiData();
    } catch (error) {
      console.error("Error deleting data", error);
      openSnackbar("Có lỗi xảy ra khi xóa các hàng đã chọn.", "error");
    }
  }, [selectedApiRows, callApiWithAuth, fetchApiData, openSnackbar, API_URL]);

  const handleSave = useCallback(async () => {
    for (const row of formData) {
      if (!row.dongThe || !row.soODuoi || !row.bank || !row.tenTk) {
        openSnackbar(
          "Vui lòng điền đầy đủ thông tin thẻ cho tất cả các hàng.",
          "warning"
        );
        return;
      }
    }

    try {
      await callApiWithAuth(`${API_URL}/Ve/card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      openSnackbar("Dữ liệu đã được lưu thành công!", "success");
      onClose(null);
      fetchApiData();
    } catch (error) {
      console.error("Error saving data", error);
      openSnackbar("Có lỗi xảy ra khi lưu dữ liệu.", "error");
    }
  }, [formData, callApiWithAuth, fetchApiData, openSnackbar, onClose, API_URL]);

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
        let accessToken = getAccessToken();
        const response = await fetch(`${API_URL}/Card/import`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formDataUpload,
        });

        if (response.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            accessToken = newToken;
            const retryResponse = await fetch(`${API_URL}/Card/import`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: formDataUpload,
            });

            if (!retryResponse.ok) {
              throw new Error(
                "Không thể import dữ liệu từ API sau khi refresh token."
              );
            }

            const retryResult = await retryResponse.json();
            handleImportSuccess(retryResult);
            return;
          } else {
            window.location.href = "/";
            throw new Error("Failed to refresh access token");
          }
        }

        if (!response.ok) {
          throw new Error("Không thể import dữ liệu từ API.");
        }

        const result = await response.json();
        handleImportSuccess(result);
      } catch (error) {
        openSnackbar(error.message || "Có lỗi khi import dữ liệu!", "error");
      }
    };

    const handleImportSuccess = (result) => {
      const { message, fileName, processedCount } = result;

      const successMessage = `Import thành công file "${fileName}"! Đã xử lý ${processedCount} bản ghi.`;
      openSnackbar(successMessage, "success");

      fetchApiData();
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
            Nhập bảng số thẻ thanh toán
          </Typography>
          {/* Removed Save/Import buttons here to match AgInputForm layout */}
        </Toolbar>
      </AppBar>

      {/* Table for Input */}
      <div style={{ padding: "20px" }} onPaste={handlePaste}>
        {/* Top-right actions, same style as AgInputForm */}
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
              backgroundColor: "rgb(76, 175, 80)",
              color: "#fff",
              marginRight: "30px",
            }}
          >
            Lưu
          </Button>

          <Button
            autoFocus
            color="inherit"
            onClick={() => importDataFromApi()}
            style={{
              backgroundColor: "rgb(76, 175, 80)",
              color: "#fff",
              marginRight: "30px",
            }}
          >
            Import dữ liệu
          </Button>
        </div>

        {/* Styled table container like AgInputForm */}
        <div
          style={{
            width: "100%",
            overflowX: "auto",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            border: "1px solid #e2e8f0",
            margin: "16px 0",
            maxHeight: "60vh",
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
            {/* Header INPUT TABLE: sticky per-th, first col also sticky left */}
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
                      formData.length > 0 &&
                      selectedRows.length === formData.length
                    }
                    indeterminate={
                      selectedRows.length > 0 &&
                      selectedRows.length < formData.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(formData.map((_, idx) => idx));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 8px",
                    background: "#f8fafc",
                    minWidth: "120px",
                  }}
                >
                  Dòng thẻ
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 8px",
                    background: "#f8fafc",
                    minWidth: "120px",
                  }}
                >
                  4 số đuôi
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 8px",
                    background: "#f8fafc",
                    minWidth: "100px",
                  }}
                >
                  Bank
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 8px",
                    background: "#f8fafc",
                    minWidth: "200px",
                  }}
                >
                  Tên TK
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 8px",
                    background: "#f8fafc",
                    minWidth: "300px",
                  }}
                >
                  Mã thẻ thanh toán
                </th>
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
                      type="text"
                      value={row.dongThe}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "dongThe", e.target.value)
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
                        transition: "border-color 0.2s",
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
                      value={row.soODuoi}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "soODuoi", e.target.value)
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
                        transition: "border-color 0.2s",
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
                      value={row.bank}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "bank", e.target.value)
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
                        transition: "border-color 0.2s",
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
                      value={row.tenTk}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "tenTk", e.target.value)
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
                        transition: "border-color 0.2s",
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
                      value={row.soThe}
                      style={{
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        padding: "6px 8px",
                        borderRadius: 6,
                        fontSize: 15,
                      }}
                      placeholder="Tự động tạo từ các trường trên"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions under input table (same look & feel) */}
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
        <Typography variant="h6">Dữ liệu từ API</Typography>
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
            maxHeight: "60vh",
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
            }}
          >
            {/* Header API TABLE: sticky like AG */}
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
                      apiData.length > 0 &&
                      selectedApiRows.length === apiData.length
                    }
                    indeterminate={
                      selectedApiRows.length > 0 &&
                      selectedApiRows.length < apiData.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedApiRows(apiData.map((row) => row.id));
                      } else {
                        setSelectedApiRows([]);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 8px",
                    background: "#f8fafc",
                  }}
                >
                  Mã thẻ thanh toán
                </th>
              </tr>
            </thead>
            <tbody>
              {apiData.map((row, rowIndex) => (
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
                    {row.soThe}
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
