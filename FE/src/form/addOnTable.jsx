// src/form/AddOnTable.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
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

  useEffect(() => {
    setFormData(initialData);
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
      if (mode === "view") return; // Disable edits in view mode
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

    onSave(cleanedFormData, rowIndex);
    openSnackbarHandler("Add-On data saved successfully.", "success");
    onClose();
  }, [formData, rowIndex, onSave, onClose, mode, openSnackbarHandler]);

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
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {mode === "view" ? "Xem bảng Add On" : "Nhập bảng Add On"}
            </Typography>
            {mode !== "view" && (
              <Button autoFocus color="inherit" onClick={handleSaveAddOn}>
                Save
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* Table for Input */}
        <div style={{ padding: "20px" }} onPaste={handlePaste}>
          <Typography variant="h6">Thêm add</Typography>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {mode !== "view" && (
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    Chọn
                  </th>
                )}
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Stt</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Dịch vụ
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Số tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {mode !== "view" && (
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowIdx)}
                        onChange={() => handleCheckboxChange(rowIdx)}
                        aria-label={`Chọn add on hàng ${rowIdx + 1}`}
                      />
                    </td>
                  )}
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {rowIdx + 1}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {mode === "view" ? (
                      row.dichVu
                    ) : (
                      <input
                        type="text"
                        value={row.dichVu}
                        onFocus={() => setCurrentFocusRow(rowIdx)}
                        onChange={(e) =>
                          handleCellChange(rowIdx, "dichVu", e.target.value)
                        }
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          padding: "4px",
                        }}
                        aria-label={`Dịch vụ hàng ${rowIdx + 1}`}
                      />
                    )}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {mode === "view" ? (
                      row.soTien
                    ) : (
                      <input
                        type="text"
                        value={row.soTien}
                        onFocus={() => setCurrentFocusRow(rowIdx)}
                        onChange={(e) =>
                          handleCellChange(rowIdx, "soTien", e.target.value)
                        }
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          padding: "4px",
                        }}
                        aria-label={`Số tiền hàng ${rowIdx + 1}`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mode !== "view" && (
            <div style={{ marginTop: "20px" }}>
              <Button
                onClick={handleAddRow}
                variant="contained"
                color="primary"
                style={{ marginRight: "10px" }}
                aria-label="Thêm hàng"
              >
                Thêm Hàng
              </Button>
              <Button
                onClick={handleDeleteSelectedRows}
                variant="contained"
                color="secondary"
                disabled={selectedRows.length === 0}
                style={{ marginLeft: "10px" }}
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
