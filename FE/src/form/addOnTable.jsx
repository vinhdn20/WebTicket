// src/form/AddOnTable.jsx
import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import { Snackbar, Alert } from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddOnTable = React.memo(function AddOnTable({
  open,
  onClose,
  initialData,
  // setData, // Removed if not used
  rowIndex,
  // data, // Removed if not used
  onSave,
  mode, // 'view' or 'edit'
}) {
  const [formData, setFormData] = useState(initialData);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentFocusRow, setCurrentFocusRow] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Format number with dot as thousand separator
  const formatMoney = (value) => {
    if (!value) return "";
    // Remove all non-digit
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Only keep digits for saving
  const unformatMoney = (value) => value.replace(/\D/g, "");

  // Khi initialData thay đổi, format lại số tiền cho tất cả các dòng
  useEffect(() => {
    setFormData(
      initialData.map(row => ({
        ...row,
        soTien: formatMoney(row.soTien || "")
      }))
    );
  }, [initialData]);

  // Snackbar Handlers
  const openSnackbarHandler = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbarHandler = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handlePaste = useCallback(
    (e) => {
      if (mode === "view") return; // Disable paste in view mode
      e.preventDefault();

      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData.split("\n").map((row) => row.split("\t"));

      if (currentFocusRow === null) {
        openSnackbarHandler("Please select a row to paste data into.", "warning");
        return;
      }

      const updatedFormData = [...formData];
      rows.forEach((rowValues, rowOffset) => {
        const targetRow = currentFocusRow + rowOffset;
        const dichVu = rowValues[0]?.trim();
        const soTien = rowValues[1]?.trim();

        // Only update or add row if at least one field is present
        if (dichVu || soTien) {
          if (updatedFormData[targetRow]) {
            updatedFormData[targetRow].dichVu = dichVu || updatedFormData[targetRow].dichVu;
            updatedFormData[targetRow].soTien = soTien || updatedFormData[targetRow].soTien;
          } else {
            updatedFormData.push({
              dichVu: dichVu || "",
              soTien: soTien || "",
            });
          }
        }
      });

      setFormData(updatedFormData);
      openSnackbarHandler("Data pasted successfully.", "success");
    },
    [formData, mode, currentFocusRow, openSnackbarHandler]
  );



  const handleCellChange = useCallback(
    (rowIdx, field, value) => {
      if (mode === "view") return;
      if (field === "soTien") {
        // Only allow digits, format with dot
        value = formatMoney(value);
      }
      setFormData((prev) =>
        prev.map((row, idx) =>
          idx === rowIdx ? { ...row, [field]: value } : row
        )
      );
    },
    [mode]
  );

  const handleAddRow = useCallback(() => {
    if (mode === "view") return; // Disable adding rows in view mode
    setFormData((prev) => [...prev, { dichVu: "", soTien: "" }]);
    openSnackbarHandler("New row added.", "info");
  }, [mode, openSnackbarHandler]);

  const handleDeleteSelectedRows = useCallback(() => {
    if (mode === "view") return; // Disable deletion in view mode
    setFormData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
    openSnackbarHandler("Selected rows deleted.", "info");
  }, [selectedRows, mode, openSnackbarHandler]);

  const handleCheckboxChange = useCallback(
    (rowIdx) => {
      if (mode === "view") return; // Disable selection in view mode
      setSelectedRows((prev) =>
        prev.includes(rowIdx)
          ? prev.filter((idx) => idx !== rowIdx)
          : [...prev, rowIdx]
      );
    },
    [mode]
  );

  const handleSaveAddOn = useCallback(() => {
    if (mode === "view") {
      onClose();
      return;
    }

    // Remove any completely empty rows before validation
    const cleanedFormData = formData.filter(
      (row) => row.dichVu.trim() !== "" || row.soTien.trim() !== ""
    );

    const hasEmptyFields = cleanedFormData.some(
      (row) => !row.dichVu.trim() || !row.soTien.trim()
    );
    if (hasEmptyFields) {
      openSnackbarHandler("Vui lòng nhập đầy đủ Dịch vụ và Số tiền cho mỗi hàng.", "warning");
      return;
    }

    // Convert soTien to number string (remove dot)
    const sendData = cleanedFormData.map(row => ({
      ...row,
      soTien: unformatMoney(row.soTien)
    }));

    onSave(sendData);
    openSnackbarHandler("Add-On data saved successfully.", "success");
    onClose();
  }, [formData, onSave, onClose, mode, openSnackbarHandler]);

  return (
    <>
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
        <AppBar sx={{ position: "relative", borderRadius: '10px 10px 0 0', background: '#1976d2' }} elevation={2}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
              sx={{ mr: 2 }}
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1, fontWeight: 600, letterSpacing: 1 }} variant="h6" component="div">
              {mode === "view" ? "Xem bảng Add On" : "Nhập bảng Add On"}
            </Typography>
            {mode !== "view" && (
              <Button autoFocus color="primary" variant="contained" onClick={handleSaveAddOn} sx={{ fontWeight: 600, boxShadow: 1 }}>
                Lưu
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* Table for Input */}
        <div style={{ padding: "32px 32px 16px 32px", background: '#f7fafd', minHeight: '100%' }} onPaste={handlePaste}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>Thêm Add-On</Typography>
          <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 2px 8px #0001', background: '#fff' }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#e3f0fb' }}>
                  {mode !== "view" && (
                    <th
                      style={{
                        border: "none",
                        padding: "12px 8px",
                        textAlign: "center",
                        fontWeight: 600,
                        color: '#1976d2',
                        minWidth: 60,
                        borderTopLeftRadius: 12
                      }}
                    >
                      Chọn
                    </th>
                  )}
                  <th style={{ border: "none", padding: "12px 8px", fontWeight: 600, color: '#1976d2', minWidth: 60 }}>Stt</th>
                  <th style={{ border: "none", padding: "12px 8px", fontWeight: 600, color: '#1976d2', minWidth: 200 }}>Dịch vụ</th>
                  <th style={{ border: "none", padding: "12px 8px", fontWeight: 600, color: '#1976d2', minWidth: 120, borderTopRightRadius: 12 }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {formData.map((row, rowIdx) => (
                  <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? '#f7fafd' : '#fff', transition: 'background 0.2s', cursor: mode !== 'view' ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (mode !== 'view') e.currentTarget.style.background = '#e3f0fb'; }}
                    onMouseLeave={e => { if (mode !== 'view') e.currentTarget.style.background = rowIdx % 2 === 0 ? '#f7fafd' : '#fff'; }}
                  >
                    {mode !== "view" && (
                      <td
                        style={{
                          border: "none",
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(rowIdx)}
                          onChange={() => handleCheckboxChange(rowIdx)}
                          aria-label={`Chọn add on hàng ${rowIdx + 1}`}
                          style={{ width: 18, height: 18, accentColor: '#1976d2' }}
                        />
                      </td>
                    )}
                    <td
                      style={{
                        border: mode === 'view' ? 'none' : undefined,
                        borderRight: mode === 'view' ? '1px solid #e0e0e0' : undefined,
                        padding: "8px",
                        textAlign: 'center',
                        fontWeight: 500
                      }}
                    >
                      {rowIdx + 1}
                    </td>
                    <td
                      style={{
                        border: mode === 'view' ? 'none' : undefined,
                        borderRight: mode === 'view' ? '1px solid #e0e0e0' : undefined,
                        padding: "8px",
                        textAlign: mode === 'view' ? 'center' : undefined
                      }}
                    >
                      {mode === "view" ? (
                        row.dichVu
                      ) : (
                        <input
                          type="text"
                          value={row.dichVu}
                          onFocus={() => setCurrentFocusRow(rowIdx)}
                          onChange={(e) => handleCellChange(rowIdx, "dichVu", e.target.value)}
                          placeholder="Nhập dịch vụ..."
                          style={{
                            width: "100%",
                            border: "1px solid #cfe2ff",
                            outline: "none",
                            padding: "6px 8px",
                            borderRadius: 6,
                            background: '#fafdff',
                            fontSize: 15
                          }}
                          aria-label={`Dịch vụ hàng ${rowIdx + 1}`}
                        />
                      )}
                    </td>
                    <td
                      style={{
                        border: mode === 'view' ? 'none' : undefined,
                        padding: "8px",
                        textAlign: mode === 'view' ? 'center' : undefined,
                        fontVariantNumeric: mode === 'view' ? 'tabular-nums' : undefined
                      }}
                    >
                      {mode === "view" ? (
                        formatMoney(row.soTien)
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.soTien}
                          onFocus={() => setCurrentFocusRow(rowIdx)}
                          onChange={(e) => handleCellChange(rowIdx, "soTien", e.target.value)}
                          placeholder="Nhập số tiền..."
                          style={{
                            width: "100%",
                            border: "1px solid #cfe2ff",
                            outline: "none",
                            padding: "6px 8px",
                            borderRadius: 6,
                            background: '#fafdff',
                            fontSize: 15
                          }}
                          aria-label={`Số tiền hàng ${rowIdx + 1}`}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mode !== "view" && (
            <div style={{ marginTop: "24px", display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
              <Button
                onClick={handleAddRow}
                variant="contained"
                color="primary"
                sx={{ fontWeight: 600, borderRadius: 2, boxShadow: 1 }}
                aria-label="Thêm hàng"
              >
                Thêm Hàng
              </Button>
              <Button
                onClick={handleDeleteSelectedRows}
                variant="contained"
                color="error"
                disabled={selectedRows.length === 0}
                sx={{ fontWeight: 600, borderRadius: 2, boxShadow: 1 }}
                aria-label="Xóa hàng đã chọn"
              >
                Xóa Hàng Đã Chọn
              </Button>
            </div>
          )}
        </div>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbarHandler}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbarHandler}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
});

AddOnTable.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.arrayOf(
    PropTypes.shape({
      dichVu: PropTypes.string,
      soTien: PropTypes.string,
    })
  ).isRequired,
  // setData: PropTypes.func.isRequired, // Removed if not used
  rowIndex: PropTypes.number.isRequired,
  // data: PropTypes.array.isRequired, // Removed if not used
  onSave: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["view", "edit"]).isRequired,
};

export default AddOnTable;
