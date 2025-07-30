// src/form/EditableTable.jsx
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useTable, usePagination } from "react-table";
import "../style/table-custom.css";
import { formatDate } from "../constant";
import {
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import AddOnTable from "./addOnTable";
import apiService from "../services/apiSevrvice";
import { fetchWithAuth } from "../services/authService";

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

const exportTableToExcel = (tableData, fileName = "table_data.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });
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
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const openSnackbarHandler = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbarHandler = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleOpenDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    handleDeleteSelectedRows();
    setOpenDeleteDialog(false);
  }, [handleDeleteSelectedRows]);

  const columns = useMemo(
    () => [
      { Header: "Ngày xuất", accessor: "ngayXuat" },
      { Header: "Liên hệ (SĐT)", accessor: "sdt" },
      { Header: "Mail", accessor: "mail" },
      { Header: "Tên AG", accessor: "tenAG" },
      { Header: "Add on", accessor: "addOn" },
      { Header: "Vé có hoàn hay không", accessor: "veHoanKhay" },
      { Header: "Số thẻ thanh toán", accessor: "soThe" },
      { Header: "Lưu ý", accessor: "luuY" },
      { Header: "Thu AG", accessor: "thuAG" },
      { Header: "Giá xuất", accessor: "giaXuat" },
      {
        Header: "Chi tiết vé",
        columns: [
          { Header: "Chặng", accessor: "changBay" },
          { Header: "Ngày giờ bay", accessor: "ngayGioBay" },
          { Header: "Hãng bay", accessor: "hangBay" },
          { Header: "Số hiệu chuyến bay", accessor: "soHieuChuyenBay" },
          { Header: "Tham chiếu HHK", accessor: "thamChieuHang" },
          { Header: "Mã đặt chỗ hãng", accessor: "maDatCho" },
          { Header: "Tên khách hàng", accessor: "tenKhachHang" },
        ],
      },
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
        const phoneData = await apiService.fetchPhoneNumbers(
          openSnackbarHandler
        );
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

  const flattenData = (data) => {
    const result = [];
    data.forEach((row) => {
      if (row.veDetail && row.veDetail.length > 0) {
        row.veDetail.forEach((detail) => {
          result.push({
            ...row,
            changBay: detail.changBay,
            ngayGioBay: detail.ngayGioBay,
            hangBay: detail.hangBay,
            soHieuChuyenBay: detail.soHieuChuyenBay,
            thamChieuHang: detail.thamChieuHang,
            maDatCho: detail.maDatCho,
            tenKhachHang: detail.tenKhachHang,
            giaXuat: row.giaXuat, // Giữ giá xuất cho mỗi chi tiết vé
          });
        });
      } else {
        result.push(row);
      }
    });
    return result;
  };

  const tableData = useMemo(() => flattenData(data), [data]);
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
      const selectedCard = cardOptions.find((option) => option.soThe === value);
      const updatedData = data.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            soThe: value,
            cardId: selectedCard?.id || row.cardId || "",
          };
        }
        return row;
      });
      setData(updatedData);
      setEditedRows((prev) => new Set(prev).add(rowId));
    },
    [data, cardOptions, setData]
  );

  // Sửa handleCellEdit để luôn format input khi nhập
  const handleCellEdit = useCallback(
    (rowId, columnId, value) => {
      let newValue = value;
      if (columnId === "thuAG" || columnId === "giaXuat") {
        newValue = formatNumberDot(value);
      }
      setData((prevData) =>
        prevData.map((row) =>
          row.id === rowId ? { ...row, [columnId]: newValue } : row
        )
      );
      setEditedRows((prev) => new Set(prev).add(rowId));
    },
    [setData]
  );

  const handleVeDetailEdit = useCallback(
    (rowId, detailIndex, columnId, value) => {
      const updatedData = data.map((row) => {
        if (row.id === rowId) {
          const updatedVeDetail = [...(row.veDetail || [])];
          if (updatedVeDetail[detailIndex]) {
            updatedVeDetail[detailIndex] = {
              ...updatedVeDetail[detailIndex],
              [columnId]: value,
            };
          }
          return {
            ...row,
            veDetail: updatedVeDetail,
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
        prev.includes(rowId)
          ? prev.filter((id) => id !== rowId)
          : [...prev, rowId]
      );
    },
    [setSelectedRows]
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedRows.length === tableData.length && tableData.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(tableData.map((row) => row.id));
    }
  }, [selectedRows, tableData, setSelectedRows]);

  // Sửa toggleEditMode để khi gửi API sẽ parse về số
  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      const formattedTickets = Array.from(editedRows).map((id) => {
        const row = data.find((item) => item.id === id);
        const selectedCard = cardOptions.find(
          (option) => option.soThe === row.soThe
        );
        const selectedAgCustomer = phoneOptions.find(
          (option) => option.sdt === row.sdt
        );
        const veDetails = (row.veDetail || []).map((detail) => ({
          changBay: detail.changBay || "",
          ngayGioBay: detail.ngayGioBay
            ? new Date(detail.ngayGioBay).toISOString()
            : new Date().toISOString(),
          hangBay: detail.hangBay || "",
          soHieuChuyenBay: detail.soHieuChuyenBay || "",
          thamChieuHang: detail.thamChieuHang || "",
          maDatCho: detail.maDatCho || "",
          tenKhachHang: detail.tenKhachHang || "",
        }));
        return {
          id: row.id,
          agCustomerId: selectedAgCustomer?.id || row.agCustomerId || "",
          ngayXuat: row.ngayXuat
            ? new Date(row.ngayXuat).toISOString()
            : new Date().toISOString(),
          giaXuat: parseNumberDot(row.giaXuat || ""),
          addOn: row.addOn || "",
          thuAG: parseNumberDot(row.thuAG || ""),
          luuY: row.luuY || "",
          veHoanKhay: row.veHoanKhay === "Có" ? true : false,
          cardId: selectedCard?.id || row.cardId || "",
          veDetails,
        };
      });
      fetchWithAuth(
        "/Ve/xuatve",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedTickets),
        },
        openSnackbarHandler
      ).then(() => {
        setEditedRows(new Set());
        openSnackbarHandler("Lưu thay đổi thành công!", "success");
      }).catch(() => {
        openSnackbarHandler("Có lỗi khi lưu thay đổi!", "error");
      });

      // Format lại các trường thuAG và giaXuat khi thoát edit mode
      setData((prevData) =>
        prevData.map((row) =>
          editedRows.has(row.id)
            ? {
                ...row,
                thuAG: formatNumberDot(parseNumberDot(row.thuAG || "")),
                giaXuat: formatNumberDot(parseNumberDot(row.giaXuat || "")),
              }
            : row
        )
      );
    }
    setIsEditing((prev) => !prev);
  }, [isEditing, editedRows, data, cardOptions, phoneOptions, openSnackbarHandler, setData]);

  const isAllSelected = useMemo(
    () => selectedRows.length === tableData.length && tableData.length > 0,
    [selectedRows, tableData]
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
    <div className="pagination-controls">
      <button
        onClick={handlePreviousPage}
        disabled={pageIndex === 1}
        className="pagination-button"
        aria-label="Previous Page"
      >
        Trang trước
      </button>
      <span className="pagination-info">
        Trang {pageIndex} của {pageCount || 1}
      </span>
      <button
        onClick={handleNextPage}
        disabled={pageIndex >= pageCount}
        className="pagination-button"
        aria-label="Next Page"
      >
        Trang sau
      </button>
      <select
        value={pageSize}
        onChange={handlePageSizeChange}
        className="page-size-select"
        aria-label="Select Page Size"
      >
        {[10, 20, 50, 100].map((size) => (
          <option key={size} value={size}>
            Số hàng {size}
          </option>
        ))}
      </select>
    </div>
  );

  // Internal function for rendering Action Buttons
  const renderActionButtons = () => (
    <div className="action-buttons">
      <button
        onClick={toggleEditMode}
        className={`action-button edit ${
          selectedRows.length === 0 ? "disabled" : ""
        }`}
        aria-label={isEditing ? "Save Changes" : "Edit Table"}
        disabled={selectedRows.length === 0}
      >
        {isEditing ? "Lưu thay đổi" : "Chỉnh sửa"}
      </button>
      <button
        onClick={handleOpenDeleteDialog}
        disabled={selectedRows.length === 0}
        className={`action-button edit ${
          selectedRows.length === 0 ? "disabled" : ""
        }`}
        aria-label="Xóa hàng đã chọn"
      >
        Xóa hàng đã chọn ({selectedRows.length})
      </button>
      <button
        onClick={() => exportTableToExcel(tableData)}
        className="action-button export"
        aria-label="Export to Excel"
      >
        Xuất file Excel
      </button>
    </div>
  );

  // Add horizontal scroll support with Shift + wheel: dùng ref để đảm bảo luôn bắt sự kiện đúng vùng
  const tableWrapperRef = useRef(null);
  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;
    const handleWheelScroll = (e) => {
      if (e.shiftKey) {
        console.log("Shift + Wheel detected, scrolling horizontally");
        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
        if (maxScroll > 0) {
          if (
            (e.deltaY < 0 && wrapper.scrollLeft > 0) ||
            (e.deltaY > 0 && wrapper.scrollLeft < maxScroll)
          ) {
            e.preventDefault();
            wrapper.scrollLeft += e.deltaY;
          }
        }
      }
    };
    wrapper.addEventListener("wheel", handleWheelScroll, { passive: false });
    return () => {
      wrapper.removeEventListener("wheel", handleWheelScroll);
    };
  }, []);

  return (
    <>
      <div
        style={{
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          padding: "20px",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        {isLoadingPhones || isLoadingCards ? (
          <div className="loading-message">
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : tableData.length === 0 ? (
          <div className="empty-message">
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>📊</div>
            <div>Không có dữ liệu để hiển thị</div>
          </div>
        ) : (
          <>
            <div className="table-wrapper" ref={tableWrapperRef}>
              <table {...getTableProps()} className="table-container">
                <thead>
                  <tr>
                    <th
                      style={{
                        width: "32px",
                        minWidth: "28px",
                        textAlign: "center",
                      }}
                      rowSpan={2}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="table-checkbox"
                        aria-label="Chọn tất cả các hàng"
                        disabled={isEditing}
                        style={{ margin: 0, width: 15, height: 15 }}
                      />
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Ngày xuất
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Liên hệ (SĐT)
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Mail
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Tên AG
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Add on
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Có hoàn hay không
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Số thẻ thanh toán
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Lưu ý
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Thu AG
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Giá xuất
                      </span>
                    </th>
                    <th
                      style={{
                        background: "rgba(59, 130, 246, 0.9)",
                        fontSize: "16px",
                        fontWeight: "800",
                      }}
                      colSpan={7}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        Chi tiết vé
                      </span>
                    </th>
                  </tr>
                  <tr>
                    <th
                      style={{
                        background: "rgba(59, 130, 246, 0.8)",
                        fontSize: "13px",
                      }}
                    >
                      Chặng
                    </th>
                    <th
                      style={{
                        background: "rgba(59, 130, 246, 0.8)",
                        fontSize: "13px",
                      }}
                    >
                      Ngày giờ bay
                    </th>
                    <th
                      style={{
                        background: "rgba(59, 130, 246, 0.8)",
                        fontSize: "13px",
                      }}
                    >
                      Hãng bay
                    </th>
                    <th
                      style={{
                        background: "rgba(59, 130, 246, 0.8)",
                        fontSize: "13px",
                      }}
                    >
                      Số hiệu chuyến bay
                    </th>
                    <th
                      style={{
                        background: "rgba(59, 130, 246, 0.8)",
                        fontSize: "13px",
                      }}
                    >
                      Tham chiếu HHK
                    </th>
                    <th
                      style={{
                        background: "rgba(59, 130, 246, 0.8)",
                        fontSize: "13px",
                      }}
                    >
                      Mã đặt chỗ hãng
                    </th>
                    <th
                      style={{
                        background: "rgba(59, 130, 246, 0.8)",
                        fontSize: "13px",
                      }}
                    >
                      Tên khách hàng
                    </th>
                  </tr>
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row) => {
                    prepareRow(row);
                    const veDetailRows = row.original.veDetail || [];
                    return veDetailRows.length > 0 ? (
                      veDetailRows.map((detail, idx) => (
                        <tr key={row.original.id + "-" + idx}>
                          {idx === 0 && (
                            <>
                              <td
                                style={{
                                  width: "32px",
                                  minWidth: "28px",
                                  textAlign: "center",
                                  border: "1px solid #bdbdbd",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRows.includes(row.original.id)}
                                  onChange={() => toggleRowSelection(row.original.id)}
                                  className="table-checkbox"
                                  aria-label={`Chọn hàng ${row.original.id}`}
                                  disabled={isEditing}
                                  style={{ margin: 0, width: 15, height: 15 }}
                                />
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                                selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="datetime-local"
                                    value={
                                      row.original.ngayXuat
                                        ? new Date(row.original.ngayXuat)
                                            .toISOString()
                                            .slice(0, 16)
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleCellEdit(
                                        row.original.id,
                                        "ngayXuat",
                                        e.target.value
                                      )
                                    }
                                    className="table-input"
                                  />
                                ) : (
                                  formatDate(row.original.ngayXuat)
                                )}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                                selectedRows.includes(row.original.id) ? (
                                  <div className="dropdown-container">
                                    <input
                                      list={`phone-options-edit-${row.original.id}`}
                                      value={row.original.sdt || ""}
                                      onChange={(e) =>
                                        handlePhoneSelect(row.original.id, {
                                          sdt: e.target.value,
                                        })
                                      }
                                      placeholder="Chọn hoặc nhập SĐT"
                                      className="table-input"
                                    />
                                    <datalist
                                      id={`phone-options-edit-${row.original.id}`}
                                    >
                                      {phoneOptions.map((option, idx) => (
                                        <option key={idx} value={option.sdt} />
                                      ))}
                                    </datalist>
                                  </div>
                                ) : (
                                  row.original.sdt
                                )}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                                selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="email"
                                    value={row.original.mail || ""}
                                    onChange={(e) =>
                                      handleCellEdit(
                                        row.original.id,
                                        "mail",
                                        e.target.value
                                      )
                                    }
                                    placeholder="example@email.com"
                                    className="table-input"
                                  />
                                ) : (
                                  row.original.mail
                                )}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                                selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="text"
                                    value={row.original.tenAG || ""}
                                    onChange={(e) =>
                                      handleCellEdit(
                                        row.original.id,
                                        "tenAG",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Nhập tên AG"
                                    style={{ width: "100%", padding: "4px" }}
                                  />
                                ) : (
                                  row.original.tenAG
                                )}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                <button
                                  onClick={() =>
                                    handleClickAddOnOpen(row.original.id)
                                  }
                                  className="button-container"
                                  style={{
                                    width: "100%",
                                    padding: "8px 16px",
                                    backgroundColor: "rgba(59, 130, 246, 0.9)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                  }}
                                  aria-label={
                                    isEditing &&
                                    selectedRows.includes(row.original.id)
                                      ? "Xem và sửa Add On"
                                      : "Xem Add On"
                                  }
                                >
                                  {isEditing &&
                                  selectedRows.includes(row.original.id)
                                    ? "Xem và sửa"
                                    : "Xem"}
                                </button>
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                                selectedRows.includes(row.original.id) ? (
                                  <select
                                    value={row.original.veHoanKhay || "Có"}
                                    onChange={(e) =>
                                      handleCellEdit(
                                        row.original.id,
                                        "veHoanKhay",
                                        e.target.value
                                      )
                                    }
                                    style={{ width: "100%", padding: "4px" }}
                                  >
                                    <option value="Có">Có</option>
                                    <option value="Không">Không</option>
                                  </select>
                                ) : (
                                  row.original.veHoanKhay ? "Có hoàn" : "Không hoàn"
                                )}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                                selectedRows.includes(row.original.id) ? (
                                  <>
                                    <input
                                      list={`card-options-edit-${row.original.id}`}
                                      value={row.original.soThe || ""}
                                      onChange={(e) =>
                                        handleSoTheSelect(
                                          row.original.id,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Nhập số thẻ"
                                      style={{ width: "100%", padding: "4px" }}
                                    />
                                    <datalist
                                      id={`card-options-edit-${row.original.id}`}
                                    >
                                      {cardOptions.map((option, idx) => (
                                        <option
                                          key={idx}
                                          value={option.soThe}
                                        />
                                      ))}
                                    </datalist>
                                  </>
                                ) : (
                                  row.original.soThe
                                )}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                                selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="text"
                                    value={row.original.luuY || ""}
                                    onChange={(e) =>
                                      handleCellEdit(
                                        row.original.id,
                                        "luuY",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Nhập lưu ý"
                                    style={{ width: "100%", padding: "4px" }}
                                  />
                                ) : (
                                  row.original.luuY
                                )}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                selectedRows.includes(row.original.id) ? (
                  <input
                    type="text"
                    value={formatNumberDot(row.original.thuAG || "")}
                    onChange={(e) =>
                      handleCellEdit(
                        row.original.id,
                        "thuAG",
                        e.target.value
                      )
                    }
                    placeholder="Nhập thu AG"
                    style={{ width: "100%", padding: "4px" }}
                  />
                ) : (
                  formatNumberDot(row.original.thuAG)
                )}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #bdbdbd",
                                  textAlign: "center",
                                }}
                                rowSpan={veDetailRows.length}
                              >
                                {isEditing &&
                selectedRows.includes(row.original.id) ? (
                  <input
                    type="text"
                    value={formatNumberDot(row.original.giaXuat || "")}
                    onChange={(e) =>
                      handleCellEdit(
                        row.original.id,
                        "giaXuat",
                        e.target.value
                      )
                    }
                    placeholder="Nhập giá xuất"
                    style={{ width: "100%", padding: "4px" }}
                  />
                ) : (
                  formatNumberDot(row.original.giaXuat)
                )}
                              </td>
                            </>
                          )}
                          {/* Các cột chi tiết vé */}
                          <td
                            style={{
                              border: "1px solid #bdbdbd",
                              textAlign: "center",
                            }}
                          >
                            {isEditing &&
                            selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.changBay || ""}
                                onChange={(e) =>
                                  handleVeDetailEdit(
                                    row.original.id,
                                    idx,
                                    "changBay",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập chặng bay"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.changBay
                            )}
                          </td>
                          <td
                            style={{
                              border: "1px solid #bdbdbd",
                              textAlign: "center",
                            }}
                          >
                            {isEditing &&
                            selectedRows.includes(row.original.id) ? (
                              <input
                                type="datetime-local"
                                value={
                                  detail.ngayGioBay
                                    ? new Date(detail.ngayGioBay)
                                        .toISOString()
                                        .slice(0, 16)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleVeDetailEdit(
                                    row.original.id,
                                    idx,
                                    "ngayGioBay",
                                    e.target.value
                                  )
                                }
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              formatDate(detail.ngayGioBay)
                            )}
                          </td>
                          <td
                            style={{
                              border: "1px solid #bdbdbd",
                              textAlign: "center",
                            }}
                          >
                            {isEditing &&
                            selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.hangBay || ""}
                                onChange={(e) =>
                                  handleVeDetailEdit(
                                    row.original.id,
                                    idx,
                                    "hangBay",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập hãng bay"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.hangBay
                            )}
                          </td>
                          <td
                            style={{
                              border: "1px solid #bdbdbd",
                              textAlign: "center",
                            }}
                          >
                            {isEditing &&
                            selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.soHieuChuyenBay || ""}
                                onChange={(e) =>
                                  handleVeDetailEdit(
                                    row.original.id,
                                    idx,
                                    "soHieuChuyenBay",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập số hiệu"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.soHieuChuyenBay
                            )}
                          </td>
                          <td
                            style={{
                              border: "1px solid #bdbdbd",
                              textAlign: "center",
                            }}
                          >
                            {isEditing &&
                            selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.thamChieuHang || ""}
                                onChange={(e) =>
                                  handleVeDetailEdit(
                                    row.original.id,
                                    idx,
                                    "thamChieuHang",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập tham chiếu"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.thamChieuHang
                            )}
                          </td>
                          <td
                            style={{
                              border: "1px solid #bdbdbd",
                              textAlign: "center",
                            }}
                          >
                            {isEditing &&
                            selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.maDatCho || ""}
                                onChange={(e) =>
                                  handleVeDetailEdit(
                                    row.original.id,
                                    idx,
                                    "maDatCho",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập mã đặt chỗ"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.maDatCho
                            )}
                          </td>
                          <td
                            style={{
                              border: "1px solid #bdbdbd",
                              textAlign: "center",
                            }}
                          >
                            {isEditing &&
                            selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.tenKhachHang || ""}
                                onChange={(e) =>
                                  handleVeDetailEdit(
                                    row.original.id,
                                    idx,
                                    "tenKhachHang",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập tên khách hàng"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.tenKhachHang
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={row.original.id}>
                        {/* Các cột bên trái */}
                        <td
                          style={{
                            textAlign: "center",
                            border: "1px solid #bdbdbd",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(row.original.id)}
                            onChange={() => toggleRowSelection(row.original.id)}
                            aria-label={`Chọn hàng ${row.original.id}`}
                            disabled={isEditing}
                          />
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <input
                              type="datetime-local"
                              value={
                                row.original.ngayXuat
                                  ? new Date(row.original.ngayXuat)
                                      .toISOString()
                                      .slice(0, 16)
                                  : ""
                              }
                              onChange={(e) =>
                                handleCellEdit(
                                  row.original.id,
                                  "ngayXuat",
                                  e.target.value
                                )
                              }
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            formatDate(row.original.ngayXuat)
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <>
                              <input
                                list={`phone-options-edit-${row.original.id}`}
                                value={row.original.sdt || ""}
                                onChange={(e) =>
                                  handlePhoneSelect(row.original.id, {
                                    sdt: e.target.value,
                                  })
                                }
                                placeholder="Nhập số điện thoại"
                                style={{ width: "100%", padding: "4px" }}
                              />
                              <datalist
                                id={`phone-options-edit-${row.original.id}`}
                              >
                                {phoneOptions.map((option, idx) => (
                                  <option key={idx} value={option.sdt} />
                                ))}
                              </datalist>
                            </>
                          ) : (
                            row.original.sdt
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <input
                              type="email"
                              value={row.original.mail || ""}
                              onChange={(e) =>
                                handleCellEdit(
                                  row.original.id,
                                  "mail",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập email"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.mail
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <input
                              type="text"
                              value={row.original.tenAG || ""}
                              onChange={(e) =>
                                handleCellEdit(
                                  row.original.id,
                                  "tenAG",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập tên AG"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.tenAG
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <button
                              onClick={() =>
                                handleClickAddOnOpen(row.original.id)
                              }
                              className="button-container"
                              style={{
                                width: "100%",
                                padding: "8px 16px",
                                backgroundColor: "rgba(59, 130, 246, 0.9)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              aria-label={
                                isEditing &&
                                selectedRows.includes(row.original.id)
                                  ? "Xem và sửa Add On"
                                  : "Xem Add On"
                              }
                            >
                              {isEditing &&
                              selectedRows.includes(row.original.id)
                                ? "Xem và sửa"
                                : "Xem"}
                            </button>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "rgba(0, 0, 0, 0.87)",
                              }}
                            >
                              {row.original.addOn
                                ? JSON.parse(row.original.addOn).map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          width: "100%",
                                        }}
                                      >
                                        <span
                                          style={{
                                            flex: 1,
                                            textAlign: "left",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            backgroundColor: "rgba(229, 229, 229, 1)",
                                            marginRight: "4px",
                                          }}
                                        >
                                          {item.dichVu}
                                        </span>
                                        <span
                                          style={{
                                            width: "80px",
                                            textAlign: "right",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            backgroundColor: "rgba(229, 229, 229, 1)",
                                          }}
                                        >
                                          {formatNumberDot(item.soTien)}
                                        </span>
                                      </div>
                                    )
                                  )
                                : "Không có dịch vụ nào"}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <select
                              value={row.original.veHoanKhay || "Có"}
                              onChange={(e) =>
                                handleCellEdit(
                                  row.original.id,
                                  "veHoanKhay",
                                  e.target.value
                                )
                              }
                              style={{ width: "100%", padding: "4px" }}
                            >
                              <option value="Có">Có</option>
                              <option value="Không">Không</option>
                            </select>
                          ) : (
                            row.original.veHoanKhay ? "Có hoàn" : "Không hoàn"
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <input
                              list={`card-options-edit-${row.original.id}`}
                              value={row.original.soThe || ""}
                              onChange={(e) =>
                                handleSoTheSelect(
                                  row.original.id,
                                  e.target.value
                                )
                              }
                              placeholder="Nhập số thẻ"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.soThe
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <input
                              type="text"
                              value={row.original.luuY || ""}
                              onChange={(e) =>
                                handleCellEdit(
                                  row.original.id,
                                  "luuY",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập lưu ý"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.luuY
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <input
                              type="text"
                              value={row.original.thuAG || ""}
                              onChange={(e) =>
                                handleCellEdit(
                                  row.original.id,
                                  "thuAG",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập thu AG"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            formatNumberDot(row.original.thuAG)
                          )}
                        </td>
                        <td
                          style={{
                            border: "1px solid #bdbdbd",
                            textAlign: "center",
                          }}
                        >
                          {isEditing &&
                          selectedRows.includes(row.original.id) ? (
                            <input
                              type="text"
                              value={row.original.giaXuat || ""}
                              onChange={(e) =>
                                handleCellEdit(
                                  row.original.id,
                                  "giaXuat",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập giá xuất"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            formatNumberDot(row.original.giaXuat)
                          )}
                        </td>
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbarHandler}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbarHandler}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Xóa hàng đã chọn?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa {selectedRows.length} hàng đã chọn?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="secondary"
            autoFocus
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openAddOn}
        onClose={handleDialogAddOnClose}
        aria-labelledby="form-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="form-dialog-title">
          {addOnMode === "edit" ? "Sửa Add On" : "Thêm Add On"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {addOnMode === "edit"
              ? "Chỉnh sửa thông tin Add On cho vé đã chọn."
              : "Thêm thông tin Add On cho vé."}
          </DialogContentText>
          <AddOnTable
            initialData={memoizedInitialData}
            onSave={(formData) => handleSave(formData, addOnRow)}
            onClose={handleDialogAddOnClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditableTable;
