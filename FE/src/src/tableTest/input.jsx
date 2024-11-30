import React, { useState } from "react";
import "../style/table.css";
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import FullScreenDialog from "./AgInputForm";
import { processResult, refreshAccessToken } from "../constant";
import { TextField } from "@mui/material";

const InputForm = ({ onTicketCreated }) => {
  // Form state management
  const [data, setData] = useState({
    sdt: "",
    mail: "",
    tenAG: "",
    changDi: "",
    ngayGioBayDi: "",
    changVe: "",
    ngayGioBayDen: "",
    maDatChoHang: "",
    tenKhachHang: "",
    gioiTinh: "Nam",
    addOn: "",
    maDatChoTrip: "",
    thuAG: "",
    giaXuat: "",
    soThe: "",
    taiKhoan: "",
    luuY: "",
    veHoanKhay: "Có",
  });
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = useState([]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log("thanh cong")
    setData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


  async function callCreateTicketAPI(ticketData) {
    let accessToken = localStorage.getItem("accessToken");

    try {
      const response = await fetch("https://localhost:7113/Ve/xuatVe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },

        body: JSON.stringify(ticketData),
      });

      if (response.status === 401) {
        // Token expired or unauthorized, refresh the token
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the original request with the new token
          accessToken = newToken;
          const retryResponse = await fetch("https://localhost:7113/ve/filter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(ticketData),
          });

          if (!retryResponse.ok) {
            throw new Error("Failed to fetch data after refreshing token: " + retryResponse.statusText);
          }
          const retryResult = await retryResponse.json();
          return processResult(retryResult);
        } else {
         window.location.href = "/";
 throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating ticket:", error);
      throw error;
    }
  }

  // Handle form submission
  const handleAddTicket = async (e) => {
    e.preventDefault();

    const formattedTicket = {
      ngayXuat: new Date().toISOString(),
      changDi: data.changDi,
      ngayGioBayDi: data.ngayGioBayDi ? new Date(data.ngayGioBayDi).toISOString() : new Date().toISOString(),
      changVe: data.changVe,
      ngayGioBayDen: data.ngayGioBayDen ? new Date(data.ngayGioBayDen).toISOString() : new Date().toISOString(),
      maDatChoHang: data.maDatChoHang,
      addOn: data.addOn,
      maDatChoTrip: data.maDatChoTrip,
      thuAG: data.thuAG,
      giaXuat: data.giaXuat,
      luuY: data.luuY,
      veHoanKhay: data.veHoanKhay,
      agCustomer: {
        tenAG: data.tenAG,
        mail: data.mail,
        sdt: data.sdt,
      },
      customer: {
        tenKhachHang: data.tenKhachHang,
        gioiTinh: data.gioiTinh,
      },
      card: {
        soThe: data.soThe,
      },
      taiKhoan: data.taiKhoan,
    };

    try {
      await callCreateTicketAPI(formattedTicket);
      setData({
        sdt: "",
        mail: "",
        tenAG: "",
        changDi: "",
        ngayGioBayDi: "",
        changVe: "",
        ngayGioBayDen: "",
        maDatChoHang: "",
        tenKhachHang: "",
        gioiTinh: "Nam",
        addOn: "",
        maDatChoTrip: "",
        thuAG: "",
        giaXuat: "",
        soThe: "",
        taiKhoan: "",
        luuY: "",
        veHoanKhay: "Có",
      });
      alert("Vé đã tạo thành công!");
      onTicketCreated();
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo vé. Vui lòng thử lại.");
    }
  };


  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleDialogClose = (updatedData) => {
    setOpen(false);
  };

  const fetchPhoneNumbers = async () => {
    let accessToken = localStorage.getItem("accessToken");
    try {
      const response = await fetch("https://localhost:7113/Ve/ag", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch phone numbers.");
      }
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          const retryResponse = await fetch("https://localhost:7113/Ve/ag", {
            method: "POST",
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
          return processResult(retryResult);
        } else {
         window.location.href = "/";
 throw new Error("Failed to refresh access token");
        }
      }
      const result = await response.json();
      setOptions(result);
      console.log(result);
    } catch (error) {
      alert("Không thể tải dữ liệu số điện thoại.");
    }
  };

  const handlePhoneSelect = (event, newValue) => {
    if (newValue) {
      setData((prev) => ({
        ...prev,
        sdt: newValue.sdt,
        mail: newValue.mail,
        tenAG: newValue.tenAG,
      }));
    }
  };

  return (
    <div className="container">
      <h1>Hệ thống xuất vé</h1>
      <hr width="30%" align="center" style={{ marginBottom: "25px" }} />
      <div className="tittle">
        <h3>Nhập Liệu</h3>
      </div>
      <Button variant="outlined" onClick={handleClickOpen} className="button-container" style={{ marginBottom: "15px" }}>
        Nhập bảng AG
      </Button>
      <FullScreenDialog open={open} setOpen={setOpen} onClose={handleDialogClose} data={data} />
      <form className="form-container" onSubmit={handleAddTicket}>
        <div>
          <label>Ngày xuất:</label>
          <input type="text" value={new Date().toLocaleString()} disabled />
        </div>
        <div>
          <label>Liên hệ (SĐT):</label>
          <Autocomplete
            options={options}
            getOptionLabel={(option) => option.sdt || ""}
            onFocus={fetchPhoneNumbers} // Gọi API khi focus vào ô input
            onChange={handlePhoneSelect} // Gắn dữ liệu khi chọn một số
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                sx={{
                  '& .MuiInputBase-input': {
                    minWidth: "100%!important",
                    border: 'none',
                  },
                  '& .MuiInputBase-root': {
                    height: "33px !important",
                    marginTop: "5px",
                    justifyContent: "center"
                  }
                }}
                value={data.sdt}
                onChange={handleInputChange}
              />
            )}
          />
        </div>
        <div>
          <label>Mail:</label>
          <input type="email" name="mail" value={data.mail} onChange={handleInputChange} />
        </div>
        <div>
          <label>Tên AG:</label>
          <input type="text" name="tenAG" value={data.tenAG} onChange={handleInputChange} />
        </div>
        <div>
          <label>Chặng bay đi:</label>
          <input type="text" name="changDi" value={data.changDi} onChange={handleInputChange} />
        </div>
        <div>
          <label>Ngày giờ bay đi:</label>
          <input type="datetime-local" name="ngayGioBayDi" value={data.ngayGioBayDi} onChange={handleInputChange} />
        </div>
        <div>
          <label>Chặng bay đến:</label>
          <input type="text" name="changVe" value={data.changVe} onChange={handleInputChange} />
        </div>
        <div>
          <label>Ngày giờ bay đến:</label>
          <input type="datetime-local" name="ngayGioBayDen" value={data.ngayGioBayDen} onChange={handleInputChange} />
        </div>
        <div>
          <label>Mã đặt chỗ hãng:</label>
          <input type="text" name="maDatChoHang" value={data.maDatChoHang} onChange={handleInputChange} />
        </div>
        <div>
          <label>Tên khách hàng:</label>
          <input type="text" name="tenKhachHang" value={data.tenKhachHang} onChange={handleInputChange} />
        </div>
        <div>
          <label>Giới tính:</label>
          <select name="gioiTinh" value={data.gioiTinh} onChange={handleInputChange}>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
        <div>
          <label>Add on:</label>
          <input type="text" name="addOn" value={data.addOn} onChange={handleInputChange} />
        </div>
        <div>
          <label>Mã đặt chỗ trip:</label>
          <input type="text" name="maDatChoTrip" value={data.maDatChoTrip} onChange={handleInputChange} />
        </div>
        <div>
          <label>Thu AG:</label>
          <input type="number" name="thuAG" value={data.thuAG} onChange={handleInputChange} />
        </div>
        <div>
          <label>Giá xuất:</label>
          <input type="number" name="giaXuat" value={data.giaXuat} onChange={handleInputChange} />
        </div>
        <div>
          <label>Số thẻ thanh toán:</label>
          <textarea rows="1" name="soThe" value={data.soThe} onChange={handleInputChange}></textarea>
        </div>
        <div>
          <label>Tài khoản:</label>
          <textarea rows="3" name="taiKhoan" value={data.taiKhoan} onChange={handleInputChange}></textarea>
        </div>
        <div>
          <label>Lưu ý:</label>
          <textarea rows="3" name="luuY" value={data.luuY} onChange={handleInputChange}></textarea>
        </div>
        <div>
          <label>Vé có hoàn hay không:</label>
          <select name="veHoanKhay" value={data.veHoanKhay} onChange={handleInputChange}>
            <option value="Có">Có</option>
            <option value="Không">Không</option>
          </select>
        </div>
        <div className="button-container">
          <button type="submit">Xuất Vé</button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;