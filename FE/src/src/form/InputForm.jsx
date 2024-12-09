// src/form/InputTable.jsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import "../style/table.css";
import Button from "@mui/material/Button";
import { Snackbar, Alert } from "@mui/material";
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
  addOn: "",
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
  const [addOnRow, setAddOnRow] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const openSnackbarHandler = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbarHandler = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const columns = useMemo(
    () => [
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
      for (const row of data) {
        if (!row.ngayGioBayDi || !row.ngayGioBayDen) {
          openSnackbarHandler(
            "Vui lòng nhập đầy đủ ngày giờ bay đi và ngày giờ bay đến.",
            "warning"
          );
          return;
        }
        if (!row.soThe) {
          openSnackbarHandler("Vui lòng nhập số thẻ thanh toán.", "warning");
          return;
        }
        if (!row.tenKhachHang) {
          openSnackbarHandler("Vui lòng nhập tên khách hàng.", "warning");
          return;
        }
      }

      const formattedTickets = data.map((row) => ({
        ngayXuat: new Date().toISOString(),
        changDi: row.changDi,
        ngayGioBayDi: row.ngayGioBayDi
          ? new Date(row.ngayGioBayDi).toISOString()
          : new Date().toISOString(),
        changVe: row.changVe,
        ngayGioBayDen: row.ngayGioBayDen
          ? new Date(row.ngayGioBayDen).toISOString()
          : new Date().toISOString(),
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
        await fetchWithAuth(
          "/xuatVe",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formattedTickets),
          },
          openSnackbarHandler
        );
        onTicketCreated();
        openSnackbarHandler("Vé đã tạo thành công!", "success");
        setData([initialRow]);
      } catch (error) {
        openSnackbarHandler(
          "Có lỗi xảy ra khi tạo vé. Vui lòng thử lại.",
          "error"
        );
      }
    },
    [data, onTicketCreated, openSnackbarHandler]
  );

  const handleAddRow = useCallback(() => {
    setData((prevData) => [...prevData, { ...initialRow }]);
  }, []);

  const handleCellEdit = useCallback(
    (rowIndex, columnId, value) => {
      setData((prevData) => {
        const updatedData = [...prevData];
        updatedData[rowIndex][columnId] = value;
        return updatedData;
      });
    },
    []
  );

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

  const handleClickAddOnOpen = useCallback((index) => {
    setAddOnRow(index);
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
  const handleSaveAddOn = useCallback(
    (formData, rowIndex) => {
      setData((prevData) => {
        const updatedData = [...prevData];
        updatedData[rowIndex].addOn = JSON.stringify(formData);
        return updatedData;
      });
    },
    []
  );

  // Memoized Initial Data for AddOnTable
  const memoizedInitialData = useMemo(() => {
    if (addOnRow !== null) {
      try {
        const parsedData = JSON.parse(
          data[addOnRow].addOn || '[{"stt": "", "dichVu": "", "soTien": ""}]'
        );
        return parsedData;
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return [{ stt: "", dichVu: "", soTien: "" }];
      }
    } else {
      return [{ stt: "", dichVu: "", soTien: "" }];
    }
  }, [addOnRow, data]);

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setOpenAGDialog(true)}
        className="button-container"
        style={{ marginBottom: "15px", width: "200px" }}
      >
        Nhập bảng AG
      </Button>
      <FullScreenAGDialog
        open={openAGDialog}
        onClose={handleDialogClose}
        data={data}
      />
      <Button
        variant="outlined"
        onClick={() => setOpenSoTheDialog(true)}
        className="button-container"
        style={{ marginBottom: "15px", marginLeft: "15px", width: "300px" }}
      >
        Nhập số thẻ thanh toán
      </Button>
      <FullScreenSoTheDialog
        open={openSoTheDialog}
        onClose={handleDialogSoTheClose}
        data={data}
      />
      <div
        className="table-wrapper"
        onPaste={handlePaste}
        tabIndex={0}
        style={{ outline: "none" }}
      >
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
                        onFocus={() =>
                          setCurrentFocusCell({
                            rowIndex,
                            columnId: column.accessor,
                          })
                        }
                      />
                    ) : column.accessor === "sdt" ? (
                      <>
                        <input
                          list={`phone-options-${rowIndex}`}
                          value={row.sdt}
                          onChange={(e) => {
                            handlePhoneSelect(rowIndex, {
                              sdt: e.target.value,
                            });
                          }}
                          placeholder="Nhập số điện thoại"
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                        />
                        <datalist id={`phone-options-${rowIndex}`}>
                          {phoneOptions.map((option, idx) => (
                            <option key={idx} value={option.sdt} />
                          ))}
                        </datalist>
                      </>
                    ) : column.accessor === "soThe" ? (
                      <>
                        <input
                          list={`so-the-${rowIndex}`}
                          value={row.soThe}
                          onChange={(e) => {
                            handleSoTheSelect(rowIndex, {
                              soThe: e.target.value,
                            });
                          }}
                          placeholder="Nhập số thẻ"
                          onFocus={() =>
                            setCurrentFocusCell({
                              rowIndex,
                              columnId: column.accessor,
                            })
                          }
                        />
                        <datalist id={`so-the-${rowIndex}`}>
                          {cardOptions.map((option, idx) => (
                            <option key={idx} value={option.soThe} />
                          ))}
                        </datalist>
                      </>
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
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    ) : column.accessor === "veHoanKhay" ? (
                      <select
                        value={row.veHoanKhay || "Có"}
                        onChange={(e) =>
                          handleCellEdit(
                            rowIndex,
                            "veHoanKhay",
                            e.target.value
                          )
                        }
                        onFocus={() =>
                          setCurrentFocusCell({
                            rowIndex,
                            columnId: column.accessor,
                          })
                        }
                      >
                        <option value="Có">Có</option>
                        <option value="Không">Không</option>
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
                      />
                    ) : column.accessor === "addOn" ? (
                      <Button
                        variant="outlined"
                        onClick={() => handleClickAddOnOpen(rowIndex)}
                        className="button-container"
                      >
                        Nhập
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
          disabled={selectedRows.length === 0}
        >
          Xóa Hàng Đã Chọn
        </Button>
        <Button onClick={handleAddTicket} variant="contained" color="primary">
          Xuất Vé
        </Button>
      </div>
      <AddOnTable
        open={openAddOnDialog}
        onClose={handleDialogAddOnClose}
        onSave={handleSaveAddOn}
        initialData={memoizedInitialData}
        data={data}
        rowIndex={addOnRow}
        mode="edit"
      />
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
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InputTable;
