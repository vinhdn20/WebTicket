// src/form/EditableTable.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useTable, usePagination } from "react-table";
import "../style/table.css";
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
      const selectedCard = cardOptions.find(
        (option) => option.soThe === value
      );
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

  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      // Format data correctly for the API according to the expected structure
      const formattedTickets = Array.from(editedRows).map((id) => {
        const row = data.find((item) => item.id === id);
        
        // Find the corresponding cardId and agCustomerId from options
        const selectedCard = cardOptions.find(
          (option) => option.soThe === row.soThe
        );
        const selectedAgCustomer = phoneOptions.find(
          (option) => option.sdt === row.sdt
        );
        
        // Build veDetails array from row.veDetail
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
          giaXuat: row.giaXuat || "",
          addOn: row.addOn || "",
          thuAG: row.thuAG || "",
          luuY: row.luuY || "",
          veHoanKhay: row.veHoanKhay === "Có" ? true : false,
          cardId: selectedCard?.id || row.cardId || "",
          veDetails,
        };
      });
      
      handleSaveEditedRows(formattedTickets);
      setEditedRows(new Set());
    }
    setIsEditing((prev) => !prev);
  }, [isEditing, editedRows, data, handleSaveEditedRows, cardOptions, phoneOptions]);

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
        ⬅️ Trang trước
      </button>
      <span className="pagination-info">
        📄 Trang {pageIndex} của {pageCount || 1}
      </span>
      <button
        onClick={handleNextPage}
        disabled={pageIndex >= pageCount}
        className="pagination-button"
        aria-label="Next Page"
      >
        Trang sau ➡️
      </button>
      <select
        value={pageSize}
        onChange={handlePageSizeChange}
        className="page-size-select"
        aria-label="Select Page Size"
      >
        {[10, 20, 50, 100].map((size) => (
          <option key={size} value={size}>
            📊 Số hàng {size}
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
        className={`action-button edit ${selectedRows.length === 0 ? 'disabled' : ''}`}
        aria-label={isEditing ? "Save Changes" : "Edit Table"}
        disabled={selectedRows.length === 0}
      >
        {isEditing ? "💾 Lưu thay đổi" : "✏️ Chỉnh sửa"}
      </button>
      <button
        onClick={handleOpenDeleteDialog}
        disabled={selectedRows.length === 0}
        className={`action-button delete ${selectedRows.length === 0 ? 'disabled' : ''}`}
        aria-label="Xóa hàng đã chọn"
      >
        🗑️ Xóa hàng đã chọn ({selectedRows.length})
      </button>
      <button
        onClick={() => exportTableToExcel(tableData)}
        className="action-button export"
        aria-label="Export to Excel"
      >
        📊 Xuất file Excel
      </button>
    </div>
  );

  // Add horizontal scroll support with Shift + wheel
  useEffect(() => {
    const handleWheelScroll = (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        e.currentTarget.scrollLeft += e.deltaY;
      }
    };

    const tableWrappers = document.querySelectorAll('.table-wrapper');
    tableWrappers.forEach(wrapper => {
      wrapper.addEventListener('wheel', handleWheelScroll, { passive: false });
    });

    return () => {
      tableWrappers.forEach(wrapper => {
        wrapper.removeEventListener('wheel', handleWheelScroll);
      });
    };
  }, []);

  return (
    <>
      <style>{`
        /* Modern Table Styling */
        .table-wrapper {
          background: white;
          border-radius: 16px;
          overflow-x: auto;
          overflow-y: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          max-width: 100%;
          /* Smooth scrolling */
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Custom scrollbar styling */
        .table-wrapper::-webkit-scrollbar {
          height: 8px;
        }
        
        .table-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .table-wrapper::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }
        
        .table-wrapper::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
        
        .table-container {
          width: 100%;
          min-width: 1200px; /* Minimum width to ensure table doesn't get too cramped */
          border-collapse: collapse;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .table-container th {
          background: rgb(59, 130, 246);
          color: white;
          padding: 16px 12px;
          font-weight: 700;
          font-size: 14px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          white-space: nowrap; /* Prevent header text from wrapping */
          min-width: 120px; /* Minimum width for each column */
        }
        
        .table-container td {
          padding: 12px;
          border: 1px solid #e2e8f0;
          text-align: center;
          font-size: 14px;
          transition: background-color 0.2s ease;
          white-space: nowrap; /* Prevent cell content from wrapping */
          min-width: 120px; /* Minimum width for each column */
        }
        
        .table-container tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .table-container tbody tr:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        /* Modern input styling for table */
        .table-input {
          width: 100%;
          min-width: 100px;
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
        }
        
        .table-input:focus {
          border-color: rgb(59, 130, 246);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .table-input:hover {
          border-color: #9ca3af;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
        
        /* Custom dropdown styling */
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
          font-size: 12px;
        }
        
        .dropdown-container input:focus + .dropdown-icon {
          color: rgb(59, 130, 246);
        }
        
        /* Custom select styling */
        .table-select {
          width: 100%;
          min-width: 100px;
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          appearance: none;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%236b7280" d="M3.5 6L8 10.5L12.5 6z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 40px;
          box-sizing: border-box;
        }
        
        .table-select:focus {
          border-color: rgb(59, 130, 246);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="rgb(59, 130, 246)" d="M3.5 6L8 10.5L12.5 6z"/></svg>');
        }
        
        .table-select:hover {
          border-color: #9ca3af;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
        
        /* Modern checkbox styling */
        .table-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: rgb(59, 130, 246);
          flex-shrink: 0;
        }
        
        /* Responsive table styling */
        @media (max-width: 768px) {
          .table-wrapper {
            margin: 0 -20px;
            border-radius: 0;
          }
          
          .table-container {
            min-width: 800px;
          }
          
          .table-container th,
          .table-container td {
            min-width: 100px;
            font-size: 12px;
            padding: 8px 6px;
          }
        }
        
        /* Loading and empty state styling */
        .loading-message, .empty-message {
          text-align: center;
          padding: 40px;
          color: #6b7280;
          font-size: 16px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        
        /* Pagination controls styling */
        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }
        
        .pagination-button {
          padding: 10px 20px;
          border: 2px solid rgb(59, 130, 246);
          background: white;
          color: rgb(59, 130, 246);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .pagination-button:hover:not(:disabled) {
          background: rgb(59, 130, 246);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }
        
        .pagination-button:disabled {
          border-color: #d1d5db;
          color: #9ca3af;
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        .pagination-info {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        
        .page-size-select {
          padding: 8px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          background: white;
          cursor: pointer;
          font-weight: 500;
          height: 43px;
        }
        
        /* Action buttons styling */
        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 20px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }
        
        .action-button {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: none;
          min-width: 140px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .action-button.edit {
          background: rgb(59, 130, 246);
          color: white;
        }
        
        .action-button.edit:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
        }
        
        .action-button.delete {
          background: rgba(59, 130, 246, 0.7);
          color: white;
        }
        
        .action-button.delete:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
        }
        
        .action-button.export {
          background: rgba(59, 130, 246, 0.9);
          color: white;
        }
        
        .action-button.export:hover {
          background: rgba(59, 130, 246, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
        }
        
        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
      
      <div style={{ 
        backgroundColor: "#f8fafc", 
        minHeight: "100vh", 
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
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
            <div className="table-wrapper">
              <table {...getTableProps()} className="table-container">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }} rowSpan={2}>
                      <span style={{ fontSize: "16px" }}>✅</span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        📅 Ngày xuất
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        📞 Liên hệ (SĐT)
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        📧 Mail
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        👤 Tên AG
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        🎯 Add on
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        ✅ Có hoàn hay không
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        💳 Số thẻ thanh toán
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        📝 Lưu ý
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        💰 Thu AG
                      </span>
                    </th>
                    <th rowSpan={2}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        💵 Giá xuất
                      </span>
                    </th>
                    <th style={{ 
                      background: "rgba(59, 130, 246, 0.9)",
                      fontSize: "16px",
                      fontWeight: "800"
                    }} colSpan={7}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        🎫 Chi tiết vé
                      </span>
                    </th>
                  </tr>
                  <tr>
                    <th style={{ 
                      background: "rgba(59, 130, 246, 0.8)",
                      fontSize: "13px"
                    }}>
                      ✈️ Chặng
                    </th>
                    <th style={{ 
                      background: "rgba(59, 130, 246, 0.8)",
                      fontSize: "13px"
                    }}>
                      🕒 Ngày giờ bay
                    </th>
                    <th style={{ 
                      background: "rgba(59, 130, 246, 0.8)",
                      fontSize: "13px"
                    }}>
                      🏢 Hãng bay
                    </th>
                    <th style={{ 
                      background: "rgba(59, 130, 246, 0.8)",
                      fontSize: "13px"
                    }}>
                      🔢 Số hiệu chuyến bay
                    </th>
                    <th style={{ 
                      background: "rgba(59, 130, 246, 0.8)",
                      fontSize: "13px"
                    }}>
                      📎 Tham chiếu HHK
                    </th>
                    <th style={{ 
                      background: "rgba(59, 130, 246, 0.8)",
                      fontSize: "13px"
                    }}>
                      🎫 Mã đặt chỗ hãng
                    </th>
                    <th style={{ 
                      background: "rgba(59, 130, 246, 0.8)",
                      fontSize: "13px"
                    }}>
                      👥 Tên khách hàng
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
                          {/* Các cột bên trái, chỉ render ở dòng đầu tiên của veDetail */}
                          {idx === 0 && (
                            <>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.includes(row.original.id)}
                                  onChange={() => toggleRowSelection(row.original.id)}
                                  className="table-checkbox"
                                  aria-label={`Chọn hàng ${row.original.id}`}
                                  disabled={isEditing}
                                />
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="datetime-local"
                                    value={row.original.ngayXuat ? new Date(row.original.ngayXuat).toISOString().slice(0, 16) : ""}
                                    onChange={(e) => handleCellEdit(row.original.id, "ngayXuat", e.target.value)}
                                    className="table-input"
                                  />
                                ) : (
                                  formatDate(row.original.ngayXuat)
                                )}
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <div className="dropdown-container">
                                    <input
                                      list={`phone-options-edit-${row.original.id}`}
                                      value={row.original.sdt || ""}
                                      onChange={(e) => handlePhoneSelect(row.original.id, { sdt: e.target.value })}
                                      placeholder="Chọn hoặc nhập SĐT"
                                      className="table-input"
                                    />
                                    <datalist id={`phone-options-edit-${row.original.id}`}>
                                      {phoneOptions.map((option, idx) => (
                                        <option key={idx} value={option.sdt} />
                                      ))}
                                    </datalist>
                                  </div>
                                ) : (
                                  row.original.sdt
                                )}
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="email"
                                    value={row.original.mail || ""}
                                    onChange={(e) => handleCellEdit(row.original.id, "mail", e.target.value)}
                                    placeholder="example@email.com"
                                    className="table-input"
                                  />
                                ) : (
                                  row.original.mail
                                )}
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="text"
                                    value={row.original.tenAG || ""}
                                    onChange={(e) => handleCellEdit(row.original.id, "tenAG", e.target.value)}
                                    placeholder="Nhập tên AG"
                                    style={{ width: "100%", padding: "4px" }}
                                  />
                                ) : (
                                  row.original.tenAG
                                )}
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                <button
                                  onClick={() => handleClickAddOnOpen(row.original.id)}
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
                                    transition: "all 0.2s ease"
                                  }}
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
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <select
                                    value={row.original.veHoanKhay || "Có"}
                                    onChange={(e) => handleCellEdit(row.original.id, "veHoanKhay", e.target.value)}
                                    style={{ width: "100%", padding: "4px" }}
                                  >
                                    <option value="Có">Có</option>
                                    <option value="Không">Không</option>
                                  </select>
                                ) : (
                                  row.original.veHoanKhay
                                )}
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <>
                                    <input
                                      list={`card-options-edit-${row.original.id}`}
                                      value={row.original.soThe || ""}
                                      onChange={(e) => handleSoTheSelect(row.original.id, e.target.value)}
                                      placeholder="Nhập số thẻ"
                                      style={{ width: "100%", padding: "4px" }}
                                    />
                                    <datalist id={`card-options-edit-${row.original.id}`}>
                                      {cardOptions.map((option, idx) => (
                                        <option key={idx} value={option.soThe} />
                                      ))}
                                    </datalist>
                                  </>
                                ) : (
                                  row.original.soThe
                                )}
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="text"
                                    value={row.original.luuY || ""}
                                    onChange={(e) => handleCellEdit(row.original.id, "luuY", e.target.value)}
                                    placeholder="Nhập lưu ý"
                                    style={{ width: "100%", padding: "4px" }}
                                  />
                                ) : (
                                  row.original.luuY
                                )}
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="text"
                                    value={row.original.thuAG || ""}
                                    onChange={(e) => handleCellEdit(row.original.id, "thuAG", e.target.value)}
                                    placeholder="Nhập thu AG"
                                    style={{ width: "100%", padding: "4px" }}
                                  />
                                ) : (
                                  row.original.thuAG
                                )}
                              </td>
                              <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }} rowSpan={veDetailRows.length}>
                                {isEditing && selectedRows.includes(row.original.id) ? (
                                  <input
                                    type="text"
                                    value={row.original.giaXuat || ""}
                                    onChange={(e) => handleCellEdit(row.original.id, "giaXuat", e.target.value)}
                                    placeholder="Nhập giá xuất"
                                    style={{ width: "100%", padding: "4px" }}
                                  />
                                ) : (
                                  row.original.giaXuat
                                )}
                              </td>
                            </>
                          )}
                          {/* Các cột chi tiết vé */}
                          <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                            {isEditing && selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.changBay || ""}
                                onChange={(e) => handleVeDetailEdit(row.original.id, idx, "changBay", e.target.value)}
                                placeholder="Nhập chặng bay"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.changBay
                            )}
                          </td>
                          <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                            {isEditing && selectedRows.includes(row.original.id) ? (
                              <input
                                type="datetime-local"
                                value={detail.ngayGioBay ? new Date(detail.ngayGioBay).toISOString().slice(0, 16) : ""}
                                onChange={(e) => handleVeDetailEdit(row.original.id, idx, "ngayGioBay", e.target.value)}
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              formatDate(detail.ngayGioBay)
                            )}
                          </td>
                          <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                            {isEditing && selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.hangBay || ""}
                                onChange={(e) => handleVeDetailEdit(row.original.id, idx, "hangBay", e.target.value)}
                                placeholder="Nhập hãng bay"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.hangBay
                            )}
                          </td>
                          <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                            {isEditing && selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.soHieuChuyenBay || ""}
                                onChange={(e) => handleVeDetailEdit(row.original.id, idx, "soHieuChuyenBay", e.target.value)}
                                placeholder="Nhập số hiệu"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.soHieuChuyenBay
                            )}
                          </td>
                          <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                            {isEditing && selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.thamChieuHang || ""}
                                onChange={(e) => handleVeDetailEdit(row.original.id, idx, "thamChieuHang", e.target.value)}
                                placeholder="Nhập tham chiếu"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.thamChieuHang
                            )}
                          </td>
                          <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                            {isEditing && selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.maDatCho || ""}
                                onChange={(e) => handleVeDetailEdit(row.original.id, idx, "maDatCho", e.target.value)}
                                placeholder="Nhập mã đặt chỗ"
                                style={{ width: "100%", padding: "4px" }}
                              />
                            ) : (
                              detail.maDatCho
                            )}
                          </td>
                          <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                            {isEditing && selectedRows.includes(row.original.id) ? (
                              <input
                                type="text"
                                value={detail.tenKhachHang || ""}
                                onChange={(e) => handleVeDetailEdit(row.original.id, idx, "tenKhachHang", e.target.value)}
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
                        <td style={{ textAlign: "center", border: "1px solid #bdbdbd" }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(row.original.id)}
                            onChange={() => toggleRowSelection(row.original.id)}
                            aria-label={`Chọn hàng ${row.original.id}`}
                            disabled={isEditing}
                          />
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <input
                              type="datetime-local"
                              value={row.original.ngayXuat ? new Date(row.original.ngayXuat).toISOString().slice(0, 16) : ""}
                              onChange={(e) => handleCellEdit(row.original.id, "ngayXuat", e.target.value)}
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            formatDate(row.original.ngayXuat)
                          )}
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <>
                              <input
                                list={`phone-options-edit-${row.original.id}`}
                                value={row.original.sdt || ""}
                                onChange={(e) => handlePhoneSelect(row.original.id, { sdt: e.target.value })}
                                placeholder="Nhập số điện thoại"
                                style={{ width: "100%", padding: "4px" }}
                              />
                              <datalist id={`phone-options-edit-${row.original.id}`}>
                                {phoneOptions.map((option, idx) => (
                                  <option key={idx} value={option.sdt} />
                                ))}
                              </datalist>
                            </>
                          ) : (
                            row.original.sdt
                          )}
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <input
                              type="email"
                              value={row.original.mail || ""}
                              onChange={(e) => handleCellEdit(row.original.id, "mail", e.target.value)}
                              placeholder="Nhập email"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.mail
                          )}
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <input
                              type="text"
                              value={row.original.tenAG || ""}
                              onChange={(e) => handleCellEdit(row.original.id, "tenAG", e.target.value)}
                              placeholder="Nhập tên AG"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.tenAG
                          )}
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          <button
                            onClick={() => handleClickAddOnOpen(row.original.id)}
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
                              transition: "all 0.2s ease"
                            }}
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
                        </td>
                        
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <select
                              value={row.original.veHoanKhay || "Có"}
                              onChange={(e) => handleCellEdit(row.original.id, "veHoanKhay", e.target.value)}
                              style={{ width: "100%", padding: "4px" }}
                            >
                              <option value="Có">Có</option>
                              <option value="Không">Không</option>
                            </select>
                          ) : (
                            row.original.veHoanKhay
                          )}
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <>
                              <input
                                list={`card-options-edit-${row.original.id}`}
                                value={row.original.soThe || ""}
                                onChange={(e) => handleSoTheSelect(row.original.id, e.target.value)}
                                placeholder="Nhập số thẻ"
                                style={{ width: "100%", padding: "4px" }}
                              />
                              <datalist id={`card-options-edit-${row.original.id}`}>
                                {cardOptions.map((option, idx) => (
                                  <option key={idx} value={option.soThe} />
                                ))}
                              </datalist>
                            </>
                          ) : (
                            row.original.soThe
                          )}
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <input
                              type="text"
                              value={row.original.luuY || ""}
                              onChange={(e) => handleCellEdit(row.original.id, "luuY", e.target.value)}
                              placeholder="Nhập lưu ý"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.luuY
                          )}
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <input
                              type="text"
                              value={row.original.thuAG || ""}
                              onChange={(e) => handleCellEdit(row.original.id, "thuAG", e.target.value)}
                              placeholder="Nhập thu AG"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.thuAG
                          )}
                        </td>
                        <td style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            <input
                              type="text"
                              value={row.original.giaXuat || ""}
                              onChange={(e) => handleCellEdit(row.original.id, "giaXuat", e.target.value)}
                              placeholder="Nhập giá xuất"
                              style={{ width: "100%", padding: "4px" }}
                            />
                          ) : (
                            row.original.giaXuat
                          )}
                        </td>
                        {/* Các cột chi tiết vé trống */}
                        <td colSpan={8} style={{ border: "1px solid #bdbdbd", textAlign: "center" }}>
                          Không có chi tiết vé
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
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          paddingBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          🗑️ Xác nhận xóa
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-confirmation-dialog-description" style={{
            fontSize: "16px",
            color: "#64748b",
            lineHeight: "1.6"
          }}>
            Bạn có chắc chắn muốn xóa <strong>{selectedRows.length}</strong> hàng đã chọn? 
            <br />
            <span style={{ color: "#dc2626", fontWeight: "600" }}>
              ⚠️ Hành động này không thể hoàn tác.
            </span>
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ padding: "16px 24px 24px", gap: "12px" }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            style={{
              color: "#6b7280",
              backgroundColor: "#f3f4f6",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "none",
              border: "2px solid #e5e7eb"
            }}
          >
            ❌ Hủy
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            autoFocus
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
              border: "none"
            }}
          >
            🗑️ Xóa ngay
          </Button>
        </DialogActions>
      </Dialog>
      
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
            sx={{ 
              width: "100%",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)"
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default EditableTable;
