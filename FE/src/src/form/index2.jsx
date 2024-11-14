import React, { useEffect, useState } from "react";
import "../style/table.css";
import InputForm from "./InputForm";
import DataTable from "./table";
import SearchComponent from "./search";

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
    maDatChoTrip: [""]
  }
};

const TicketTable2 = () => {
  const [data, setData] = useState([]);
  const [columnFilters, setColumnFilters] = useState(initTable);

  async function fetchInitialData(filters) {
    let accessToken = localStorage.getItem("accessToken");

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
          // Retry the original request with the new token
          accessToken = newToken;
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
          return processResult(retryResult);
        } else {
          throw new Error("Failed to refresh access token");
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch initial data: " + response.statusText);
      }

      const result = await response.json();
      return processResult(result);
      
    } catch (error) {
      console.error("Error fetching initial data:", error);
      return [];
    }
  }

  async function refreshAccessToken() {
    try {
      const refreshResponse = await fetch("https://localhost:44331/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh access token: " + refreshResponse.statusText);
      }

      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.accessToken;
      localStorage.setItem("accessToken", newAccessToken); // Save new token to localStorage
      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return null;
    }
  }

  function processResult(result) {
    return result.items.map((item) => ({
      ngayXuat: item.ngayXuat,
      changDi: item.changDi,
      ngayGioBayDi: item.ngayGioBayDi,
      changVe: item.changVe,
      ngayGioBayDen: item.ngayGioBayDen,
      maDatChoHang: item.maDatChoHang,
      addOn: item.addOn,
      maDatChoTrip: item.maDatChoTrip,
      thuAG: item.thuAG,
      giaXuat: item.giaXuat,
      luuY: item.luuY,
      veHoanKhay: item.veHoanKhay,
      tenAG: item.agCustomer?.tenAG || null,
      mail: item.agCustomer?.mail || null,
      sdt: item.agCustomer?.sdt || null,
      tenKhachHang: item.customer?.tenKhachHang || null,
      gioiTinh: item.customer?.gioiTinh || null,
      soThe: item.card?.soThe || null,
      taiKhoan: item.card?.taiKhoan || null,
    }));
  }

  // Load data when component mounts or columnFilters change
  useEffect(() => {
    const loadData = async () => {
      const initialData = await fetchInitialData(columnFilters);
      setData(initialData);
    };
    loadData();
  }, [columnFilters]);

  return (
    <div className="container">
      <InputForm />
      <SearchComponent setColumnFilters={setColumnFilters} />
      <DataTable data={data} />
    </div>
  );
};

export default TicketTable2;
