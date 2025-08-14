import React, { useEffect, useState, useCallback, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import { refreshAccessToken } from "../../constant";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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

export default function FullScreenAGDialog({ open, onClose }) {
  const API_URL = process.env.REACT_APP_API_URL;

  const [formData, setFormData] = useState(() => {
    const rows = 1; // Số hàng ban đầu
    const cols = 3; // Số cột (tenAG, sdt, mail)
    const matrix = generateMatrixValues(rows, cols);
    return Array.from({ length: rows }, (_, rowIndex) => ({
      tenAG: "",
      sdt: "",
      mail: "",
      matrixValue: matrix[rowIndex], // Gán matrixValue cho mỗi hàng
    }));
  });

  const [apiData, setApiData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]); // Lưu các hàng được chọn
  const [selectedApiRows, setSelectedApiRows] = useState([]);
  const [currentFocusRow, setCurrentFocusRow] = useState(null); // Lưu vị trí hàng được focus
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isApi, setIsApi] = useState(false);

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

  // Hàm fetch dữ liệu từ API
  const fetchApiData = useCallback(async () => {
    let accessToken = getAccessToken();
    try {
      const response = await fetch(`${API_URL}/Ve/ag`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          const retryResponse = await fetch(`${API_URL}/Ve/ag`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!retryResponse.ok) {
            throw new Error(
              "Failed to fetch data after refreshing token: " +
                retryResponse.statusText
            );
          }
          const retryResult = await retryResponse.json();
          updateApiData(retryResult);
          return;
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.statusText);
      }

      const result = await response.json();
      updateApiData(result);
    } catch (error) {
      console.error("Error fetching data", error);
      openSnackbar("Có lỗi xảy ra khi tải dữ liệu từ API.", "error");
    }
  }, [getAccessToken, openSnackbar]);

  // Hàm cập nhật dữ liệu API
  const updateApiData = useCallback((apiData) => {
    const mappedData = apiData.map((item) => ({
      id: item.id,
      tenAG: item.tenAG || "",
      sdt: item.sdt || "",
      mail: item.mail || "",
    }));
    setApiData(mappedData);
  }, []);

  // Lọc dữ liệu API theo searchText
  const filteredApiData = useMemo(() => {
    if (!searchText.trim()) return apiData;
    const lower = searchText.toLowerCase();
    return apiData.filter(
      (row) =>
        (row.tenAG && row.tenAG.toLowerCase().includes(lower)) ||
        (row.sdt && row.sdt.toLowerCase().includes(lower)) ||
        (row.mail && row.mail.toLowerCase().includes(lower))
    );
  }, [apiData, searchText]);

  // Fetch dữ liệu khi mở dialog
  useEffect(() => {
    if (open) {
      fetchApiData();
    } else {
      // Reset formData và các state khi đóng dialog
      setFormData([{ tenAG: "", sdt: "", mail: "", matrixValue: [] }]);
      setSelectedRows([]);
      setSelectedApiRows([]);
    }
  }, [open, fetchApiData]);

  // Xử lý paste từ clipboard vào bảng
  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();

      // Lấy dữ liệu từ clipboard
      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData
        .split("\n")
        .map((row) => row.split("\t"))
        .filter((row) => row.some((cell) => cell.trim() !== "")); // Bỏ dòng trống

      if (currentFocusRow === null) return; // Kiểm tra nếu chưa có hàng focus

      setFormData((prevFormData) => {
        // Định nghĩa các trường tương ứng với số cột dán vào
        const fieldNames = [
          "tenAG", // Chặng
          "sdt", // Ngày giờ bay
          "mail", // Hãng bay
          "col4", // Số hiệu chuyến bay
          "col5", // Tham chiếu HHK
          "col6", // Mã đặt chỗ
          "col7", // Tên khách hàng
        ];
        let updatedFormData = [...prevFormData];
        const requiredRows = currentFocusRow + rows.length;
        if (requiredRows > updatedFormData.length) {
          // Thêm đủ số hàng mới nếu cần
          const cols = fieldNames.length;
          const matrix = generateMatrixValues(requiredRows, cols, 11);
          for (let i = updatedFormData.length; i < requiredRows; i++) {
            // Tạo object đủ trường
            const newRow = {};
            fieldNames.forEach((field, idx) => {
              newRow[field] = "";
            });
            newRow.matrixValue = matrix[i];
            updatedFormData.push(newRow);
          }
        }

        rows.forEach((rowValues, rowOffset) => {
          const targetRow = currentFocusRow + rowOffset;
          if (updatedFormData[targetRow]) {
            fieldNames.forEach((field, idx) => {
              if (rowValues[idx] !== undefined)
                updatedFormData[targetRow][field] = rowValues[idx];
            });
          }
        });
        return updatedFormData;
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

  // Thêm hàng mới vào formData
  const handleAddRow = useCallback(() => {
    const currentRows = formData.length;
    const cols = 3; // Số cột (tenAG, sdt, mail)
    const matrix = generateMatrixValues(currentRows + 1, cols, 11);

    setFormData((prev) => [
      ...prev,
      {
        tenAG: "",
        sdt: "",
        mail: "",
        matrixValue: matrix[currentRows], // Gán matrixValue mới
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
      const response = await fetch(`${API_URL}/Ve/ag`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          // Retry the original request with the new token
          const retryResponse = await fetch(`${API_URL}/Ve/ag`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (!retryResponse.ok) {
            throw new Error(
              "Failed to delete rows after refreshing token: " +
                retryResponse.statusText
            );
          }

          openSnackbar("Các hàng đã chọn được xóa thành công!", "success");
          setSelectedApiRows([]);
          fetchApiData();
          return;
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Failed to delete rows: " + response.statusText);
      }

      openSnackbar("Các hàng đã chọn được xóa thành công!", "success");
      setSelectedApiRows([]);
      fetchApiData();
    } catch (error) {
      console.error("Error deleting data", error);
      openSnackbar("Có lỗi xảy ra khi xóa các hàng đã chọn.", "error");
    }
  }, [selectedApiRows, getAccessToken, fetchApiData, openSnackbar, API_URL]);

  const handleSave = useCallback(async () => {
    for (const row of formData) {
      if (!row.tenAG || !row.sdt || !row.mail) {
        openSnackbar(
          "Vui lòng điền đầy đủ thông tin cho tất cả các hàng.",
          "warning"
        );
        return;
      }
    }

    let accessToken = getAccessToken();

    try {
      const response = await fetch(`${API_URL}/Ve/ag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          // Retry the original request with the new token
          const retryResponse = await fetch(`${API_URL}/Ve/ag`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(formData),
          });

          if (!retryResponse.ok) {
            throw new Error(
              "Failed to save data after refreshing token: " +
                retryResponse.statusText
            );
          }

          openSnackbar("Dữ liệu đã được lưu thành công!", "success");
          onClose(null);
          fetchApiData();
          return;
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.statusText);
      }

      openSnackbar("Dữ liệu đã được lưu thành công!", "success");
      onClose(null);
      fetchApiData();
    } catch (error) {
      console.error("Error saving data", error);
      openSnackbar("Có lỗi xảy ra khi lưu dữ liệu.", "error");
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
        const response = await fetch(`${API_URL}/AGCustomer/import`, {
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
            const retryResponse = await fetch(`${API_URL}/AGCustomer/import`, {
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
            Nhập bảng AG
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
            }}
          >
            {/* Header INPUT TABLE: move sticky to th */}
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 5, // higher than body sticky cells
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
                    // indeterminate prop on native input is not standard attr; keep logic if needed
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
                  }}
                >
                  Tên AG
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
                  Số điện thoại
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
                  Email
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
                      value={row.tenAG}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "tenAG", e.target.value)
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
                      placeholder="Nhập tên AG"
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
                      value={row.sdt}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "sdt", e.target.value)
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
                      placeholder="Nhập số điện thoại"
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
                      value={row.mail}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "mail", e.target.value)
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
                      placeholder="Nhập email"
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
        <h2 className="section-title">Bảng dữ liệu AG</h2>
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
            placeholder="Tìm theo tên AG, số điện thoại hoặc email..."
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
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 4,
                    borderBottom: "2px solid #e2e8f0",
                    padding: "12px 20px",
                    background: "#f8fafc",
                  }}
                >
                  Tên AG
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
                  Số điện thoại
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
                  Email
                </th>
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
                    {row.tenAG}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.sdt}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 8px",
                    }}
                  >
                    {row.mail}
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
