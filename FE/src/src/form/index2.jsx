import React, { useEffect, useState } from "react";
import "../style/table.css";
import InputForm from "./InputForm";
import DataTable from "./table";
import SearchComponent from "./search";
import { processResult, refreshAccessToken } from "../constant";

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
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);

  async function fetchInitialData(filters) {
    let accessToken = localStorage.getItem("accessToken");

    try {
      const response = await fetch("https://localhost:7113/ve/filter", {
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
          const retryResponse = await fetch(
            "https://localhost:7113/ve/filter",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(filters),
            }
          );

          if (!retryResponse.ok) {
            throw new Error(
              "Failed to fetch data after refreshing token: " +
                retryResponse.statusText
            );
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
      setPageCount(result.pageCount);
      return processResult(result);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      return [];
    }
  }

  const handleSaveEditedRows = async () => {
    const payload = data.filter((row) => selectedRows.includes(row.id));
    console.log(payload);
    let accessToken = localStorage.getItem("accessToken");
  
    try {
      const response = await fetch("https://localhost:7113/Ve/xuatve", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update rows: " + response.statusText);
      }
  
      alert("Edited rows saved successfully!");
      setSelectedRows([]); 
      loadData();
    } catch (error) {
      console.error("Error saving edited rows:", error);
    }
  };
  

  const handleDeleteSelectedRows = async () => {
    console.log(selectedRows);
    const payload = selectedRows;
    let accessToken = localStorage.getItem("accessToken");

    try {
      const response = await fetch("https://localhost:7113/Ve/xuatve", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to delete rows: " + response.statusText);
      }

      alert("Selected rows deleted successfully!");
      setSelectedRows([]); // Clear selected rows
      loadData(); // Reload data to refresh the table
    } catch (error) {
      console.error("Error deleting rows:", error);
    }
  };

  const loadData = async () => {
    const payload = {
      ...columnFilters,
      pageIndex,
      pageSize,
    };
    const initialData = await fetchInitialData(payload);
    setData(initialData);
  };

  useEffect(() => {
    console.log(pageIndex);
    loadData();
  }, [pageSize, pageIndex, columnFilters]);

  return (
    <div className="container">
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
    </div>
  );
};

export default TicketTable2;
