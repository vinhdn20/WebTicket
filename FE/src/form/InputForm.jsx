// src/form/InputTable.jsx
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
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
  Backdrop,
  CircularProgress, // <-- add
} from "@mui/material";
import FullScreenAGDialog from "./Dialog/AgInputForm";
import FullScreenSoTheDialog from "./Dialog/SoTheInputForm";
import AddOnTable from "./Dialog/addOnTable";
import apiService from "../services/apiSevrvice";
import { fetchWithAuth } from "../services/authService";
import TKTripForm from "./Dialog/TKTripForm";
import TKGmailForm from "./Dialog/TKGmailForm";

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
  veHoanKhay: false,
};

const InputTable = ({ onTicketCreated }) => {
  const [data, setData] = useState([initialRow]);
  const [currentFocusCell, setCurrentFocusCell] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [phoneOptions, setPhoneOptions] = useState([]);
  const [cardOptions, setCardOptions] = useState([]);
  const [openAGDialog, setOpenAGDialog] = useState(false);
  const [openTKDialog, setOpenTKDialog] = useState(false);
  const [tkType, setTKType] = useState(null);
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
  const [loading, setLoading] = useState(false); // <-- add
  const didFetchRef = useRef(false); // guard to fetch once on mount

  // Reset toàn bộ state về mặc định sau khi xuất vé thành công
  const resetFormState = useCallback(() => {
    setFormHeaderData({
      ngayXuat: getCurrentDateTimeLocal(),
      sdt: "",
      mail: "",
      tenAG: "",
      soThe: "",
      giaXuat: "",
      thuAG: "",
      luuY: "",
      veHoanKhay: false,
    });
    setData([{ ...initialRow }]);
    setAddOnData([{ dichVu: "", soTien: "" }]);
    setSelectedRows([]);
    setCurrentFocusCell(null);
    setOpenAddOnDialog(false);
    setOpenDeleteDialog(false);
    // Không đụng tới danh sách phoneOptions/cardOptions
  }, []);

  const openSnackbarHandler = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbarHandler = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const columns = useMemo(
    () => [
      { Header: "", accessor: "select" },
      { Header: "Chặng", accessor: "changDi" },
      { Header: "Ngày giờ bay", accessor: "ngayGioBayDi" },
      { Header: "Hãng bay", accessor: "hangBay" },
      { Header: "Số hiệu chuyến bay", accessor: "soHieuChuyenBay" },
      { Header: "Tham chiếu HHK", accessor: "thamChieuHHK" },
      { Header: "Mã đặt chỗ hãng", accessor: "maDatChoHang" },
      { Header: "Tên khách hàng", accessor: "tenKhachHang" },
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
    if (didFetchRef.current) return;
    didFetchRef.current = true;
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

      const selectedCard = cardOptions.find(
        (option) => option.soThe === (formHeaderData.soThe || data[0]?.soThe)
      );
      const cardId = selectedCard?.id || "";

      const selectedAgCustomer = phoneOptions.find(
        (option) => option.sdt === (formHeaderData.sdt || data[0]?.sdt)
      );
      const agCustomerId = selectedAgCustomer?.id || "";

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

      console.log(formHeaderData);

      const payload = {
        agCustomerId: agCustomerId,
        ngayXuat: formHeaderData.ngayXuat
          ? new Date(formHeaderData.ngayXuat).toISOString()
          : new Date().toISOString(),
        giaXuat: parseNumberDot(formHeaderData.giaXuat || ""),
        addOn: JSON.stringify(addOnData),
        thuAG: parseNumberDot(formHeaderData.thuAG || ""),
        luuY: formHeaderData.luuY || "",
        veHoanKhay: formHeaderData.veHoanKhay,
        cardId,
        veDetails,
      };

      console.log("Payload gửi đi:", payload);

      try {
        setLoading(true); // <-- add
        await fetchWithAuth(
          "/Ve/xuatVe",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          openSnackbarHandler("Vé đã tạo thành công!", "success")
        );
        onTicketCreated?.();
        openSnackbarHandler("Vé đã tạo thành công!", "success");

        // Clear toàn bộ state cũ
        resetFormState();
      } catch (error) {
        openSnackbarHandler(
          "Có lỗi xảy ra khi tạo vé. Vui lòng thử lại.",
          "error"
        );
      } finally {
        setLoading(false); // <-- add
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
      resetFormState,
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

  const handleDialogTripClose = useCallback(() => {
    setOpenTKDialog(false);
  }, []);

  function parseToDateTimeLocal(str) {
    if (!str) return str;
    const iso = Date.parse(str);
    if (!isNaN(iso)) {
      const d = new Date(iso);
      return d.toISOString().slice(0, 16);
    }
    const match = str.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/
    );
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      const hour = match[4] ? match[4].padStart(2, "0") : "00";
      const min = match[5] ? match[5].padStart(2, "0") : "00";
      return `${year}-${month}-${day}T${hour}:${min}`;
    }
    return str;
  }

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();

      const clipboardData = e.clipboardData.getData("text");
      const rows = clipboardData
        .split("\n")
        .map((row) => row.split("\t"))
        .filter((row) => row.some((cell) => cell.trim() !== ""));

      if (!currentFocusCell) return;

      const startRow = currentFocusCell.rowIndex;
      const realColumns = columns.filter(
        (col) => col.accessor !== "select" && col.accessor !== "addOn"
      );
      const startCol = realColumns.findIndex(
        (col) => col.accessor === currentFocusCell.columnId
      );

      setData((prevData) => {
        let updatedData = [...prevData];
        const requiredRows = startRow + rows.length;
        for (let i = updatedData.length; i < requiredRows; i++) {
          updatedData.push({ ...initialRow });
        }

        rows.forEach((rowValues, rowOffset) => {
          const targetRow = startRow + rowOffset;
          rowValues.forEach((cellValue, colOffset) => {
            const targetCol = startCol + colOffset;
            const targetKey = realColumns[targetCol]?.accessor;
            if (targetKey && updatedData[targetRow]) {
              if (
                targetKey.toLowerCase().includes("ngay") ||
                targetKey.toLowerCase().includes("date")
              ) {
                updatedData[targetRow][targetKey] =
                  parseToDateTimeLocal(cellValue);
              } else {
                updatedData[targetRow][targetKey] = cellValue;
              }
            }
          });
        });
        return updatedData;
      });
    },
    [currentFocusCell, columns]
  );

  const handleSaveAddOn = useCallback((formData) => {
    setAddOnData(formData);
  }, []);

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
    if (field === "giaXuat" || field === "thuAG") {
      const formatted = formatNumberDot(value);
      setFormHeaderData((prev) => ({ ...prev, [field]: formatted }));
      setData((prevData) =>
        prevData.map((row) => ({ ...row, [field]: formatted }))
      );
    } else {
      setFormHeaderData((prev) => ({ ...prev, [field]: value }));
      setData((prevData) =>
        prevData.map((row) => ({ ...row, [field]: value }))
      );
    }
  };

  const handleHeaderPhoneSelect = (value) => {
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

  const handleTKClick = (type) => {
    setOpenTKDialog(true);
    setTKType(type);
  };

  return (
    <div className="input-form-wrapper">
      <div className="action-buttons">
        {window.Permissions.permissions?.find(
          (i) => i.name === "ag.manage" || i.name === "masothe.manage"
        ) && (
          <div className="group-button">
            <Button variant="contained" className="btn-primary btn-md minw-220">
              Nhập dữ liệu thẻ
            </Button>

            <div className="group-menu-dropdown">
              {window.Permissions.permissions?.find(
                (i) => i.name === "ag.manage"
              ) && (
                <Button
                  variant="contained"
                  onClick={() => setOpenAGDialog(true)}
                  className="btn-primary btn-sm btn-block"
                >
                  Nhập bảng AG
                </Button>
              )}
              {window.Permissions.permissions?.find(
                (i) => i.name === "masothe.manage"
              ) && (
                <Button
                  variant="contained"
                  onClick={() => setOpenSoTheDialog(true)}
                  className="btn-primary btn-sm btn-block"
                >
                  Nhập số thẻ thanh toán
                </Button>
              )}
            </div>
          </div>
        )}
        {window.Permissions.permissions?.find(
          (i) =>
            i.name === "agodaaccount.manage" ||
            i.name === "tripaccount.manage" ||
            i.name === "gmailaccount.manage"
        ) && (
          <div className="group-button">
            <Button variant="contained" className="btn-primary btn-md minw-220">
              Quản lý tài khoản
            </Button>
            <div className="group-menu-dropdown">
              {window.Permissions.permissions?.find(
                (i) => i.name === "tripaccount.manage"
              ) && (
                <Button
                  variant="contained"
                  onClick={() => handleTKClick(1)}
                  className="btn-primary btn-sm btn-block"
                >
                  Tài khoản Trip
                </Button>
              )}
              {window.Permissions.permissions?.find(
                (i) => i.name === "agodaaccount.manage"
              ) && (
                <Button
                  variant="contained"
                  onClick={() => handleTKClick(2)}
                  className="btn-primary btn-sm btn-block"
                >
                  Tài khoản Agoda
                </Button>
              )}
              {window.Permissions.permissions?.find(
                (i) => i.name === "gmailaccount.manage"
              ) && (
                <Button
                  variant="contained"
                  onClick={() => handleTKClick(3)}
                  className="btn-primary btn-sm btn-block"
                >
                  Gmail
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="card">
        <h2 className="section-title">
          <span className="section-title__icon">✈️</span>
          Bảng Nhập Dữ Liệu
        </h2>

        {/* Form Fields */}
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">📅 Ngày xuất</label>
            <input
              type="datetime-local"
              value={formHeaderData.ngayXuat}
              onChange={(e) =>
                handleHeaderInputChange("ngayXuat", e.target.value)
              }
              className="modern-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">📞 Liên hệ (SĐT)</label>
            <div className="dropdown-container">
              <input
                list="phone-options-header"
                type="text"
                value={formHeaderData.sdt}
                onChange={(e) => handleHeaderPhoneSelect(e.target.value)}
                className="modern-input"
              />
            </div>
            <datalist id="phone-options-header">
              {phoneOptions.map((option, idx) => (
                <option key={idx} value={option.sdt} />
              ))}
            </datalist>
          </div>

          <div className="form-field">
            <label className="form-label">📧 Mail</label>
            <input
              type="email"
              value={formHeaderData.mail}
              onChange={(e) => handleHeaderInputChange("mail", e.target.value)}
              className="modern-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">👤 Tên AG</label>
            <input
              type="text"
              value={formHeaderData.tenAG}
              onChange={(e) => handleHeaderInputChange("tenAG", e.target.value)}
              className="modern-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">✅ Vé có hoàn hay không</label>
            <select
              value={formHeaderData.veHoanKhay || false}
              onChange={(e) =>
                handleHeaderInputChange("veHoanKhay", e.target.value === "true")
              }
              className="modern-input modern-select"
            >
              <option value={true}>Có hoàn</option>
              <option value={false}>Không hoàn</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">💳 Số thẻ thanh toán</label>
            <div className="dropdown-container">
              <input
                list="so-the-header"
                type="text"
                value={formHeaderData.soThe || ""}
                onChange={(e) => handleHeaderSoTheSelect(e.target.value)}
                className="modern-input"
              />
            </div>
            <datalist id="so-the-header">
              {cardOptions.map((option, idx) => (
                <option key={idx} value={option.soThe} />
              ))}
            </datalist>
          </div>

          <div className="form-field">
            <label className="form-label">🎯 Add On</label>
            <Button
              variant="contained"
              onClick={handleClickAddOnOpen}
              className="btn-primary btn-md btn-block"
            >
              ➕ Nhập Add on
            </Button>
          </div>

          <div className="form-field">
            <label className="form-label">📝 Lưu ý</label>
            <input
              type="text"
              value={formHeaderData.luuY || ""}
              onChange={(e) => handleHeaderInputChange("luuY", e.target.value)}
              className="modern-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">💰 Thu AG</label>
            <input
              type="text"
              value={formHeaderData.thuAG || ""}
              onChange={(e) => handleHeaderInputChange("thuAG", e.target.value)}
              className="modern-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">💵 Giá xuất</label>
            <input
              type="text"
              value={formHeaderData.giaXuat || ""}
              onChange={(e) =>
                handleHeaderInputChange("giaXuat", e.target.value)
              }
              className="modern-input"
            />
          </div>
        </div>
        <h3 className="section-subtitle">
          <span className="section-subtitle__icon">📋</span>
          Chi tiết vé
        </h3>

        <div className="table-wrapper" onPaste={handlePaste} tabIndex={0}>
          <table className="table-container">
            <thead>
              <tr>
                {columns.map((column, colIdx) =>
                  colIdx === 0 ? (
                    <th key={column.accessor} className="th-select">
                      <div className="cell-center">
                        <input
                          type="checkbox"
                          checked={
                            data.length > 0 &&
                            selectedRows.length === data.length
                          }
                          indeterminate={
                            selectedRows.length > 0 &&
                            selectedRows.length < data.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(data.map((_, idx) => idx));
                            } else {
                              setSelectedRows([]);
                            }
                          }}
                          className="checkbox"
                        />
                      </div>
                    </th>
                  ) : (
                    <th key={column.accessor} className="th-default">
                      {column.Header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td
                      key={column.accessor}
                      className={
                        column.accessor === "select" ? "td-select" : "td-cell"
                      }
                    >
                      {column.accessor === "select" ? (
                        <div className="cell-center">
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
                            className="checkbox"
                          />
                        </div>
                      ) : column.accessor === "sdt" ? (
                        <div className="dropdown-container">
                          <input
                            list={`phone-options-${rowIndex}`}
                            value={row.sdt}
                            onChange={(e) => {
                              handlePhoneSelect(rowIndex, {
                                sdt: e.target.value,
                              });
                            }}
                            onFocus={() =>
                              setCurrentFocusCell({
                                rowIndex,
                                columnId: column.accessor,
                              })
                            }
                            className="table-input"
                          />
                          <datalist id={`phone-options-${rowIndex}`}>
                            {phoneOptions.map((option, idx) => (
                              <option key={idx} value={option.sdt} />
                            ))}
                          </datalist>
                        </div>
                      ) : column.accessor === "soThe" ? (
                        <div className="dropdown-container">
                          <input
                            list={`so-the-${rowIndex}`}
                            value={row.soThe}
                            onChange={(e) => {
                              handleSoTheSelect(rowIndex, {
                                soThe: e.target.value,
                              });
                            }}
                            onFocus={() =>
                              setCurrentFocusCell({
                                rowIndex,
                                columnId: column.accessor,
                              })
                            }
                            className="table-input"
                          />
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
                        >
                          <option value="Nam">👨 Nam</option>
                          <option value="Nữ">👩 Nữ</option>
                        </select>
                      ) : column.accessor === "veHoanKhay" ? (
                        <select
                          value={row.veHoanKhay || false}
                          onChange={(e) =>
                            handleCellEdit(
                              rowIndex,
                              "veHoanKhay",
                              e.target.value === "true"
                            )
                          }
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                          className="table-input modern-select"
                        >
                          <option value={true}>✅ Có</option>
                          <option value={false}>❌ Không</option>
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
                        />
                      ) : column.accessor === "addOn" ? (
                        <Button
                          variant="contained"
                          onClick={() => handleClickAddOnOpen(rowIndex)}
                          className="btn-primary btn-sm"
                        >
                          ➕ Nhập
                        </Button>
                      ) : column.accessor === "ngayXuat" ? (
                        <input
                          type="datetime-local"
                          value={
                            row.ngayXuat ||
                            new Date().toISOString().slice(0, -1)
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
        <div className="actions">
          <Button
            onClick={handleAddRow}
            variant="contained"
            className="btn-primary btn-md minw-140"
          >
            Thêm Hàng
          </Button>
          <Button
            onClick={handleOpenDeleteDialog}
            variant="contained"
            className="btn-primary btn-md minw-180"
            disabled={selectedRows.length === 0}
          >
            Xóa Hàng Đã Chọn
          </Button>
          <Button
            onClick={handleAddTicket}
            variant="contained"
            className="btn-primary btn-lg minw-160"
          >
            Xuất Vé
          </Button>
        </div>
      </div>

      {/* Table Section */}

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
            className: "dialog-paper",
          }}
        >
          <DialogTitle
            id="delete-confirmation-dialog-title"
            className="dialog-title"
          >
            🗑️ Xác nhận xóa
          </DialogTitle>
          <DialogContent>
            <DialogContentText
              id="delete-confirmation-dialog-description"
              className="dialog-description"
            >
              Bạn có chắc chắn muốn xóa {selectedRows.length} hàng đã chọn? Hành
              động này không thể hoàn tác.
            </DialogContentText>
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={handleCloseDeleteDialog} className="btn-secondary">
              Hủy
            </Button>
            <Button
              onClick={handleConfirmDelete}
              autoFocus
              className="btn-primary btn-sm"
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={closeSnackbarHandler}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={closeSnackbarHandler}
            severity={snackbar.severity}
            className="snackbar-alert"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {tkType === 3 ? (
          <TKGmailForm
            open={openTKDialog}
            onClose={handleDialogTripClose}
          />
        ) : (
          <TKTripForm
            open={openTKDialog}
            onClose={handleDialogTripClose}
            type={tkType}
          />
        )}
      </>

      {/* Loading overlay */}
      <Backdrop
        open={loading}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

// Format số có dấu chấm ngăn cách hàng nghìn (1.000.000)
function formatNumberDot(value) {
  if (value === null || value === undefined) return "";
  const str = value.toString().replace(/\D/g, "");
  if (!str) return "";
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse số từ string có dấu chấm về số nguyên ("1.000.000" => "1000000")
function parseNumberDot(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\./g, "");
}

// Khi nhận data từ API, format lại giaXuat và thuAG nếu có
export function formatApiTicketData(ticket) {
  return {
    ...ticket,
    giaXuat: ticket.giaXuat ? formatNumberDot(ticket.giaXuat.toString()) : "",
    thuAG: ticket.thuAG ? formatNumberDot(ticket.thuAG.toString()) : "",
  };
}

export default InputTable;
