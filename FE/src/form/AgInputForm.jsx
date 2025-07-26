import React, { useEffect, useState, useCallback, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import { refreshAccessToken } from "../constant";
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

export default function FullScreenAGDialog({ open, onClose }) {
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
      const response = await fetch("https://localhost:7113/Ve/ag", {
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
          const retryResponse = await fetch("https://localhost:7113/Ve/ag", {
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
              updatedFormData[targetRow].tenAG = cellValue; // Cột tên AG
            } else if (colOffset === 1) {
              updatedFormData[targetRow].sdt = cellValue; // Cột số điện thoại
            } else if (colOffset === 2) {
              updatedFormData[targetRow].mail = cellValue; // Cột email
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
  const handleDeleteSelectedRows = () => {
    setFormData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
  };

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
      const response = await fetch("https://localhost:7113/Ve/ag", {
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
          const retryResponse = await fetch("https://localhost:7113/Ve/ag", {
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
  }, [selectedApiRows, getAccessToken, fetchApiData, openSnackbar]);

  // Hàm lưu dữ liệu từ formData vào API
  const handleSave = useCallback(async () => {
    // Kiểm tra dữ liệu trước khi lưu
    for (const row of formData) {
      if (!row.tenAG || !row.sdt || !row.mail) {
        openSnackbar(
          "Vui lòng điền đầy đủ thông tin cho tất cả các hàng.",
          "warning"
        );
        return;
      }
      // Thêm các kiểm tra khác nếu cần
    }

    let accessToken = getAccessToken();

    try {
      const response = await fetch("https://localhost:7113/Ve/ag", {
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
          const retryResponse = await fetch("https://localhost:7113/Ve/ag", {
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
  }, [formData, getAccessToken, fetchApiData, openSnackbar, onClose]);

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

  const exportTableToExcel = (tableData, fileName = "table_data.xlsx") => {
    const exportData = tableData.map(({ tenAG, sdt, mail }) => ({
      tenAG,
      sdt,
      mail,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(dataBlob, fileName);
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
          height: "80vh",
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
            onClick={() => exportTableToExcel(apiData)}
            style={{
              backgroundColor: "#4caf50",
              color: "#fff",
              marginRight: "30px",
            }}
          >
            Xuất file Excel
          </Button>
        </Toolbar>
      </AppBar>

      {/* Table for Input */}
      <div style={{ padding: "20px" }} onPaste={handlePaste}>
        <Typography variant="h6">Thêm mới AG</Typography>
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
                Tên AG
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Số điện thoại
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Email
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
                    value={row.tenAG}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "tenAG", e.target.value)
                    }
                    onFocus={() => setCurrentFocusRow(rowIndex)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      padding: "4px",
                    }}
                    placeholder="Nhập tên AG"
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <input
                    type="text"
                    value={row.sdt}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "sdt", e.target.value)
                    }
                    onFocus={() => setCurrentFocusRow(rowIndex)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      padding: "4px",
                    }}
                    placeholder="Nhập số điện thoại"
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <input
                    type="email"
                    value={row.mail}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "mail", e.target.value)
                    }
                    onFocus={() => setCurrentFocusRow(rowIndex)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      padding: "4px",
                    }}
                    placeholder="Nhập email"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button
          onClick={handleAddRow}
          variant="contained"
          color="primary"
          style={{ marginTop: "20px" }}
        >
          Thêm Hàng
        </Button>
        <Button
          onClick={handleOpenDeleteDialogForNormal}
          variant="contained"
          color="secondary"
          style={{ marginTop: "20px", marginLeft: "10px" }}
          disabled={selectedRows.length === 0}
        >
          Xóa Hàng Đã Chọn
        </Button>
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
                Tên AG
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Số điện thoại
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Email
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
                  {row.tenAG}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {row.sdt}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {row.mail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button
          onClick={handleOpenDeleteDialogForAPI}
          variant="contained"
          color="secondary"
          style={{ marginTop: "20px" }}
          disabled={selectedApiRows.length === 0}
        >
          Xóa Hàng Đã Chọn
        </Button>
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
