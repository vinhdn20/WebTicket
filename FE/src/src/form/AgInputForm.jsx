import React from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { processResult, refreshAccessToken } from "../constant";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function FullScreenDialog({ open, onClose, data }) {
  const [formData, setFormData] = React.useState({
    tenAG: "",
    sdt: "",
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    let accessToken = localStorage.getItem("accessToken");
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
        // Token expired or unauthorized, refresh the token
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the original request with the new token
          accessToken = newToken;
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
              "Failed to fetch data after refreshing token: " +
                retryResponse.statusText
            );
          }
          const retryResult = await retryResponse.json();
          return processResult(retryResult);
        } else {
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Save success", data);
      onClose(null);
    } catch (error) {
      console.error("Error saving data", error);
    }
  };

  return (
    <Dialog fullScreen open={open} TransitionComponent={Transition}>
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
      <div style={{ display: "flex" }}>
        <div style={{ margin: "50px" }}>
          <TextField
            id="outlined-multiline-flexible"
            label="Tên AG"
            name="tenAG"
            value={formData.tenAG}
            onChange={handleChange}
            multiline
            maxRows={4}
          />
        </div>
        <div style={{ margin: "50px" }}>
          <TextField
            id="outlined-multiline-flexible"
            label="Số điện thoại"
            name="sdt"
            value={formData.sdt}
            onChange={handleChange}
            multiline
            maxRows={4}
          />
        </div>
        <div style={{ margin: "50px" }}>
          <TextField
            id="outlined-multiline-flexible"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            multiline
            maxRows={4}
          />
        </div>
        <div style={{ margin: "50px" }}>
          <button onClick={handleSave}>Lưu AG</button>
        </div>
      </div>
      <hr width="30%" align="center" style={{ marginBottom: "25px" }} />
    </Dialog>
  );
}
