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
      />
    </div>
  );
};

export default TicketTable2;
