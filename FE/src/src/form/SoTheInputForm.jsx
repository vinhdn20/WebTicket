import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import Button from "@mui/material/Button";
import { refreshAccessToken } from "../constant";

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
  const [apiData, setApiData] = useState([
    { id: "", soThe: "" }
  ]);
  const [selectedRows, setSelectedRows] = useState([]); 
  const [selectedApiRows, setSelectedApiRows] = useState([]);
  const [currentFocusRow, setCurrentFocusRow] = useState(null);

  useEffect(() => {
    if (open) {
      fetchApiData();
    }else{
      setFormData([{ soThe: "" }]);
      setSelectedRows([]);
      setSelectedApiRows([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePaste = (e) => {
    e.preventDefault();
  
    const clipboardData = e.clipboardData.getData("text");
    const rows = clipboardData.split("\n").map((row) => row.split("\t"));
  
    if (currentFocusRow === null) return;
    const updatedFormData = [...formData];
    rows.forEach((rowValues, rowOffset) => {
      const targetRow = currentFocusRow + rowOffset;
      if (updatedFormData[targetRow]) {
        rowValues.forEach((cellValue, colOffset) => {
            updatedFormData[targetRow].soThe = cellValue;
        });
      }
    });
  
    setFormData(updatedFormData);
  };
  
  

  const fetchApiData = async () => {
    let accessToken = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://localhost:44331/Ve/card", {
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
          const retryResponse = await fetch("https://localhost:44331/Ve/card", {
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
          updateFormData(retryResult);
          return;
        } else {
          throw new Error("Failed to refresh access token");
        }
      }
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();
      updateFormData(result);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const updateFormData = (apiData) => {
    const mappedData = apiData.map((item) => ({
      id: item.id,
      soThe: item.soThe || "",
    }));
    setApiData(mappedData);
  };

  const handleCellChange = (rowIndex, field, value) => {
    setFormData((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex ? { ...row, [field]: value } : row
      )
    );
  };

  const handleAddRow = () => {
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
  };
  

  const handleSave = async () => {
    let accessToken = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://localhost:44331/Ve/card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      alert("Save success");
      onClose(null);
      fetchApiData();
    } catch (error) {
      console.error("Error saving data", error);
    }
  };

  const handleCheckboxChange = (rowIndex) => {
    setSelectedRows((prev) =>
      prev.includes(rowIndex)
        ? prev.filter((index) => index !== rowIndex)
        : [...prev, rowIndex]
    );
  };

  const handleDeleteSelectedRows = () => {
    setFormData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
  };

  const handleApiCheckboxChange = (id) => {
    setSelectedApiRows((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedApiRows = async () => {
    let accessToken = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://localhost:44331/Ve/card", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(selectedApiRows),
      });
      if (!response.ok) throw new Error("Delete failed");
      alert("Delete success");
      fetchApiData();
      setSelectedApiRows([]);
    } catch (error) {
      console.error("Error deleting data", error);
    }
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

      <div style={{ padding: "20px" }} onPaste={handlePaste}>
        <Typography variant="h6">Thêm mới số thẻ thanh toán</Typography>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}
              >
                Chọn
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Số thẻ thanh toán</th>
            </tr>
          </thead>
          <tbody>
            {formData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td
                  style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}
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

      <div style={{ padding: "20px" }}>
        <Typography variant="h6">Dữ liệu từ API</Typography>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}
              >
                Chọn
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Số thẻ thanh toán</th>
            </tr>
          </thead>
          <tbody>
            {apiData.map((row) => (
              <tr key={row.id}>
                <td
                  style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}
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
        <Button
          onClick={handleDeleteSelectedApiRows}
          variant="contained"
          color="secondary"
          style={{ marginTop: "20px" }}
          disabled={selectedApiRows.length === 0}
        >
          Xóa Hàng Đã Chọn
        </Button>
      </div>
    </Dialog>
  );
}