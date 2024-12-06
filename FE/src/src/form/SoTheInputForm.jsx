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
import { refreshAccessToken } from "../constant";
import "../style/table.css";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Alert component for Snackbar
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
  const [formData, setFormData] = useState(() => {
    const rows = 1;
    const cols = 1;
    const matrix = generateMatrixValues(rows, cols);
    return Array.from({ length: rows }, (_, rowIndex) => ({
      soThe: "",
      matrixValue: matrix[rowIndex],
    }));
  });
  const [apiData, setApiData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedApiRows, setSelectedApiRows] = useState([]);
  const [currentFocusRow, setCurrentFocusRow] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  // Hàm hỗ trợ gọi API với xử lý làm mới token
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
          // Token expired, thử làm mới token
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

  // Hàm fetch dữ liệu từ API
  const fetchApiData = useCallback(async () => {
    try {
      const result = await callApiWithAuth("https://localhost:44331/Ve/card", {
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

  // Hàm cập nhật dữ liệu API
  const updateApiData = useCallback((apiData) => {
    const mappedData = apiData.map((item) => ({
      id: item.id,
      soThe: item.soThe || "",
    }));
    setApiData(mappedData);
  }, []);

  // Fetch dữ liệu khi mở dialog
  useEffect(() => {
    if (open) {
      fetchApiData();
    } else {
      // Reset formData và các state khi đóng dialog
      setFormData([
        {
          soThe: "",
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

      // Lấy dữ liệu từ clipboard
      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData.split("\n").map((row) => row.split("\t")); // Chia dòng và cột từ Excel

      if (currentFocusRow === null) return; // Kiểm tra nếu chưa có hàng focus

      // Cập nhật dữ liệu vào bảng
      const updatedFormData = [...formData];
      rows.forEach((rowValues, rowOffset) => {
        const targetRow = currentFocusRow + rowOffset; // Xác định hàng bắt đầu
        if (updatedFormData[targetRow]) {
          // Cập nhật các cột
          rowValues.forEach((cellValue, colOffset) => {
            if (colOffset === 0) {
              updatedFormData[targetRow].soThe = cellValue; // Cột số thẻ thanh toán
            }
          });
        }
      });

      setFormData(updatedFormData); // Cập nhật state
    },
    [formData, currentFocusRow]
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
    const cols = 1;
    const matrix = generateMatrixValues(currentRows + 1, cols, 11);

    setFormData((prev) => [
      ...prev,
      {
        soThe: "",
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
  const handleDeleteSelectedRows = () => {
    setFormData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
  };

  // Xử lý chọn/huỷ chọn hàng trong apiData
  const handleApiCheckboxChange = useCallback((id) => {
    setSelectedApiRows((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  }, []);

  // Xử lý xóa các hàng đã chọn trong apiData
  const handleDeleteSelectedApiRows = useCallback(async () => {
    if (selectedApiRows.length === 0) {
      openSnackbar("Không có hàng nào được chọn để xóa.", "warning");
      return;
    }

    const payload = selectedApiRows;

    try {
      await callApiWithAuth("https://localhost:44331/Ve/card", {
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
  }, [selectedApiRows, callApiWithAuth, fetchApiData, openSnackbar]);

  // Hàm lưu dữ liệu từ formData vào API
  const handleSave = useCallback(async () => {
    // Kiểm tra dữ liệu trước khi lưu
    for (const row of formData) {
      if (!row.soThe) {
        openSnackbar(
          "Vui lòng điền đầy đủ số thẻ thanh toán cho tất cả các hàng.",
          "warning"
        );
        return;
      }
      // Thêm các kiểm tra khác nếu cần
    }

    try {
      await callApiWithAuth("https://localhost:44331/Ve/card", {
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
  }, [formData, callApiWithAuth, fetchApiData, openSnackbar, onClose]);

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
          height: "80vh",
          borderRadius: "10px 10px 0 0",
          boxShadow: 3,
        },
      }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
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
          <Button autoFocus color="inherit" onClick={handleSave}>
            Save
          </Button>
        </Toolbar>
      </AppBar>

      {/* Table for Input */}
      <div style={{ padding: "20px" }} onPaste={handlePaste}>
        <Typography variant="h6">Thêm mới số thẻ thanh toán</Typography>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                Chọn
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Số thẻ thanh toán
              </th>
            </tr>
          </thead>
          <tbody>
            {formData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(rowIndex)}
                    onChange={() => handleCheckboxChange(rowIndex)}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <input
                    type="text"
                    value={row.soThe}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "soThe", e.target.value)
                    }
                    onFocus={() => setCurrentFocusRow(rowIndex)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      padding: "4px",
                      backgroundColor: "#f9f9f9", // Thêm nền để dễ nhìn
                    }}
                    placeholder="Nhập số thẻ thanh toán"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "20px" }}>
          <Button
            onClick={handleAddRow}
            variant="contained"
            color="primary"
            style={{ marginRight: "10px" }}
          >
            Thêm Hàng
          </Button>
          <Button
            onClick={handleDeleteSelectedRows}
            variant="contained"
            color="secondary"
            disabled={selectedRows.length === 0}
          >
            Xóa Hàng Đã Chọn
          </Button>
        </div>
      </div>

      {/* Table for API Data */}
      <div style={{ padding: "20px" }}>
        <Typography variant="h6">Dữ liệu từ API</Typography>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                Chọn
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Số thẻ thanh toán
              </th>
            </tr>
          </thead>
          <tbody>
            {apiData.map((row) => (
              <tr key={row.id}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedApiRows.includes(row.id)}
                    onChange={() => handleApiCheckboxChange(row.id)}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {row.soThe}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "20px" }}>
          <Button
            onClick={handleDeleteSelectedApiRows}
            variant="contained"
            color="secondary"
            disabled={selectedApiRows.length === 0}
          >
            Xóa Hàng Đã Chọn
          </Button>
        </div>
      </div>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
