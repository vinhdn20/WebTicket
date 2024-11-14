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
    const accessToken = localStorage.getItem("accessToken");
    console.log(accessToken);
    try {
      const response = await fetch("https://localhost:44331/ve/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch initial data: " + response.statusText);
      }

      const result = await response.json();
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
    } catch (error) {
      console.error("Error fetching initial data:", error);
      return [];
    }
  }

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
      <hr width="30%" align="center" style={{ marginBottom: "25px", marginTop: "25px" }} />
      <SearchComponent setColumnFilters={setColumnFilters} />
      <hr width="30%" align="center" style={{ marginBottom: "25px", marginTop: "25px" }} />
      <DataTable data={data} />
    </div>
  );
};

export default TicketTable2;
