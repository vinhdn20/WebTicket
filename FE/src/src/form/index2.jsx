import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import "../style/table.css";
import InputForm from "./InputForm";
import DataTable from "./table";
import SearchComponent from "./search";
import { processResult, refreshAccessToken } from "../constant";
import { debounce } from "lodash";
import { Snackbar, Alert } from "@mui/material";

const initTable = {
  pageIndex: 1,
  pageSize: 10,
  sortKey: "",
  isAscending: true,
  searchContent: "",
  filters: {
    sdt: [""],
    maDatChoHang: [""],
    tenKhachHang: [""],
    maDatChoTrip: [""],
  },
};

const TicketTable2 = () => {
  const [data, setData] = useState([]);
  const [columnFilters, setColumnFilters] = useState(initTable);
  const [pageSize, setPageSize] = useState(initTable.pageSize);
  const [pageIndex, setPageIndex] = useState(initTable.pageIndex);
  const [pageCount, setPageCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const debounceRef = useRef();

  // Hook để quản lý accessToken
  const getAccessToken = () => {
    return localStorage.getItem("accessToken");
  };

  // Hàm để mở snackbar
  const openSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Hàm để đóng snackbar
  const closeSnackbar = useCallback(() => {
    setSnackbar({ ...snackbar, open: false });
  }, [snackbar]);

  const fetchInitialData = useCallback(async (filters) => {
    let accessToken = getAccessToken();

    try {
      const response = await fetch("https://localhost:44331/ve/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(filters),
      });

      if (response.status === 401) {
        // Token expired or unauthorized, refresh the token
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          // Retry the original request with the new token
          const retryResponse = await fetch("https://localhost:44331/ve/filter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(filters),
          });

          if (!retryResponse.ok) {
            throw new Error("Failed to fetch data after refreshing token: " + retryResponse.statusText);
          }
          const retryResult = await retryResponse.json();
          setPageCount(retryResult.pageCount);
          return processResult(retryResult);
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch initial data: " + response.statusText);
      }

      const result = await response.json();
      setPageCount(result.pageCount);
      return processResult(result);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      openSnackbar("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.", "error");
      return [];
    }
  }, [openSnackbar]);

  const loadData = useMemo(() => {
    // Tạo debounced function
    const load = debounce(async () => {
      const payload = {
        ...columnFilters,
        pageIndex,
        pageSize,
      };
      const initialData = await fetchInitialData(payload);
      setData(initialData);
    }, 500);

    // Lưu vào ref để có thể hủy debounce khi component unmount
    debounceRef.current = load;

    return load;
  }, [columnFilters, pageIndex, pageSize, fetchInitialData]);

  useEffect(() => {
    loadData();

    // Cleanup function để hủy debounce khi component unmount
    return () => {
      if (debounceRef.current && debounceRef.current.cancel) {
        debounceRef.current.cancel();
      }
    };
  }, [loadData]);

  const handleSaveEditedRows = useCallback(async (payload) => {
    let accessToken = getAccessToken();
    try {
      const response = await fetch("https://localhost:44331/Ve/xuatve", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          // Retry the original request with the new token
          const retryResponse = await fetch("https://localhost:44331/Ve/xuatve", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (!retryResponse.ok) {
            throw new Error("Failed to update rows after refreshing token: " + retryResponse.statusText);
          }

          openSnackbar("Các hàng đã chỉnh sửa được lưu thành công!", "success");
          setSelectedRows([]);
          loadData();
          return;
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Failed to update rows: " + response.statusText);
      }

      openSnackbar("Các hàng đã chỉnh sửa được lưu thành công!", "success");
      setSelectedRows([]);
      loadData();
    } catch (error) {
      console.error("Error saving edited rows:", error);
      openSnackbar("Có lỗi xảy ra khi lưu các hàng đã chỉnh sửa.", "error");
    }
  }, [loadData, openSnackbar]);

  const handleDeleteSelectedRows = useCallback(async () => {
    const payload = selectedRows;
    if (payload.length === 0) {
      openSnackbar("Không có hàng nào được chọn để xóa.", "warning");
      return;
    }

    let accessToken = getAccessToken();

    try {
      const response = await fetch("https://localhost:44331/Ve/xuatve", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await refreshAccessToken();
        if (newToken) {
          accessToken = newToken;
          // Retry the original request with the new token
          const retryResponse = await fetch("https://localhost:44331/Ve/xuatve", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (!retryResponse.ok) {
            throw new Error("Failed to delete rows after refreshing token: " + retryResponse.statusText);
          }

          openSnackbar("Các hàng đã chọn được xóa thành công!", "success");
          setSelectedRows([]);
          loadData();
          return;
        } else {
          window.location.href = "/";
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Failed to delete rows: " + response.statusText);
      }

      openSnackbar("Các hàng đã chọn được xóa thành công!", "success");
      setSelectedRows([]);
      loadData();
    } catch (error) {
      console.error("Error deleting rows:", error);
      openSnackbar("Có lỗi xảy ra khi xóa các hàng đã chọn.", "error");
    }
  }, [selectedRows, loadData, openSnackbar]);

  return (
    <div className="container">
      <h1>Bảng Nhập Dữ Liệu</h1>
      <InputForm onTicketCreated={loadData} />
      <SearchComponent
        setColumnFilters={setColumnFilters}
        setPageIndex={setPageIndex}
      />
      <DataTable
        data={data}
        setData={setData}
        pageSize={pageSize}
        pageIndex={pageIndex}
        setPageSize={setPageSize}
        setPageIndex={setPageIndex}
        pageCount={pageCount}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        handleDeleteSelectedRows={handleDeleteSelectedRows}
        handleSaveEditedRows={handleSaveEditedRows}
      />
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default TicketTable2;
