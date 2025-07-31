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
          soThe: "",
          matrixValue: [],
        },
      ]);
      setSelectedRows([]);
      setSelectedApiRows([]);
    }
  }, [open, fetchApiData]);

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData
        .split("\n")
        .map((row) => row.split("\t"))
        .filter((row) => row.some((cell) => cell.trim() !== ""));
      if (currentFocusRow === null) return;
      setFormData((prevFormData) => {
        let updatedFormData = [...prevFormData];
        const requiredRows = currentFocusRow + rows.length;
        if (requiredRows > updatedFormData.length) {
          const cols = 1;
          const matrix = generateMatrixValues(requiredRows, cols, 11);
          for (let i = updatedFormData.length; i < requiredRows; i++) {
            updatedFormData.push({
              soThe: "",
              matrixValue: matrix[i],
            });
          }
        }
        rows.forEach((rowValues, rowOffset) => {
          const targetRow = currentFocusRow + rowOffset;
          if (updatedFormData[targetRow]) {
            if (rowValues[0] !== undefined) updatedFormData[targetRow].soThe = rowValues[0];
          }
        });
        return updatedFormData;
      });
    },
    [currentFocusRow]
  );

  const handleCellChange = useCallback((rowIndex, field, value) => {
    setFormData((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex ? { ...row, [field]: value } : row
      )
    );
  }, []);

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
      if (!row.soThe) {
        openSnackbar(
          "Vui lòng điền đầy đủ số thẻ thanh toán cho tất cả các hàng.",
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      try {
        const accessToken = localStorage.getItem("accessToken");
        const response = await fetch(`${API_URL}/Card/import`, {
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
        if (result) {
          setFormData(result.map(({ tenAG, sdt, mail }) => ({ tenAG, sdt, mail })));
          openSnackbar(result.message, "success");
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
            Nhập bảng số thẻ thanh toán
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
            onClick={() => importDataFromApi()}
            style={{
              backgroundColor: "#4caf50",
              color: "#fff",
              marginRight: "30px",
            }}
          >
            Import dữ liệu
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
              <input
                type="checkbox"
                checked={formData.length > 0 && selectedRows.length === formData.length}
                indeterminate={selectedRows.length > 0 && selectedRows.length < formData.length}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedRows(formData.map((_, idx) => idx));
                  } else {
                    setSelectedRows([]);
                  }
                }}
                style={{ cursor: "pointer" }}
              />
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
            onClick={handleOpenDeleteDialogForNormal}
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
                <input
                  type="checkbox"
                  checked={apiData.length > 0 && selectedApiRows.length === apiData.length}
                  indeterminate={selectedApiRows.length > 0 && selectedApiRows.length < apiData.length}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedApiRows(apiData.map(row => row.id));
                    } else {
                      setSelectedApiRows([]);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />
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
            onClick={handleOpenDeleteDialogForAPI}
            variant="contained"
            color="secondary"
            disabled={selectedApiRows.length === 0}
          >
            Xóa Hàng Đã Chọn
          </Button>
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
