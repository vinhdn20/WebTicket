import React, { useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useTable, usePagination } from "react-table";
import "../style/table.css";

const exportTableToExcel = (tableData, fileName = "table_data.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(data, fileName);
};

const columnsConfig = [
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

const EditableTable = ({
  data,
  setData,
  pageSize,
  pageIndex,
  setPageSize,
  setPageIndex,
  pageCount,
}) => {
  const [isEditing, setIsEditing] = useState(false); // Chế độ chỉnh sửa

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, page } =
    useTable(
      {
        columns: columnsConfig,
        data,
        initialState: { pageIndex: pageIndex - 1, pageSize },
        manualPagination: true,
      },
      usePagination
    );

  const handleCellEdit = (rowIndex, columnId, value) => {
    const updatedData = [...data];
    updatedData[rowIndex][columnId] = value;
    setData(updatedData);
  };

  const handleAddRow = () => {
    const emptyRow = {};
    columnsConfig.forEach((col) => {
      emptyRow[col.accessor] = ""; // Giá trị trống cho mỗi ô
    });
    setData([...data, emptyRow]);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPageIndex(1);
  };

  const handlePreviousPage = () => {
    if (pageIndex > 1) {
      setPageIndex(pageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (pageIndex < pageCount) {
      setPageIndex(pageIndex + 1);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  console.log(data);

  return (
    <div>
      {data.length === 0 ? (
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
                    <tr {...row.getRowProps()} key={row.id}>
                      {row.cells.map((cell) => (
                        <td {...cell.getCellProps()} key={cell.column.id}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={cell.value || ""}
                              onChange={(e) =>
                                handleCellEdit(
                                  row.index,
                                  cell.column.id,
                                  e.target.value
                                )
                              }
                              style={{
                                border: "1px solid #ddd",
                                width: "100%",
                                background: "#f9f9f9",
                                outline: "none",
                                padding: "4px",
                              }}
                            />
                          ) : (
                            cell.render("Cell")
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={handlePreviousPage}
              disabled={pageIndex === 1}
              style={{
                cursor: pageIndex === 1 ? "not-allowed" : "pointer",
                marginRight: "10px",
              }}
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
            >
              Next
            </button>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{ marginLeft: "10px" }}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>

          {/* Add Row and Edit Buttons */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button onClick={handleAddRow} style={{ marginRight: "10px" }} disabled={!isEditing}>
              Add Row
            </button>
            <button onClick={toggleEditMode} style={{ marginRight: "10px" }}>
              {isEditing ? "Save" : "Edit"}
            </button>
          </div>

          {/* Export to Excel */}
          <button
            onClick={() => exportTableToExcel(data)}
            style={{
              marginTop: "20px",
              display: "block",
              margin: "0 auto",
            }}
          >
            Export to Excel
          </button>
        </>
      )}
    </div>
  );
};

export default EditableTable;
