import React, { useState, useMemo, useEffect } from "react";
import { useTable, usePagination, useRowSelect } from "react-table";
import "../style/table.css";

// Function to fetch initial data
async function fetchInitialData() {
  try {
    const response = await fetch("https://localhost:7113/Ve/bangVe");

    if (!response.ok) {
      throw new Error("Failed to fetch initial data: " + response.statusText);
    }

    const result = await response.json();
    return result.map((item) => ({
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

const columns = [
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
];

const TicketTable = () => {
  const [data, setData] = useState([]);
  const [columnFilters, setColumnFilters] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const initialData = await fetchInitialData();
      setData(initialData);
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.entries(columnFilters).every(([key, value]) =>
        value
          ? item[key].toString().toLowerCase().includes(value.toLowerCase())
          : true
      )
    );
  }, [columnFilters, data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
    selectedFlatRows,
  } = useTable(
    { columns, data: filteredData, initialState: { pageIndex: 0 } },
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        {
          id: "selection",
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <input type="checkbox" {...getToggleAllRowsSelectedProps()} />
          ),
          Cell: ({ row }) => (
            <input type="checkbox" {...row.getToggleRowSelectedProps()} />
          ),
        },
        ...columns,
      ]);
    }
  );

  async function callCreateTicketAPI(ticketData) {
    console.log(ticketData);
    try {
      const response = await fetch("https://localhost:7113/Ve/xuatVe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      const result = await response.json();
      alert("Vé đã tạo thành công cho khách có sđt: " + result.agCustomer.sdt);
      return result;
    } catch (error) {
      console.error("Error creating ticket:", error);
      throw error;
    }
  }

  const handleAddTicket = async () => {
    const newTicket = {
      ngayXuat: new Date().toISOString(),
      sdt: document.querySelector('[name="sdt"]').value || "",
      mail: document.querySelector('[name="mail"]').value || "",
      tenAG: document.querySelector('[name="tenAG"]').value || "",
      changDi: document.querySelector('[name="changDi"]').value || "",
      ngayGioBayDi:
        document.querySelector('[name="ngayGioBayDi"]').value ||
        new Date().toISOString(),
      changVe: document.querySelector('[name="changVe"]').value || "",
      ngayGioBayDen:
        document.querySelector('[name="ngayGioBayDen"]').value ||
        new Date().toISOString(),
      maDatChoHang: document.querySelector('[name="maDatChoHang"]').value || "",
      tenKhachHang: document.querySelector('[name="tenKhachHang"]').value || "",
      gioiTinh: document.querySelector('[name="gioiTinh"]').value || "",
      addOn: document.querySelector('[name="addOn"]').value || "",
      maDatChoTrip: document.querySelector('[name="maDatChoTrip"]').value || "",
      thuAG: document.querySelector('[name="thuAG"]').value || "",
      giaXuat: document.querySelector('[name="giaXuat"]').value || "",
      soThe: document.querySelector('[name="soThe"]').value || "",
      taiKhoan: document.querySelector('[name="taiKhoan"]').value || "",
      luuY: document.querySelector('[name="luuY"]').value || "",
      veHoanKhay: document.querySelector('[name="veHoanKhay"]').value || "",
    };

    const formattedTicket = {
      ngayXuat: newTicket.ngayXuat,
      changDi: newTicket.changDi,
      ngayGioBayDi: new Date(newTicket.ngayGioBayDi).toISOString(),
      changVe: newTicket.changVe,
      ngayGioBayDen: new Date(newTicket.ngayGioBayDen).toISOString(),
      maDatChoHang: newTicket.maDatChoHang,
      addOn: newTicket.addOn,
      maDatChoTrip: newTicket.maDatChoTrip,
      thuAG: newTicket.thuAG,
      giaXuat: newTicket.giaXuat,
      luuY: newTicket.luuY,
      veHoanKhay: newTicket.veHoanKhay,
      agCustomer: {
        tenAG: newTicket.tenAG,
        mail: newTicket.mail,
        sdt: newTicket.sdt,
      },
      customer: {
        tenKhachHang: newTicket.tenKhachHang,
        gioiTinh: newTicket.gioiTinh,
      },
      card: {
        soThe: newTicket.soThe,
        taiKhoan: newTicket.taiKhoan,
      },
    };

    try {
      const createdTicket = await callCreateTicketAPI(formattedTicket);
      setData((prevData) => [
        ...prevData,
        {
          ...createdTicket,
          ngayXuat: createdTicket.ngayXuat,
          changDi: createdTicket.changDi,
          ngayGioBayDi: new Date(createdTicket.ngayGioBayDi).toISOString(),
          changVe: createdTicket.changVe,
          ngayGioBayDen: new Date(createdTicket.ngayGioBayDen).toISOString(),
          maDatChoHang: createdTicket.maDatChoHang,
          addOn: createdTicket.addOn,
          maDatChoTrip: createdTicket.maDatChoTrip,
          thuAG: createdTicket.thuAG,
          giaXuat: createdTicket.giaXuat,
          luuY: createdTicket.luuY,
          veHoanKhay: createdTicket.veHoanKhay,
          tenAG: createdTicket.agCustomer.tenAG,
          mail: createdTicket.agCustomer.mail,
          sdt: createdTicket.agCustomer.sdt,
          tenKhachHang: createdTicket.customer?.tenKhachHang,
          gioiTinh: createdTicket.customer?.gioiTinh,
          soThe: createdTicket.card?.soThe,
          taiKhoan: createdTicket.card?.taiKhoan,
        },
      ]); // Re-render the table with new data
    } catch (error) {
      console.error("Error adding ticket:", error);
    }
  };

  const handleFilterChange = (columnId, value) => {
    setColumnFilters((prevFilters) => ({
      ...prevFilters,
      [columnId]: value,
    }));
  };

  const handleSearchByName = () => {
    setColumnFilters((prevFilters) => ({ ...prevFilters }));
  };
  // const handleSearchByName = async () => {
  //   try {
  //     // Placeholder for API call to search for data based on filters
  //     console.log(columnFilters);
  //     const response = await fetch("/api/search", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(columnFilters),
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch data");
  //     }

  //     const result = await response.json();
  //     setData(result);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };

  console.log(data);

  return (
    <div className="container">
      <h1>Hệ thống xuất vé</h1>
      <hr width="30%" align="center" style={{ marginBottom: "25px" }} />
      {/* Form nhập liệu */}
      <div className="tittle">
        <h3>Nhập Liệu</h3>
      </div>
      <div className="form-container">
        <div>
          <label>Ngày xuất:</label>
          <input type="text" value={new Date().toLocaleString()} disabled />
        </div>
        <div>
          <label>Liên hệ (SĐT):</label>
          <input type="text" name="sdt" />
        </div>
        <div>
          <label>Mail:</label>
          <input type="email" name="mail" />
        </div>
        <div>
          <label>Tên AG:</label>
          <input type="text" name="tenAG" />
        </div>
        <div>
          <label>Chặng bay đi:</label>
          <input
            type="text"
            name="changDi"
            defaultValue="CXR Sân bay Cam Ranh T2 - TAS Sân bay quốc tế T2"
          />
        </div>
        <div>
          <label>Ngày giờ bay đi:</label>
          <input type="datetime-local" name="ngayGioBayDi" />
        </div>
        <div>
          <label>Chặng bay đến:</label>
          <input
            type="text"
            name="changVe"
            defaultValue="CXR Sân bay Cam Ranh T2 - TAS Sân bay quốc tế T2"
            disabled
          />
        </div>
        <div>
          <label>Ngày giờ bay đến:</label>
          <input type="datetime-local" name="ngayGioBayDen" />
        </div>
        <div>
          <label>Mã đặt chỗ hãng:</label>
          <input type="text" name="maDatChoHang" />
        </div>
        <div>
          <label>Tên khách hàng:</label>
          <input type="text" name="tenKhachHang" />
        </div>
        <div>
          <label>Giới tính:</label>
          <select name="gioiTinh">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
        <div>
          <label>Add on:</label>
          <input type="text" name="addOn" />
        </div>
        <div>
          <label>Mã đặt chỗ trip:</label>
          <input type="text" name="maDatChoTrip" />
        </div>
        <div>
          <label>Thu AG:</label>
          <input type="number" name="thuAG" />
        </div>
        <div>
          <label>Giá xuất:</label>
          <input type="number" name="giaXuat" />
        </div>
        <div>
          <label>Số thẻ thanh toán:</label>
          <select name="soThe">
            <option value="9012">9012</option>
            <option value="3456">3456</option>
          </select>
        </div>
        <div>
          <label>Tài khoản:</label>
          <textarea rows="3" name="taiKhoan"></textarea>
        </div>
        <div>
          <label>Lưu ý:</label>
          <textarea rows="3" name="luuY"></textarea>
        </div>
        <div>
          <label>Vé có hoàn hay không:</label>
          <select name="veHoanKhay">
            <option value="Có">Có</option>
            <option value="Không">Không</option>
          </select>
        </div>
      </div>
      <div className="button-container">
        <button onClick={handleAddTicket}>Xuất Vé</button>
      </div>
      <hr
        width="30%"
        align="center"
        style={{ marginBottom: "25px", marginTop: "25px" }}
      />
      {/* Bảng dữ liệu */}
      <div className="tittle">
        <h3>Tìm Kiếm</h3>
      </div>
      <div className="search-container" style={{ marginBottom: "20px" }}>
        {columns.map((column) => (
          <div
            key={column.accessor}
            className="filter-input-wrapper"
            style={{ marginBottom: "10px" }}
          >
            <label
              className="filter-label"
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "5px",
              }}
            >
              {column.Header}:
            </label>
            {["gioiTinh", "veHoanKhay"].includes(column.accessor) ? (
              <select
                value={columnFilters[column.accessor] || ""}
                onChange={(e) =>
                  handleFilterChange(column.accessor, e.target.value)
                }
                className="filter-select"
                style={{
                  padding: "8px",
                  width: "100%",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Tất cả</option>
                {column.accessor === "gioiTinh" && (
                  <>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </>
                )}
                {column.accessor === "veHoanKhay" && (
                  <>
                    <option value="Có">Có</option>
                    <option value="Không">Không</option>
                  </>
                )}
              </select>
            ) : column.accessor === "mail" ? (
              <input
                type="email"
                value={columnFilters[column.accessor] || ""}
                onChange={(e) =>
                  handleFilterChange(column.accessor, e.target.value)
                }
                className="filter-input"
                style={{
                  padding: "8px",
                  width: "100%",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            ) : column.accessor === "ngayGioBayDi" ||
              column.accessor === "ngayGioBayDen" ? (
              <input
                type="datetime-local"
                value={columnFilters[column.accessor] || ""}
                onChange={(e) =>
                  handleFilterChange(column.accessor, e.target.value)
                }
                className="filter-input"
                style={{
                  padding: "8px",
                  width: "100%",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            ) : column.accessor === "ngayXuat" ? (
              <input
                type="datetime-local"
                value={columnFilters[column.accessor] || ""}
                onChange={(e) =>
                  handleFilterChange(column.accessor, e.target.value)
                }
                className="filter-input"
                style={{
                  padding: "8px",
                  width: "100%",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            ) : (
              <input
                type="text"
                value={columnFilters[column.accessor] || ""}
                onChange={(e) =>
                  handleFilterChange(column.accessor, e.target.value)
                }
                className="filter-input"
                style={{
                  padding: "8px",
                  width: "100%",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="button-container">
        <button onClick={handleSearchByName}>Tìm kiếm</button>
      </div>

      <hr
        width="30%"
        align="center"
        style={{ marginBottom: "25px", marginTop: "25px" }}
      />
      <div className="tittle">
        <h3>Bảng Dữ Liệu</h3>
      </div>
      <div className="table-wrapper">
        <table {...getTableProps()} className="table-container">
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>
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
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
        <span style={{ marginRight: "10px" }}>
          Trang {pageIndex + 1} của {pageOptions.length}
        </span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30].map((size) => (
            <option key={size} value={size}>
              Hiển thị {size}
            </option>
          ))}
        </select>
      </div>

      {/* Các hàng đã chọn */}
      <div style={{ marginTop: "20px" }}>
        <h3>Các hàng đã chọn:</h3>
        <ul>
          {selectedFlatRows.map((row) => (
            <li key={row.original.maDatChoHang}>{row.original.tenKhachHang}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TicketTable;
