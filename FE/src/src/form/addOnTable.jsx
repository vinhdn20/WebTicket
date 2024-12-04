import React, { useEffect, useState, useCallback } from "react";
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

const AddOnTable = React.memo(function AddOnTable({
  open,
  onClose,
  initialData,
  setData,
  rowIndex,
  data,
  onSave,
}) {
  const [formData, setFormData] = useState(initialData);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentFocusRow, setCurrentFocusRow] = useState(null);
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();

      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData.split("\n").map((row) => row.split("\t"));
      if (currentFocusRow === null) return;

      const updatedFormData = [...formData];
      rows.forEach((rowValues, rowOffset) => {
        const targetRow = currentFocusRow + rowOffset;
        if (updatedFormData[targetRow]) {
          rowValues.forEach((cellValue, colOffset) => {
            if (colOffset === 0) {
              updatedFormData[targetRow].stt = cellValue;
            } else if (colOffset === 1) {
              updatedFormData[targetRow].dichVu = cellValue;
            } else if (colOffset === 2) {
              updatedFormData[targetRow].soTien = cellValue;
            }
          });
        }
      });

      setFormData(updatedFormData);
    },
    [formData, currentFocusRow]
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
    const cols = 3;
    const matrix = generateMatrixValues(currentRows + 1, cols, 11);

    setFormData((prev) => [
      ...prev,
      {
        stt: "",
        dichVu: "",
        soTien: "",
        matrixValue: matrix[currentRows],
      },
    ]);
  }, [formData]);

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

  const handleSaveAddOn = useCallback(() => {
    onSave(formData, rowIndex);
    onClose();
  }, [formData, rowIndex, onSave, onClose]);

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
            Nhập bảng Add on
          </Typography>
          <Button autoFocus color="inherit" onClick={handleSaveAddOn}>
            Save
          </Button>
        </Toolbar>
      </AppBar>

      {/* Table for Input */}
      <div style={{ padding: "20px" }} onPaste={handlePaste}>
        <Typography variant="h6">Thêm add</Typography>
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
                  {rowIndex + 1}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <input
                    type="text"
                    value={row.dichVu}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "dichVu", e.target.value)
                    }
                    onFocus={() => setCurrentFocusRow(rowIndex)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      padding: "4px",
                    }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <input
                    type="text"
                    value={row.soTien}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "soTien", e.target.value)
                    }
                    onFocus={() => setCurrentFocusRow(rowIndex)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      padding: "4px",
                    }}
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
          onClick={handleDeleteSelectedRows}
          variant="contained"
          color="secondary"
          style={{ marginTop: "20px", marginLeft: "10px" }}
          disabled={selectedRows.length === 0}
        >
          Xóa Hàng Đã Chọn
        </Button>
      </div>
    </Dialog>
  );
});

export default AddOnTable;
