// src/form/InputTable.jsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import "../style/table.css";
import Button from "@mui/material/Button";
import {
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import FullScreenAGDialog from "./AgInputForm";
import FullScreenSoTheDialog from "./SoTheInputForm";
import AddOnTable from "./addOnTable";
import apiService from "../services/apiSevrvice";
import { fetchWithAuth } from "../services/authService";

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDateTime = new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16);
  return localDateTime;
};

const initialRow = {
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
  maDatChoTrip: "",
  thuAG: "",
  giaXuat: "",
  soThe: "",
  taiKhoan: "",
  luuY: "",
  veHoanKhay: "Có",
};

const InputTable = ({ onTicketCreated }) => {
  const [data, setData] = useState([initialRow]);
  const [currentFocusCell, setCurrentFocusCell] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [phoneOptions, setPhoneOptions] = useState([]);
  const [cardOptions, setCardOptions] = useState([]);
  const [openAGDialog, setOpenAGDialog] = useState(false);
  const [openSoTheDialog, setOpenSoTheDialog] = useState(false);
  const [openAddOnDialog, setOpenAddOnDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [addOnData, setAddOnData] = useState([{ dichVu: "", soTien: "" }]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [formHeaderData, setFormHeaderData] = useState({
    ngayXuat: getCurrentDateTimeLocal(),
    sdt: "",
    mail: "",
    tenAG: "",
  });

  const openSnackbarHandler = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbarHandler = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const columns = useMemo(
    () => [
      // { Header: "Ngày xuất", accessor: "ngayXuat" },
      // { Header: "Liên hệ (SĐT)", accessor: "sdt" },
      // { Header: "Mail", accessor: "mail" },
      // { Header: "Tên AG", accessor: "tenAG" },
      { Header: "", accessor: "select" },
      { Header: "Chặng", accessor: "changDi" },
      { Header: "Ngày giờ bay", accessor: "ngayGioBayDi" },
      // { Header: "Chặng bay đến", accessor: "changVe" },
      // { Header: "Ngày giờ bay đến", accessor: "ngayGioBayDen" },
      { Header: "Hãng bay", accessor: "hangBay" },
      { Header: "Số hiệu chuyến bay", accessor: "soHieuChuyenBay" },
      { Header: "Tham chiếu HHK", accessor: "thamChieuHHK" },
      { Header: "Mã đặt chỗ hãng", accessor: "maDatChoHang" },
      { Header: "Tên khách hàng", accessor: "tenKhachHang" },
      // { Header: "Giá xuất", accessor: "giaXuat" },
      // { Header: "Giới tính", accessor: "gioiTinh" },
      // { Header: "Add on", accessor: "addOn" },
      // { Header: "Mã đặt chỗ trip", accessor: "maDatChoTrip" },
      // { Header: "Thu AG", accessor: "thuAG" },
      // { Header: "Số thẻ thanh toán", accessor: "soThe" },
      // // { Header: "Tài khoản", accessor: "taiKhoan" },
      // { Header: "Lưu ý", accessor: "luuY" },
      // { Header: "Vé có hoàn hay không", accessor: "veHoanKhay" },
    ],
    []
  );

  const fetchData = useCallback(async () => {
    try {
      const phoneData = await apiService.fetchPhoneNumbers(openSnackbarHandler);
      setPhoneOptions(phoneData);
    } catch (error) {
      openSnackbarHandler("Failed to fetch phone numbers", "error");
    }

    try {
      const cardData = await apiService.fetchCardNumbers(openSnackbarHandler);
      setCardOptions(cardData);
    } catch (error) {
      openSnackbarHandler("Failed to fetch card numbers", "error");
    }
  }, [openSnackbarHandler]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTicket = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate
      for (const row of data) {
        if (!row.ngayGioBayDi) {
          openSnackbarHandler(
            "Vui lòng nhập đầy đủ ngày giờ bay đi.",
            "warning"
          );
          return;
        }
        if (!row.tenKhachHang) {
          openSnackbarHandler("Vui lòng nhập tên khách hàng.", "warning");
          return;
        }
      }

      // Lấy cardId từ cardOptions
      const selectedCard = cardOptions.find(
        (option) => option.soThe === (formHeaderData.soThe || data[0]?.soThe)
      );
      const cardId = selectedCard?.id || "";

      // Lấy agCustomerId từ phoneOptions
      const selectedAgCustomer = phoneOptions.find(
        (option) => option.sdt === (formHeaderData.sdt || data[0]?.sdt)
      );
      const agCustomerId = selectedAgCustomer?.id || "";

      // Build veDetails đúng format
      const veDetails = data.map((row) => ({
        changBay: row.changDi || "",
        ngayGioBay: row.ngayGioBayDi
          ? new Date(row.ngayGioBayDi).toISOString()
          : new Date().toISOString(),
        hangBay: row.hangBay || "",
        soHieuChuyenBay: row.soHieuChuyenBay || "",
        thamChieuHang: row.thamChieuHHK || "",
        maDatCho: row.maDatChoHang || "",
        tenKhachHang: row.tenKhachHang || "",
      }));

      // Build payload đúng format
      const payload = {
        agCustomerId: agCustomerId,
        ngayXuat: formHeaderData.ngayXuat
          ? new Date(formHeaderData.ngayXuat).toISOString()
          : new Date().toISOString(),
        giaXuat: formHeaderData.giaXuat || "",
        addOn: JSON.stringify(addOnData),
        thuAG: formHeaderData.thuAG || "",
        luuY: formHeaderData.luuY || "",
        veHoanKhay: formHeaderData.veHoanKhay === "Có" ? true : false,
        cardId,
        veDetails,
      };

      console.log("Payload gửi đi:", payload);

      try {
        await fetchWithAuth(
          "/Ve/xuatVe",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          openSnackbarHandler("Vé đã tạo thành công!", "success")
        );
        onTicketCreated();
        openSnackbarHandler("Vé đã tạo thành công!", "success");
        setData([initialRow]);
        setAddOnData([{ dichVu: "", soTien: "" }]);
      } catch (error) {
        openSnackbarHandler(
          "Có lỗi xảy ra khi tạo vé. Vui lòng thử lại.",
          "error"
        );
      }
    },
    [
      data,
      addOnData,
      onTicketCreated,
      openSnackbarHandler,
      formHeaderData,
      cardOptions,
      phoneOptions,
    ]
  );

  const handleAddRow = useCallback(() => {
    setData((prevData) => [...prevData, { ...initialRow }]);
  }, []);

  const handleCellEdit = useCallback((rowIndex, columnId, value) => {
    setData((prevData) => {
      const updatedData = [...prevData];
      updatedData[rowIndex][columnId] = value;
      return updatedData;
    });
  }, []);

  const handlePhoneSelect = useCallback(
    (rowIndex, newValue) => {
      const selectedPhoneOption = phoneOptions.find(
        (option) => option.sdt === newValue.sdt
      );

      setData((prevData) => {
        const updatedData = [...prevData];
        if (selectedPhoneOption) {
          updatedData[rowIndex] = {
            ...updatedData[rowIndex],
            sdt: selectedPhoneOption.sdt,
            tenAG: selectedPhoneOption.tenAG || "",
            mail: selectedPhoneOption.mail || "",
          };
        } else {
          updatedData[rowIndex] = {
            ...updatedData[rowIndex],
            sdt: newValue.sdt || "",
            tenAG: "",
            mail: "",
          };
        }
        return updatedData;
      });
    },
    [phoneOptions]
  );

  const handleSoTheSelect = useCallback(
    (rowIndex, newValue) => {
      const selectedCard = cardOptions.find(
        (option) => option.soThe === newValue.soThe
      );

      setData((prevData) => {
        const updatedData = [...prevData];
        updatedData[rowIndex].soThe = selectedCard
          ? selectedCard.soThe
          : newValue.soThe || "";
        return updatedData;
      });
    },
    [cardOptions]
  );

  const handleSelectRow = useCallback((rowIndex, isSelected) => {
    setSelectedRows((prevSelected) =>
      isSelected
        ? [...prevSelected, rowIndex]
        : prevSelected.filter((index) => index !== rowIndex)
    );
  }, []);

  const handleDeleteRows = useCallback(() => {
    setData((prevData) =>
      prevData.filter((_, index) => !selectedRows.includes(index))
    );
    setSelectedRows([]);
  }, [selectedRows]);

  const handleClickAddOnOpen = useCallback(() => {
    // setAddOnRow(index);
    setOpenAddOnDialog(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setOpenAGDialog(false);
    fetchData();
  }, [fetchData]);

  const handleDialogSoTheClose = useCallback(() => {
    setOpenSoTheDialog(false);
    fetchData();
  }, [fetchData]);

  const handleDialogAddOnClose = useCallback(() => {
    setOpenAddOnDialog(false);
  }, []);

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();

      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData.split("\n").map((row) => row.split("\t"));

      if (!currentFocusCell) return;

      const startRow = currentFocusCell.rowIndex;
      const startCol = columns.findIndex(
        (col) => col.accessor === currentFocusCell.columnId
      );

      const updatedData = [...data];
      rows.forEach((rowValues, rowOffset) => {
        rowValues.forEach((cellValue, colOffset) => {
          const targetRow = startRow + rowOffset;
          const targetCol = startCol + colOffset;

          if (updatedData[targetRow]) {
            const targetKey = columns[targetCol]?.accessor;
            if (targetKey && targetKey !== "select" && targetKey !== "addOn") {
              updatedData[targetRow][targetKey] = cellValue;
            }
          }
        });
      });

      setData(updatedData);
    },
    [currentFocusCell, data, columns]
  );

  // Handle Save from AddOnTable
  const handleSaveAddOn = useCallback((formData) => {
    setAddOnData(formData);
  }, []);

  // Memoized Initial Data for AddOnTable
  const memoizedInitialData = useMemo(() => {
    return addOnData.length > 0 ? addOnData : [{ dichVu: "", soTien: "" }];
  }, [addOnData]);

  const handleOpenDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    handleDeleteRows();
    setOpenDeleteDialog(false);
  }, [handleDeleteRows]);

  const handleHeaderInputChange = (field, value) => {
    setFormHeaderData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Cập nhật cho tất cả các hàng trong data
    setData((prevData) =>
      prevData.map((row) => ({
        ...row,
        [field]: value,
      }))
    );
  };

  const handleHeaderPhoneSelect = (value) => {
    // Tìm option theo SĐT
    const selectedPhoneOption = phoneOptions.find(
      (option) => option.sdt === value
    );

    setFormHeaderData((prev) => ({
      ...prev,
      sdt: value,
      tenAG: selectedPhoneOption?.tenAG || "",
      mail: selectedPhoneOption?.mail || "",
    }));

    setData((prevData) =>
      prevData.map((row) => ({
        ...row,
        sdt: value,
        tenAG: selectedPhoneOption?.tenAG || "",
        mail: selectedPhoneOption?.mail || "",
      }))
    );
  };

  const handleHeaderSoTheSelect = (value) => {
    const selectedCard = cardOptions.find((option) => option.soThe === value);

    setFormHeaderData((prev) => ({
      ...prev,
      soThe: value,
    }));

    setData((prevData) =>
      prevData.map((row) => ({
        ...row,
        soThe: selectedCard ? selectedCard.soThe : value,
      }))
    );
  };

  return (
    <div style={{ 
      backgroundColor: "#f8fafc", 
      padding: "20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Custom CSS for dropdown styling */}
      <style>{`
        /* Custom datalist styling */
        input[list]::-webkit-calendar-picker-indicator {
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%233b82f6" d="M3.5 6L8 10.5L12.5 6z"/></svg>') no-repeat;
          background-size: 16px;
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        /* Enhanced input focus states */
        .modern-input {
          transition: all 0.2s ease !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        
        .modern-input:focus {
          border-color: rgb(59, 130, 246) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          transform: translateY(-1px);
        }
        
        .modern-input:hover {
          border-color: #6b7280 !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* Custom dropdown arrow for select elements */
        .modern-select {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%236b7280" d="M3.5 6L8 10.5L12.5 6z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 40px !important;
        }
        
        .modern-select:focus {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="rgb(59, 130, 246)" d="M3.5 6L8 10.5L12.5 6z"/></svg>');
        }
        
        /* Table input styling */
        .table-input {
          transition: all 0.2s ease !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .table-input:focus {
          border-color: rgb(59, 130, 246) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .table-input:hover {
          border-color: #9ca3af !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Datalist option styling enhancement */
        input[list] {
          position: relative;
        }
        
        /* Custom styles for better dropdown appearance */
        .dropdown-container {
          position: relative;
        }
        
        .dropdown-container::after {
          content: '▼';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #6b7280;
          font-size: 12px;
        }
        
        .dropdown-container input:focus + .dropdown-icon {
          color: rgb(59, 130, 246);
        }
      `}</style>

      {/* Header Section */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "16px", 
        padding: "32px", 
        marginBottom: "24px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0"
      }}>
        <h2 style={{ 
          margin: "0 0 24px 0", 
          color: "#1e293b", 
          fontSize: "24px", 
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ 
            backgroundColor: "#3b82f6", 
            color: "white", 
            borderRadius: "50%", 
            width: "40px", 
            height: "40px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: "18px"
          }}>✈️</span>
          Bảng Nhập Dữ Liệu
        </h2>
        
        {/* Action Buttons */}
        <div style={{ 
          display: "flex", 
          gap: "16px", 
          marginBottom: "32px", 
          flexWrap: "wrap" 
        }}>
          <Button
            variant="contained"
            onClick={() => setOpenAGDialog(true)}
            style={{ 
              backgroundColor: "rgb(59, 130, 246)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
              border: "none",
              minWidth: "180px",
              transition: "all 0.2s ease"
            }}
          >
            📊 Nhập bảng AG
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenSoTheDialog(true)}
            style={{ 
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
              border: "none",
              minWidth: "220px",
              transition: "all 0.2s ease"
            }}
          >
            💳 Nhập số thẻ thanh toán
          </Button>
        </div>

        {/* Form Fields */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            alignItems: "start"
          }}
        >
          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              📅 Ngày xuất
            </label>
            <input
              type="datetime-local"
              value={formHeaderData.ngayXuat}
              onChange={(e) =>
                handleHeaderInputChange("ngayXuat", e.target.value)
              }
              className="modern-input"
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
            />
          </div>
          
          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              📞 Liên hệ (SĐT)
            </label>
            <div className="dropdown-container">
              <input
                list="phone-options-header"
                type="text"
                value={formHeaderData.sdt}
                onChange={(e) => handleHeaderPhoneSelect(e.target.value)}
                className="modern-input"
                style={{ 
                  width: "100%", 
                  padding: "12px 40px 12px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  transition: "border-color 0.2s ease",
                  outline: "none",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                placeholder="Chọn hoặc nhập số điện thoại"
              />
              <span style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#6b7280",
                fontSize: "12px"
              }}>▼</span>
            </div>
            <datalist id="phone-options-header">
              {phoneOptions.map((option, idx) => (
                <option key={idx} value={option.sdt} />
              ))}
            </datalist>
          </div>
          
          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              📧 Mail
            </label>
            <input
              type="email"
              value={formHeaderData.mail}
              onChange={(e) => handleHeaderInputChange("mail", e.target.value)}
              className="modern-input"
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
              placeholder="example@email.com"
            />
          </div>
          
          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              👤 Tên AG
            </label>
            <input
              type="text"
              value={formHeaderData.tenAG}
              onChange={(e) => handleHeaderInputChange("tenAG", e.target.value)}
              className="modern-input"
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
              placeholder="Tên đại lý"
            />
          </div>

          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              ✅ Vé có hoàn hay không
            </label>
            <select
              value={formHeaderData.veHoanKhay || "Có"}
              onChange={(e) =>
                handleHeaderInputChange("veHoanKhay", e.target.value)
              }
              className="modern-input modern-select"
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                transition: "border-color 0.2s ease",
                outline: "none",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
            >
              <option value="Có">✅ Có hoàn</option>
              <option value="Không">❌ Không hoàn</option>
            </select>
          </div>

          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              💳 Số thẻ thanh toán
            </label>
            <div className="dropdown-container">
              <input
                list="so-the-header"
                type="text"
                value={formHeaderData.soThe || ""}
                onChange={(e) => handleHeaderSoTheSelect(e.target.value)}
                className="modern-input"
                style={{ 
                  width: "100%", 
                  padding: "12px 40px 12px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  transition: "border-color 0.2s ease",
                  outline: "none",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                placeholder="Chọn hoặc nhập số thẻ"
              />
              <span style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#6b7280",
                fontSize: "12px"
              }}>▼</span>
            </div>
            <datalist id="so-the-header">
              {cardOptions.map((option, idx) => (
                <option key={idx} value={option.soThe} />
              ))}
            </datalist>
          </div>

          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              🎯 Add On
            </label>
            <Button
              variant="contained"
              onClick={handleClickAddOnOpen}
              style={{ 
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "rgba(59, 130, 246, 0.9)",
                color: "white",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)",
                border: "none",
                transition: "all 0.2s ease"
              }}
            >
              ➕ Nhập Add on
            </Button>
          </div>

          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              📝 Lưu ý
            </label>
            <input
              type="text"
              value={formHeaderData.luuY || ""}
              onChange={(e) => handleHeaderInputChange("luuY", e.target.value)}
              className="modern-input"
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
              placeholder="Ghi chú thêm"
            />
          </div>

          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              💰 Thu AG
            </label>
            <input
              type="text"
              value={formHeaderData.thuAG || ""}
              onChange={(e) => handleHeaderInputChange("thuAG", e.target.value)}
              className="modern-input"
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
              placeholder="Thu AG"
            />
          </div>

          <div style={{ position: "relative" }}>
            <label style={{ 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151",
              fontSize: "14px"
            }}>
              💵 Giá xuất
            </label>
            <input
              type="text"
              value={formHeaderData.giaXuat || ""}
              onChange={(e) => handleHeaderInputChange("giaXuat", e.target.value)}
              className="modern-input"
              style={{ 
                width: "100%", 
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "white",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
              placeholder="Giá xuất"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "16px", 
        padding: "32px", 
        marginBottom: "24px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0"
      }}>
        <h3 style={{ 
          margin: "0 0 24px 0", 
          color: "#1e293b", 
          fontSize: "20px", 
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ 
            backgroundColor: "#10b981", 
            color: "white", 
            borderRadius: "50%", 
            width: "32px", 
            height: "32px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: "16px"
          }}>📋</span>
          Chi tiết vé
        </h3>

        <div
          className="table-wrapper"
          onPaste={handlePaste}
          tabIndex={0}
          style={{ 
            outline: "none",
            borderRadius: "12px",
            overflow: "hidden",
            border: "2px solid #e2e8f0"
          }}
        >
          <table className="table-container" style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {columns.map((column) => (
                  <th key={column.accessor} style={{
                    padding: "16px 12px",
                    borderBottom: "2px solid #e2e8f0",
                    borderRight: "1px solid #e2e8f0",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#374151",
                    textAlign: "left",
                    backgroundColor: "#f8fafc"
                  }}>{column.Header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} style={{
                  backgroundColor: rowIndex % 2 === 0 ? "white" : "#f8fafc",
                  transition: "background-color 0.2s ease"
                }}>
                  {columns.map((column) => (
                    <td key={column.accessor} style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      borderRight: "1px solid #e2e8f0",
                      fontSize: "14px"
                    }}>
                      {column.accessor === "select" ? (
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(rowIndex)}
                          onChange={(e) =>
                            handleSelectRow(rowIndex, e.target.checked)
                          }
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer"
                          }}
                        />
                      ) : column.accessor === "sdt" ? (
                        <div className="dropdown-container" style={{ position: "relative" }}>
                          <input
                            list={`phone-options-${rowIndex}`}
                            value={row.sdt}
                            onChange={(e) => {
                              handlePhoneSelect(rowIndex, {
                                sdt: e.target.value,
                              });
                            }}
                            placeholder="Chọn hoặc nhập SĐT"
                            onFocus={() =>
                              setCurrentFocusCell({
                                rowIndex,
                                columnId: column.accessor,
                              })
                            }
                            className="table-input"
                            style={{
                              width: "100%",
                              padding: "8px 32px 8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              outline: "none",
                              transition: "border-color 0.2s ease",
                              backgroundColor: "white",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                            }}
                          />
                          <span style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "#9ca3af",
                            fontSize: "10px"
                          }}>▼</span>
                          <datalist id={`phone-options-${rowIndex}`}>
                            {phoneOptions.map((option, idx) => (
                              <option key={idx} value={option.sdt} />
                            ))}
                          </datalist>
                        </div>
                      ) : column.accessor === "soThe" ? (
                        <div className="dropdown-container" style={{ position: "relative" }}>
                          <input
                            list={`so-the-${rowIndex}`}
                            value={row.soThe}
                            onChange={(e) => {
                              handleSoTheSelect(rowIndex, {
                                soThe: e.target.value,
                              });
                            }}
                            placeholder="Chọn hoặc nhập số thẻ"
                            onFocus={() =>
                              setCurrentFocusCell({
                                rowIndex,
                                columnId: column.accessor,
                              })
                            }
                            className="table-input"
                            style={{
                              width: "100%",
                              padding: "8px 32px 8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              outline: "none",
                              transition: "border-color 0.2s ease",
                              backgroundColor: "white",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                            }}
                          />
                          <span style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "#9ca3af",
                            fontSize: "10px"
                          }}>▼</span>
                          <datalist id={`so-the-${rowIndex}`}>
                            {cardOptions.map((option, idx) => (
                              <option key={idx} value={option.soThe} />
                            ))}
                          </datalist>
                        </div>
                      ) : column.accessor === "gioiTinh" ? (
                        <select
                          value={row.gioiTinh || "Nam"}
                          onChange={(e) =>
                            handleCellEdit(rowIndex, "gioiTinh", e.target.value)
                          }
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                          className="table-input modern-select"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                            backgroundColor: "white",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                          }}
                        >
                          <option value="Nam">👨 Nam</option>
                          <option value="Nữ">👩 Nữ</option>
                        </select>
                      ) : column.accessor === "veHoanKhay" ? (
                        <select
                          value={row.veHoanKhay || "Có"}
                          onChange={(e) =>
                            handleCellEdit(rowIndex, "veHoanKhay", e.target.value)
                          }
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                          className="table-input modern-select"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                            backgroundColor: "white",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                          }}
                        >
                          <option value="Có">✅ Có</option>
                          <option value="Không">❌ Không</option>
                        </select>
                      ) : column.accessor === "ngayGioBayDi" ||
                        column.accessor === "ngayGioBayDen" ? (
                        <input
                          type="datetime-local"
                          value={
                            row[column.accessor]
                              ? row[column.accessor].slice(0, 16)
                              : ""
                          }
                          required
                          onChange={(e) =>
                            handleCellEdit(
                              rowIndex,
                              column.accessor,
                              e.target.value
                            )
                          }
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                          className="table-input"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                            transition: "border-color 0.2s ease",
                            backgroundColor: "white",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                          }}
                        />
                      ) : column.accessor === "addOn" ? (
                        <Button
                          variant="contained"
                          onClick={() => handleClickAddOnOpen(rowIndex)}
                          style={{
                            backgroundColor: "rgba(59, 130, 246, 0.9)",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            textTransform: "none",
                            boxShadow: "0 2px 4px rgba(59, 130, 246, 0.25)",
                            border: "none",
                            minWidth: "80px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          ➕ Nhập
                        </Button>
                      ) : column.accessor === "ngayXuat" ? (
                        <input
                          type="datetime-local"
                          value={
                            row.ngayXuat || new Date().toISOString().slice(0, -1)
                          }
                          onChange={(e) =>
                            handleCellEdit(rowIndex, "ngayXuat", e.target.value)
                          }
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                          className="table-input"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                            transition: "border-color 0.2s ease",
                            backgroundColor: "white",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                          }}
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
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                          className="table-input"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            outline: "none",
                            transition: "border-color 0.2s ease",
                            backgroundColor: "white",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                          }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          marginTop: "24px", 
          display: "flex", 
          gap: "12px", 
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          <Button
            onClick={handleAddRow}
            variant="contained"
            style={{ 
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
              border: "none",
              minWidth: "140px"
            }}
          >
            ➕ Thêm Hàng
          </Button>
          <Button
            onClick={handleOpenDeleteDialog}
            variant="contained"
            style={{ 
              backgroundColor: "rgba(59, 130, 246, 0.6)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
              border: "none",
              minWidth: "180px",
              opacity: selectedRows.length === 0 ? 0.5 : 1,
              cursor: selectedRows.length === 0 ? "not-allowed" : "pointer"
            }}
            disabled={selectedRows.length === 0}
          >
            🗑️ Xóa Hàng Đã Chọn
          </Button>
          <Button 
            onClick={handleAddTicket} 
            variant="contained" 
            style={{ 
              backgroundColor: "rgb(59, 130, 246)",
              color: "white",
              padding: "16px 32px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "700",
              textTransform: "none",
              boxShadow: "0 6px 16px rgba(59, 130, 246, 0.3)",
              border: "none",
              minWidth: "160px"
            }}
          >
            🎫 Xuất Vé
          </Button>
        </div>
      </div>

      {/* Hidden Components */}
      <>
        <FullScreenAGDialog
          open={openAGDialog}
          onClose={handleDialogClose}
          data={data}
        />
        <FullScreenSoTheDialog
          open={openSoTheDialog}
          onClose={handleDialogSoTheClose}
          data={data}
        />
        
        <AddOnTable
          open={openAddOnDialog}
          onClose={handleDialogAddOnClose}
          onSave={handleSaveAddOn}
          initialData={memoizedInitialData}
          data={data}
          rowIndex={0}
          mode="edit"
        />
        
        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          aria-labelledby="delete-confirmation-dialog-title"
          aria-describedby="delete-confirmation-dialog-description"
          PaperProps={{
            style: {
              borderRadius: "16px",
              padding: "8px"
            }
          }}
        >
          <DialogTitle id="delete-confirmation-dialog-title" style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#1e293b",
            paddingBottom: "8px"
          }}>
            🗑️ Xác nhận xóa
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-confirmation-dialog-description" style={{
              fontSize: "14px",
              color: "#64748b",
              lineHeight: "1.5"
            }}>
              Bạn có chắc chắn muốn xóa {selectedRows.length} hàng đã chọn? Hành
              động này không thể hoàn tác.
            </DialogContentText>
          </DialogContent>
          <DialogActions style={{ padding: "16px 24px 24px" }}>
            <Button 
              onClick={handleCloseDeleteDialog}
              style={{
                color: "#6b7280",
                backgroundColor: "transparent",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "none"
              }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              autoFocus
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.8)",
                color: "white",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)"
              }}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={closeSnackbarHandler}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={closeSnackbarHandler}
            severity={snackbar.severity}
            sx={{ 
              width: "100%",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    </div>
  );
};

export default InputTable;
