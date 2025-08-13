import { useCallback, useEffect, useState, useMemo } from "react";
import "../style/table.css";
import InputForm from "./InputForm";
import DataTable from "./table";
import SearchComponent from "./search";
import { processResult } from "../constant";
import { logout, fetchWithAuth } from "../services/authService";
import { debounce } from "lodash";
import { Snackbar, Alert, Button } from "@mui/material";
import ErrorBoundary from "../component/ErrorBoundary";
import PermissionsManagement from "../component/PermissionsManagement";

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
  const [showPermissions, setShowPermissions] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const openSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const fetchInitialData = useCallback(
    async (filters) => {
      try {
        const result = await fetchWithAuth(
          "/Ve/filter",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(filters),
          },
          openSnackbar
        );
        setPageCount(result.pageCount);
        return processResult(result);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        openSnackbar(
          "Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.",
          "error"
        );
        return [];
      }
    },
    [openSnackbar]
  );

  const debouncedLoad = useMemo(
    () =>
      debounce(async () => {
        const payload = {
          ...columnFilters,
          pageIndex,
          pageSize,
        };
        const initialData = await fetchInitialData(payload);
        setData(initialData);
      }, 500),
    [columnFilters, pageIndex, pageSize, fetchInitialData]
  );
  useEffect(() => {
    debouncedLoad();
    return () => {
      debouncedLoad.cancel();
    };
  }, [debouncedLoad]);

  const handleSaveEditedRows = useCallback(
    async (payload) => {
      try {
        await fetchWithAuth(
          "/Ve/xuatve",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
          openSnackbar
        );
        openSnackbar("Các hàng đã chỉnh sửa được lưu thành công!", "success");
        setSelectedRows([]);
        debouncedLoad();
      } catch (error) {
        console.error("Error saving edited rows:", error);
        openSnackbar("Có lỗi xảy ra khi lưu các hàng đã chỉnh sửa.", "error");
      }
    },
    [debouncedLoad, openSnackbar]
  );

  const handleDeleteSelectedRows = useCallback(async () => {
    const payload = selectedRows;
    if (payload.length === 0) {
      openSnackbar("Không có hàng nào được chọn để xóa.", "warning");
      return;
    }
    try {
      await fetchWithAuth(
        "/Ve/xuatve",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        openSnackbar
      );
      openSnackbar("Các hàng đã chọn được xóa thành công!", "success");
      setSelectedRows([]);
      debouncedLoad();
    } catch (error) {
      console.error("Error deleting rows:", error);
      openSnackbar("Có lỗi xảy ra khi xóa các hàng đã chọn.", "error");
    }
  }, [selectedRows, debouncedLoad, openSnackbar]);

  const handlePermissionsClick = () => {
    setShowPermissions(true);
  };

  const handleBackToMain = () => {
    setShowPermissions(false);
  };

  if (showPermissions) {
    return (
      <ErrorBoundary>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              backgroundColor: "white",
              borderRadius: "12px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBackToMain}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "none",
              }}
            >
              ← Quay lại
            </Button>
            <Button
              variant="contained"
              onClick={logout}
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.8)",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)",
                border: "none",
                transition: "all 0.2s ease",
              }}
            >
              🚪 Đăng xuất
            </Button>
          </div>
          <PermissionsManagement />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            backgroundColor: "white",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#1e293b",
              fontSize: "24px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                backgroundColor: "rgb(59, 130, 246)",
                color: "white",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              🎫
            </span>
            Hệ Thống Quản Lý Bán Vé
          </h1>
          <div>
            {window.Permissions.permissions?.find(
              (i) => i.name === "users.manage"
            ) && (
              <Button
                variant="contained"
                onClick={handlePermissionsClick}
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.8)",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textTransform: "none",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)",
                  border: "none",
                  transition: "all 0.2s ease",
                  marginRight: "12px",
                }}
              >
                ⚙️ Quản lý phân quyền
              </Button>
            )}

            <Button
              variant="contained"
              onClick={logout}
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.8)",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)",
                border: "none",
                transition: "all 0.2s ease",
              }}
            >
              🚪 Đăng xuất
            </Button>
          </div>
        </div>

        <InputForm onTicketCreated={debouncedLoad} />
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

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={closeSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ErrorBoundary>
  );
};

export default TicketTable2;
