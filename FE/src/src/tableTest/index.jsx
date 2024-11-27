import React, { useState } from "react";
import "../style/table.css";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import FullScreenDialog from "../form/AgInputForm";
import { TextField } from "@mui/material";
import { refreshAccessToken } from "../constant";


const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000; // Lấy độ lệch múi giờ
  const localDateTime = new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16); // Định dạng YYYY-MM-DDTHH:mm
  return localDateTime;
};

const InputTable = ({ onTicketCreated }) => {
  const [data, setData] = useState([{
    ngayXuat: getCurrentDateTimeLocal(),
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
  }]);
  const [selectedRows, setSelectedRows] = useState([]); // Danh sách hàng được chọn
  const [phoneOptions, setPhoneOptions] = useState([]);
  const [open, setOpen] = React.useState(false);

  const columns = [
    { Header: "Chọn", accessor: "select" },
    { Header: "Ngày xuất", accessor: "ngayXuat" },
    { Header: "Liên hệ (SĐT)", accessor: "sdt" },
    { Header: "Mail", accessor: "mail" },
    { Header: "Tên AG", accessor: "tenAG" },
    { Header: "Chặng bay đi", accessor: "changDi" },
    { Header: "Ngày giờ bay đi", accessor: "ngayGioBayDi" },
    { Header: "Chặng bay đến", accessor: "changVe" },
    { Header: "Ngày giờ bay đến", accessor: "ngayGioBayDen" },
    { Header: "Mã đặt chỗ hãng", accessor: "maDatChoHang" },
    { Header: "Tên khách hàng", accessor: "tenKhachHang" },
    { Header: "Giới tính", accessor: "gioiTinh" },
    { Header: "Add on", accessor: "addOn" },
    { Header: "Mã đặt chỗ trip", accessor: "maDatChoTrip" },
    { Header: "Thu AG", accessor: "thuAG" },
    { Header: "Giá xuất", accessor: "giaXuat" },
    { Header: "Số thẻ thanh toán", accessor: "soThe" },
    { Header: "Tài khoản", accessor: "taiKhoan" },
    { Header: "Lưu ý", accessor: "luuY" },
    { Header: "Vé hoàn khay", accessor: "veHoanKhay" },
  ];

  async function callCreateTicketAPI(ticketDataArray) {
    let accessToken = localStorage.getItem("accessToken");

    try {
      const response = await fetch("https://localhost:7113/Ve/xuatVe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(ticketDataArray), // Gửi toàn bộ mảng payload
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          const retryResponse = await fetch("https://localhost:7113/Ve/xuatVe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(ticketDataArray),
          });

          if (!retryResponse.ok) {
            throw new Error("Failed after token refresh: " + retryResponse.statusText);
          }
          return await retryResponse.json();
        } else {
          throw new Error("Failed to refresh access token");
        }
      }
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating tickets:", error);
      throw error;
    }
  }


  const handleAddTicket = async (e) => {
    e.preventDefault();
    for (const row of data) {
      if (!row.ngayGioBayDi || !row.ngayGioBayDen) {
        alert("Vui lòng nhập đầy đủ ngày giờ bay đi và ngày giờ bay đến.");
        return;
      }
      if (!row.soThe) {
        alert("Vui lòng nhập số thẻ thanh toán.");
        return;
      }
      if (!row.tenKhachHang) {
        alert("Vui lòng nhập tên khách hàng.");
        return;
      }
    }

    const formattedTickets = data.map((row) => ({
      ngayXuat: new Date().toISOString(),
      changDi: row.changDi,
      ngayGioBayDi: row.ngayGioBayDi ? new Date(row.ngayGioBayDi).toISOString() : new Date().toISOString(),
      changVe: row.changVe,
      ngayGioBayDen: row.ngayGioBayDen ? new Date(row.ngayGioBayDen).toISOString() : new Date().toISOString(),
      maDatChoHang: row.maDatChoHang,
      addOn: row.addOn,
      maDatChoTrip: row.maDatChoTrip,
      thuAG: row.thuAG,
      giaXuat: row.giaXuat,
      luuY: row.luuY,
      veHoanKhay: row.veHoanKhay,
      agCustomer: {
        tenAG: row.tenAG,
        mail: row.mail,
        sdt: row.sdt,
      },
      customer: {
        tenKhachHang: row.tenKhachHang,
        gioiTinh: row.gioiTinh,
      },
      card: {
        soThe: row.soThe,
      },
      taiKhoan: row.taiKhoan,
    }));

    try {
      await callCreateTicketAPI(formattedTickets);
      onTicketCreated();
      alert("Vé đã tạo thành công!");
      setData([]);
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo vé. Vui lòng thử lại.");
      console.error("Error creating tickets:", error);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
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

      const result = await response.json();
      setPhoneOptions(result);
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
      alert("Không thể tải danh sách số điện thoại.");
    }
  };

  // Hàm thêm hàng mới
  const handleAddRow = () => {
    const newRow = columns.reduce((acc, col) => {
      acc[col.accessor] =
        col.accessor === "ngayXuat"
          ? getCurrentDateTimeLocal()
          : col.accessor === "gioiTinh"
            ? "Nam"
            : col.accessor === "veHoanKhay"
              ? "Có"
              : "";
      return acc;
    }, {});
    setData((prevData) => [...prevData, newRow]);
  };

  // Hàm cập nhật dữ liệu
  const handleCellEdit = (rowIndex, columnId, value) => {
    const updatedData = [...data];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [columnId]: value,
      error: {
        ...updatedData[rowIndex].error,
        [columnId]: columnId === "ngayGioBayDi" || columnId === "ngayGioBayDen" ? !value : false,
      },
    };
    setData(updatedData);
  };


  // Hàm xử lý chọn số điện thoại từ Autocomplete
  const handlePhoneSelect = (rowIndex, newValue) => {
    const updatedData = [...data];
    if (newValue) {
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        sdt: newValue.sdt || "",
        tenAG: newValue.tenAG || "",
        mail: newValue.mail || "",
      };
    } else {
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        sdt: "",
        tenAG: "",
        mail: "",
      };
    }
    setData(updatedData);
  };

  // Hàm xử lý chọn hàng
  const handleSelectRow = (rowIndex, isSelected) => {
    if (isSelected) {
      setSelectedRows((prevSelected) => [...prevSelected, rowIndex]);
    } else {
      setSelectedRows((prevSelected) =>
        prevSelected.filter((index) => index !== rowIndex)
      );
    }
  };

  // Hàm xóa các hàng đã chọn
  const handleDeleteRows = () => {
    const updatedData = data.filter(
      (_, index) => !selectedRows.includes(index)
    );
    setData(updatedData);
    setSelectedRows([]); // Reset danh sách hàng được chọn
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleDialogClose = (updatedData) => {
    setOpen(false);
  };

  return (
    <>
      <div className="table-wrapper">
        <h1>Bảng Nhập Dữ Liệu</h1>
        <Button
          variant="outlined"
          onClick={handleClickOpen}
          className="button-container"
          style={{ marginBottom: "15px" }}
        >
          Nhập bảng AG
        </Button>
        <FullScreenDialog
          open={open}
          setOpen={setOpen}
          onClose={handleDialogClose}
          data={data}
        />
        <table className="table-container">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.accessor}>{column.Header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.accessor}>
                    {column.accessor === "select" ? (
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowIndex)}
                        onChange={(e) =>
                          handleSelectRow(rowIndex, e.target.checked)
                        }
                      />
                    ) : column.accessor === "sdt" ? (
                      <Autocomplete
                        options={phoneOptions}
                        getOptionLabel={(option) => option.sdt || ""}
                        value={
                          phoneOptions.find((opt) => opt.sdt === row.sdt) ||
                          null
                        }
                        onFocus={fetchPhoneNumbers}
                        onChange={(event, newValue) =>
                          handlePhoneSelect(rowIndex, newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            placeholder="Nhập số điện thoại"
                          />
                        )}
                        style={{ width: '220px' }}
                      />
                    ) : column.accessor === "gioiTinh" ? (
                      <select
                        value={row.gioiTinh || "Nam"}
                        onChange={(e) =>
                          handleCellEdit(rowIndex, "gioiTinh", e.target.value)
                        }
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    ) : column.accessor === "veHoanKhay" ? (
                      <select
                        value={row.veHoanKhay || "Có"}
                        onChange={(e) =>
                          handleCellEdit(rowIndex, "veHoanKhay", e.target.value)
                        }
                      >
                        <option value="Có">Có</option>
                        <option value="Không">Không</option>
                      </select>
                    ) : column.accessor === "ngayGioBayDi" ||
                      column.accessor === "ngayGioBayDen" ? (
                      <td key={column.accessor}>
                        <input
                          type="datetime-local"
                          value={row[column.accessor] ? row[column.accessor].slice(0, 16) : ""}
                          required
                          onChange={(e) => handleCellEdit(rowIndex, column.accessor, e.target.value)}
                        />
                      </td>
                    ) : column.accessor === "ngayXuat" ? (
                      <input
                        type="datetime-local"
                        value={row.ngayXuat || new Date().toISOString().slice(0, -1)}
                        onChange={(e) =>
                          handleCellEdit(rowIndex, "ngayXuat", e.target.value)
                        }
                      />
                    ) : (
                      <input
                        type="text"
                        value={row[column.accessor] || ""}
                        onChange={(e) =>
                          handleCellEdit(
                            rowIndex,
                            column.accessor,
                            e.target.value
                          )
                        }
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Button
          onClick={handleAddRow}
          variant="contained"
          style={{ marginRight: "10px" }}
        >
          Thêm Hàng
        </Button>
        <Button
          onClick={handleDeleteRows}
          variant="contained"
          color="secondary"
          style={{ marginRight: "10px" }}
        >
          Xóa Hàng Đã Chọn
        </Button>
        <Button onClick={handleAddTicket} variant="contained" color="primary">
          Xuất Vé
        </Button>
      </div>
    </>
  );
};

export default InputTable;
