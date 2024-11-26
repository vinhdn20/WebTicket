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

export default function FullScreenDialog({ open, onClose }) {
  const [formData, setFormData] = useState([
    { tenAG: "", sdt: "", mail: "" },
  ]);
  const [apiData, setApiData] = useState([
    { id: "", tenAG: "", sdt: "", mail: "" }
  ]);
  const [selectedRows, setSelectedRows] = useState([]); // Lưu các hàng được chọn
  const [selectedApiRows, setSelectedApiRows] = useState([]);

  useEffect(() => {
    if (open) {
      fetchApiData();
    }else{
      setFormData([{ tenAG: "", sdt: "", mail: "" }]);
      setSelectedRows([]);
      setSelectedApiRows([]);
    }
  }, [open]);
  

  const fetchApiData = async () => {
    let accessToken = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://localhost:44331/Ve/ag", {
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
          const retryResponse = await fetch("https://localhost:44331/Ve/ag", {
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
      tenAG: item.tenAG || "",
      sdt: item.sdt || "",
      mail: item.mail || "",
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
    setFormData((prev) => [...prev, { tenAG: "", sdt: "", mail: "" }]);
  };

  const handleSave = async () => {
    let accessToken = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://localhost:44331/Ve/ag", {
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
      const response = await fetch("https://localhost:44331/Ve/ag", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(selectedApiRows),
      });
      if (!response.ok) throw new Error("Delete failed");
      alert("Delete success");
      fetchApiData(); // Refresh data after deletion
      setSelectedApiRows([]); // Clear selected rows
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
            Nhập bảng AG
          </Typography>
          <Button autoFocus color="inherit" onClick={handleSave}>
            Save
          </Button>
        </Toolbar>
      </AppBar>

      {/* Table for Input */}
      <div style={{ padding: "20px" }}>
        <Typography variant="h6">Thêm mới AG</Typography>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}
              >
                Chọn
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Tên AG</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Số điện thoại
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
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
                    value={row.tenAG}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "tenAG", e.target.value)
                    }
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
                    value={row.sdt}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "sdt", e.target.value)
                    }
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
                    value={row.mail}
                    onChange={(e) =>
                      handleCellChange(rowIndex, "mail", e.target.value)
                    }
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

      {/* Table for API Data */}
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
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Tên AG</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Số điện thoại
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
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