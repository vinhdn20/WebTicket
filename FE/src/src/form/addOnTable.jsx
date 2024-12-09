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

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddOnTable = React.memo(function AddOnTable({
  open,
  onClose,
  initialData,
  setData,
  rowIndex,
  data,
  onSave,
  mode, // 'view' or 'edit'
}) {
  const [formData, setFormData] = useState(initialData);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentFocusRow, setCurrentFocusRow] = useState(null);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handlePaste = useCallback(
    (e) => {
      if (mode === "view") return; // Disable paste in view mode
      e.preventDefault();

      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData.split("\n").map((row) => row.split("\t"));
      if (currentFocusRow === null) {
        alert("Please select a row to paste data into.");
        return;
      }

      const updatedFormData = [...formData];
      rows.forEach((rowValues, rowOffset) => {
        const targetRow = currentFocusRow + rowOffset;
        if (updatedFormData[targetRow]) {
          rowValues.forEach((cellValue, colOffset) => {
            if (colOffset === 0) {
              updatedFormData[targetRow].dichVu = cellValue;
            } else if (colOffset === 1) {
              updatedFormData[targetRow].soTien = cellValue;
            }
          });
        } else {
          updatedFormData.push({
            dichVu: rowValues[0] || "",
            soTien: rowValues[1] || "",
          });
        }
      });

      setFormData(updatedFormData);
    },
    [formData, mode, currentFocusRow]
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
    setFormData((prev) => [...prev, { stt: "", dichVu: "", soTien: "" }]);
  }, [mode]);

  const handleDeleteSelectedRows = useCallback(() => {
    if (mode === "view") return; // Disable deletion in view mode
    setFormData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
  }, [selectedRows, mode]);

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
    const hasEmptyFields = formData.some((row) => !row.dichVu || !row.soTien);
    if (hasEmptyFields) {
      alert("Vui lòng nhập đầy đủ Dịch vụ và Số tiền cho mỗi hàng.");
      return;
    }
    console.log(formData, rowIndex);
    onSave(formData, rowIndex);
    onClose();
  }, [formData, rowIndex, onSave, onClose, mode]);

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
            {formData.map((row, rowIndex) => (
              <tr key={rowIndex}>
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
                      checked={selectedRows.includes(rowIndex)}
                      onChange={() => handleCheckboxChange(rowIndex)}
                      disabled={mode === "view"}
                      aria-label={`Chọn add on hàng ${rowIndex + 1}`}
                    />
                  </td>
                )}
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {rowIndex + 1}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {mode === "view" ? (
                    row.dichVu
                  ) : (
                    <input
                      type="text"
                      value={row.dichVu}
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "dichVu", e.target.value)
                      }
                      disabled={mode === "view"}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        padding: "4px",
                      }}
                      aria-label={`Dịch vụ hàng ${rowIndex + 1}`}
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
                      onFocus={() => setCurrentFocusRow(rowIndex)}
                      onChange={(e) =>
                        handleCellChange(rowIndex, "soTien", e.target.value)
                      }
                      disabled={mode === "view"}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        padding: "4px",
                      }}
                      aria-label={`Số tiền hàng ${rowIndex + 1}`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mode !== "view" && (
          <>
            <Button
              onClick={handleAddRow}
              variant="contained"
              color="primary"
              style={{ marginTop: "20px" }}
            >
              Thêm Hàng
            </Button>
            <Button
              onClick={handleDeleteSelectedRows}
              variant="contained"
              color="secondary"
              style={{ marginTop: "20px", marginLeft: "10px" }}
              disabled={selectedRows.length === 0}
            >
              Xóa Hàng Đã Chọn
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
});

AddOnTable.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.arrayOf(
    PropTypes.shape({
      stt: PropTypes.string,
      dichVu: PropTypes.string,
      soTien: PropTypes.string,
    })
  ).isRequired,
  setData: PropTypes.func.isRequired,
  rowIndex: PropTypes.number,
  data: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["view", "edit"]).isRequired,
};

export default AddOnTable;
