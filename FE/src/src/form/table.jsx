// src/form/EditableTable.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useTable, usePagination } from "react-table";
import "../style/table.css";
import { formatDate } from "../constant";
import { v4 as uuidv4 } from "uuid";
import { Snackbar, Alert } from "@mui/material";
import AddOnTable from "./addOnTable";
import apiService from "../services/apiSevrvice";

const exportTableToExcel = (tableData, fileName = "table_data.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(dataBlob, fileName);
};

const EditableTable = ({
  data,
  setData,
  pageSize,
  pageIndex,
  setPageSize,
  setPageIndex,
  pageCount,
  selectedRows,
  setSelectedRows,
  handleDeleteSelectedRows,
  handleSaveEditedRows,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRows, setEditedRows] = useState(new Set());
  const [phoneOptions, setPhoneOptions] = useState([]);
  const [cardOptions, setCardOptions] = useState([]);
  const [openAddOn, setOpenAddOn] = useState(false);
  const [addOnRow, setAddOnRow] = useState(null);
  const [addOnMode, setAddOnMode] = useState("view");
  const [isLoadingPhones, setIsLoadingPhones] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Handlers for Snackbar
  const openSnackbarHandler = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbarHandler = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Define table columns
  const columns = useMemo(
    () => [
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

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    nextPage,
    previousPage,
    setPageSize: setRTPageSize,
  } = useTable(
    {
      columns,
      data: data,
      initialState: { pageIndex: pageIndex - 1, pageSize },
      manualPagination: true,
      pageCount,
    },
    usePagination
  );


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingPhones(true);
        const phoneData = await apiService.fetchPhoneNumbers(openSnackbarHandler);
        setPhoneOptions(phoneData);
      } catch (error) {
        openSnackbarHandler("Failed to fetch phone numbers", "error");
      } finally {
        setIsLoadingPhones(false);
      }

      try {
        setIsLoadingCards(true);
        const cardData = await apiService.fetchCardNumbers(openSnackbarHandler);
        setCardOptions(cardData);
      } catch (error) {
        openSnackbarHandler("Failed to fetch card numbers", "error");
      } finally {
        setIsLoadingCards(false);
      }
    };
    fetchData();
  }, [openSnackbarHandler]);

  const handlePreviousPage = useCallback(() => {
    if (pageIndex > 1) {
      setPageIndex(pageIndex - 1);
      previousPage();
    }
  }, [pageIndex, previousPage, setPageIndex]);

  const handleNextPage = useCallback(() => {
    if (pageIndex < pageCount) {
      setPageIndex(pageIndex + 1);
      nextPage();
    }
  }, [pageIndex, pageCount, nextPage, setPageIndex]);

  const handlePageSizeChange = useCallback(
    (e) => {
      const newSize = Number(e.target.value);
      setPageSize(newSize);
      setPageIndex(1);
      setRTPageSize(newSize);
    },
    [setPageSize, setPageIndex, setRTPageSize]
  );

  const handlePhoneSelect = useCallback(
    (rowId, newValue) => {
      const selectedPhoneOption = phoneOptions.find(
        (option) => option.sdt === newValue.sdt
      );

      const updatedData = data.map((row) => {
        if (row.id === rowId) {
          if (selectedPhoneOption) {
            return {
              ...row,
              sdt: selectedPhoneOption.sdt,
              tenAG: selectedPhoneOption.tenAG || "",
              mail: selectedPhoneOption.mail || "",
            };
          } else {
            return {
              ...row,
              sdt: newValue.sdt || "",
              tenAG: "",
              mail: "",
            };
          }
        }
        return row;
      });

      setData(updatedData);
      setEditedRows((prev) => new Set(prev).add(rowId));
    },
    [data, phoneOptions, setData]
  );

  const handleSoTheSelect = useCallback(
    (rowId, value) => {
      const updatedData = data.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            soThe: value,
          };
        }
        return row;
      });

      setData(updatedData);
      setEditedRows((prev) => new Set(prev).add(rowId));
    },
    [data, setData]
  );

  const handleCellEdit = useCallback(
    (rowId, columnId, value) => {
      const updatedData = data.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            [columnId]: value,
          };
        }
        return row;
      });

      setData(updatedData);
      setEditedRows((prev) => new Set(prev).add(rowId));
    },
    [data, setData]
  );

  const handleClickAddOnOpen = useCallback(
    (rowId) => {
      setAddOnRow(rowId);
      const isRowSelected = selectedRows.includes(rowId);
      setAddOnMode(isEditing && isRowSelected ? "edit" : "view");
      setOpenAddOn(true);
    },
    [isEditing, selectedRows]
  );

  const toggleRowSelection = useCallback(
    (rowId) => {
      setSelectedRows((prev) =>
        prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
      );
    },
    [setSelectedRows]
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedRows.length === data.length && data.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((row) => row.id));
    }
  }, [selectedRows, data, setSelectedRows]);

  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      const formattedTickets = Array.from(editedRows).map((id) => {
        const row = data.find((item) => item.id === id);
        return {
          id: row.id,
          ngayXuat: new Date(row.ngayXuat).toISOString(),
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
            agCustomerId: row.agCustomerId,
            tenAG: row.tenAG,
            mail: row.mail,
            sdt: row.sdt,
          },
          customer: {
            customerId: row.customerId,
            tenKhachHang: row.tenKhachHang,
            gioiTinh: row.gioiTinh,
          },
          card: {
            cardId: row.cardId,
            soThe: row.soThe,
          },
          taiKhoan: row.taiKhoan,
        };
      });

      handleSaveEditedRows(formattedTickets);
      setEditedRows(new Set());
    }
    setIsEditing((prev) => !prev);
  }, [isEditing, editedRows, data, handleSaveEditedRows]);

  const isAllSelected = useMemo(
    () => selectedRows.length === data.length && data.length > 0,
    [selectedRows, data]
  );

  const handleDialogAddOnClose = useCallback(() => {
    setOpenAddOn(false);
  }, []);

  const handleSave = useCallback(
    (formData, rowId) => {
      const updatedData = data.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            addOn: JSON.stringify(formData),
          };
        }
        return row;
      });
      setData(updatedData);
      setEditedRows((prev) => new Set(prev).add(rowId));
    },
    [data, setData]
  );

  const memoizedInitialData = useMemo(() => {
    if (addOnRow !== null) {
      const row = data.find((item) => item.id === addOnRow);
      if (row && row.addOn) {
        try {
          const parsedData = JSON.parse(row.addOn);
          return parsedData;
        } catch (error) {
          console.error("Error parsing JSON:", error);
          return [{ stt: "", dichVu: "", soTien: "" }];
        }
      }
      return [{ stt: "", dichVu: "", soTien: "" }];
    }
    return [{ stt: "", dichVu: "", soTien: "" }];
  }, [addOnRow, data]);

  // Internal function for rendering Pagination Controls
  const renderPaginationControls = () => (
    <div style={{ marginTop: "20px", textAlign: "center" }}>
      <button
        onClick={handlePreviousPage}
        disabled={pageIndex === 1}
        style={{
          cursor: pageIndex === 1 ? "not-allowed" : "pointer",
          marginRight: "10px",
        }}
        aria-label="Previous Page"
      >
        Previous
      </button>
      <span>
        Page {pageIndex} of {pageCount || 1}
      </span>
      <button
        onClick={handleNextPage}
        disabled={pageIndex >= pageCount}
        style={{
          cursor: pageIndex >= pageCount ? "not-allowed" : "pointer",
          marginLeft: "10px",
        }}
        aria-label="Next Page"
      >
        Next
      </button>
      <select
        value={pageSize}
        onChange={handlePageSizeChange}
        style={{ marginLeft: "10px" }}
        aria-label="Select Page Size"
      >
        {[10, 20, 50, 100].map((size) => (
          <option key={size} value={size}>
            Show {size}
          </option>
        ))}
      </select>
    </div>
  );

  // Internal function for rendering Action Buttons
  const renderActionButtons = () => (
    <div style={{ marginTop: "20px", textAlign: "center" }}>
      <button
        onClick={toggleEditMode}
        style={{ marginRight: "10px" }}
        aria-label={isEditing ? "Save Changes" : "Edit Table"}
        disabled={selectedRows.length === 0}
      >
        {isEditing ? "Save" : "Edit"}
      </button>
      <button
        onClick={handleDeleteSelectedRows}
        disabled={selectedRows.length === 0}
        style={{
          marginRight: "10px",
          cursor: selectedRows.length === 0 ? "not-allowed" : "pointer",
        }}
        aria-label="Delete Selected Rows"
      >
        Delete Selected
      </button>
      <button
        onClick={() => exportTableToExcel(data)}
        style={{ marginRight: "10px" }}
        aria-label="Export to Excel"
      >
        Export to Excel
      </button>
    </div>
  );
  return (
    <>
      <div>
        {isLoadingPhones || isLoadingCards ? (
          <p style={{ textAlign: "center", margin: "20px" }}>
            Loading options...
          </p>
        ) : data.length === 0 ? (
          <p style={{ textAlign: "center", margin: "20px" }}>
            Không có dữ liệu để hiển thị
          </p>
        ) : (
          <>
            <div className="table-wrapper">
              <table {...getTableProps()} className="table-container">
                <thead>
                  {headerGroups.map((headerGroup) => (
                    <tr
                      {...headerGroup.getHeaderGroupProps()}
                      key={headerGroup.id}
                    >
                      <th style={{ width: "50px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          aria-label="Chọn tất cả hàng"
                          disabled={isEditing}
                        />
                      </th>
                      {headerGroup.headers.map((column) => (
                        <th {...column.getHeaderProps()} key={column.id}>
                          {column.render("Header")}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()} key={row.original.id}>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(row.original.id)}
                            onChange={() => toggleRowSelection(row.original.id)}
                            aria-label={`Chọn hàng ${row.original.id}`}
                            disabled={isEditing}
                          />
                        </td>
                        {row.cells.map((cell) => (
                          <td {...cell.getCellProps()} key={cell.column.id}>
                            {cell.column.id === "addOn" ? (
                              <button
                                onClick={() =>
                                  handleClickAddOnOpen(row.original.id)
                                }
                                className="button-container"
                                style={{ width: "100%" }}
                                aria-label={
                                  isEditing && selectedRows.includes(row.original.id)
                                    ? "Xem và sửa Add On"
                                    : "Xem Add On"
                                }
                              >
                                {isEditing && selectedRows.includes(row.original.id)
                                  ? "Xem và sửa"
                                  : "Xem"}
                              </button>
                            ) : isEditing && selectedRows.includes(row.original.id) ? (
                              (() => {
                                switch (cell.column.id) {
                                  case "sdt":
                                    return (
                                      <>
                                        <input
                                          list={`phone-options-${row.original.id}`}
                                          value={cell.value || ""}
                                          onChange={(e) =>
                                            handlePhoneSelect(row.original.id, {
                                              sdt: e.target.value,
                                            })
                                          }
                                          placeholder="Nhập số điện thoại"
                                          className="input-field"
                                          aria-label="Nhập số điện thoại"
                                        />
                                        <datalist id={`phone-options-${row.original.id}`}>
                                          {phoneOptions.map((option, idx) => (
                                            <option
                                              key={idx}
                                              value={option.sdt}
                                            />
                                          ))}
                                        </datalist>
                                      </>
                                    );
                                  case "soThe":
                                    return (
                                      <>
                                        <input
                                          list={`so-the-${row.original.id}`}
                                          value={cell.value || ""}
                                          onChange={(e) =>
                                            handleSoTheSelect(
                                              row.original.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder="Nhập số thẻ"
                                          className="input-field"
                                          aria-label="Nhập số thẻ"
                                        />
                                        <datalist id={`so-the-${row.original.id}`}>
                                          {cardOptions.map((option, idx) => (
                                            <option
                                              key={idx}
                                              value={option.soThe}
                                            />
                                          ))}
                                        </datalist>
                                      </>
                                    );
                                  case "gioiTinh":
                                    return (
                                      <select
                                        value={cell.value || "Nam"}
                                        onChange={(e) =>
                                          handleCellEdit(
                                            row.original.id,
                                            "gioiTinh",
                                            e.target.value
                                          )
                                        }
                                        className="input-field"
                                        aria-label="Chọn giới tính"
                                      >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                      </select>
                                    );
                                  case "veHoanKhay":
                                    return (
                                      <select
                                        value={cell.value || "Có"}
                                        onChange={(e) =>
                                          handleCellEdit(
                                            row.original.id,
                                            "veHoanKhay",
                                            e.target.value
                                          )
                                        }
                                        className="input-field"
                                        aria-label="Chọn vé hoàn khay"
                                      >
                                        <option value="Có">Có</option>
                                        <option value="Không">Không</option>
                                      </select>
                                    );
                                  case "ngayGioBayDi":
                                  case "ngayGioBayDen":
                                  case "ngayXuat":
                                    return (
                                      <input
                                        type="datetime-local"
                                        value={
                                          cell.value
                                            ? cell.value.slice(0, 16)
                                            : ""
                                        }
                                        onChange={(e) =>
                                          handleCellEdit(
                                            row.original.id,
                                            cell.column.id,
                                            e.target.value
                                          )
                                        }
                                        className="input-field"
                                        aria-label={`Nhập ${cell.column.Header}`}
                                      />
                                    );
                                  default:
                                    return (
                                      <input
                                        type="text"
                                        value={cell.value || ""}
                                        onChange={(e) =>
                                          handleCellEdit(
                                            row.original.id,
                                            cell.column.id,
                                            e.target.value
                                          )
                                        }
                                        className="input-field"
                                        aria-label={`Nhập ${cell.column.Header}`}
                                      />
                                    );
                                }
                              })()
                            ) : (
                              <>
                                {(cell.column.id === "ngayXuat" ||
                                  cell.column.id === "ngayGioBayDi" ||
                                  cell.column.id === "ngayGioBayDen") ? (
                                  formatDate(cell.value)
                                ) : (
                                  cell.value
                                )}
                              </>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPaginationControls()}
            {renderActionButtons()}
          </>
        )}
      </div>
      <AddOnTable
        open={openAddOn}
        onClose={handleDialogAddOnClose}
        onSave={handleSave}
        initialData={memoizedInitialData}
        setData={setData}
        data={data}
        rowIndex={addOnRow}
        mode={addOnMode}
      />

      {snackbar.open && (
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
      )}
    </>
  );
};

export default EditableTable;
