// EditableTable.js
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useTable, usePagination } from "react-table";
import "../style/table.css";
import { formatDate } from "../constant";
import { v4 as uuidv4 } from 'uuid'; // Import uuid để tạo id duy nhất

const exportTableToExcel = (tableData, fileName = "table_data.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(data, fileName);
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
  handleSaveEditedRows
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRows, setEditedRows] = useState(new Set());
  const [phoneOptions, setPhoneOptions] = useState([]);
  const [cardOptions, setCardOptions] = useState([]);

  // Hàm để fetch phone numbers (placeholder)
  const fetchPhoneNumbers = useCallback(async () => {
    // Thực hiện gọi API để lấy số điện thoại hoặc sử dụng dữ liệu giả lập
    // Ví dụ với dữ liệu giả lập:
    const fetchedPhoneOptions = [
      { sdt: "0123456789" },
      { sdt: "0987654321" },
      { sdt: "0912345678" },
    ];
    setPhoneOptions(fetchedPhoneOptions);
  }, []);

  // Hàm để fetch card numbers (placeholder)
  const fetchCardNumbers = useCallback(async () => {
    // Thực hiện gọi API để lấy số thẻ hoặc sử dụng dữ liệu giả lập
    const fetchedCardOptions = [
      { soThe: "1111222233334444" },
      { soThe: "5555666677778888" },
      { soThe: "9999000011112222" },
    ];
    setCardOptions(fetchedCardOptions);
  }, []);

  // Hàm xử lý chọn số điện thoại từ datalist
  const handlePhoneSelect = useCallback((rowIndex, value) => {
    const updatedData = [...data];
    updatedData[rowIndex].sdt = value;
    setData(updatedData);

    // Đánh dấu hàng đã chỉnh sửa
    setEditedRows((prev) => {
      const updated = new Set(prev);
      updated.add(data[rowIndex].id);
      return updated;
    });
  }, [data, setData]);

  // Hàm xử lý chọn số thẻ từ datalist
  const handleSoTheSelect = useCallback((rowIndex, value) => {
    const updatedData = [...data];
    updatedData[rowIndex].soThe = value;
    setData(updatedData);

    // Đánh dấu hàng đã chỉnh sửa
    setEditedRows((prev) => {
      const updated = new Set(prev);
      updated.add(data[rowIndex].id);
      return updated;
    });
  }, [data, setData]);

  // Hàm xử lý click vào button Add On (placeholder)
  const handleClickAddOnOpen = useCallback((rowIndex) => {
    // Thực hiện hành động khi nhấn nút Add On, ví dụ: mở modal
    alert(`Add On cho hàng ${rowIndex + 1}`);
  }, []);

  // Memo hóa columnsConfig để tránh tái tạo mỗi lần render
  const columns = useMemo(() => [
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
  ], []);

  // Memo hóa data để tránh tái tạo mỗi lần render
  const memoizedData = useMemo(() => data, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
  } = useTable(
    {
      columns,
      data: memoizedData,
      initialState: { pageIndex: pageIndex - 1, pageSize },
      manualPagination: false, // Đặt thành false nếu không xử lý phân trang thủ công từ server
      pageCount,
    },
    usePagination
  );

  // Toggle selection for a single row
  const toggleRowSelection = useCallback(
    (id) => {
      setSelectedRows((prev) =>
        prev.includes(id)
          ? prev.filter((rowId) => rowId !== id)
          : [...prev, id]
      );
    },
    [setSelectedRows]
  );

  // Toggle selection for all rows
  const toggleSelectAll = useCallback(() => {
    if (selectedRows.length === data.length && data.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((row) => row.id));
    }
  }, [selectedRows, data, setSelectedRows]);

  // Handle cell edit
  const handleCellEdit = useCallback(
    (rowIndex, columnId, value) => {
      setData((prevData) => {
        const updatedData = [...prevData];
        updatedData[rowIndex][columnId] = value;
        return updatedData;
      });

      setEditedRows((prev) => {
        const updated = new Set(prev);
        updated.add(data[rowIndex].id);
        return updated;
      });
    },
    [data, setData]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (e) => {
      setPageSize(Number(e.target.value));
      setPageIndex(1);
    },
    [setPageSize, setPageIndex]
  );

  // Handle previous page
  const handlePreviousPage = useCallback(() => {
    if (pageIndex > 1) {
      setPageIndex(pageIndex - 1);
    }
  }, [pageIndex, setPageIndex]);

  // Handle next page
  const handleNextPage = useCallback(() => {
    if (pageIndex < pageCount) {
      setPageIndex(pageIndex + 1);
    }
  }, [pageIndex, pageCount, setPageIndex]);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      const formattedTickets = Array.from(editedRows).map((id) => {
        const row = data.find((item) => item.id === id);
        return {
          id: row.id,
          ngayXuat: new Date(row.ngayXuat).toISOString(),
          changDi: row.changDi,
          ngayGioBayDi: row.ngayGioBayDi
            ? new Date(row.ngayGioBayDi).toISOString()
            : new Date().toISOString(),
          changVe: row.changVe,
          ngayGioBayDen: row.ngayGioBayDen
            ? new Date(row.ngayGioBayDen).toISOString()
            : new Date().toISOString(),
          maDatChoHang: row.maDatChoHang,
          addOn: row.addOn,
          maDatChoTrip: row.maDatChoTrip,
          thuAG: row.thuAG,
          giaXuat: row.giaXuat,
          luuY: row.luuY,
          veHoanKhay: row.veHoanKhay,
          agCustomer: {
            agCustomerId: row.agCustomerId,
            tenAG: row.tenAG,
            mail: row.mail,
            sdt: row.sdt,
          },
          customer: {
            customerId: row.customerId,
            tenKhachHang: row.tenKhachHang,
            gioiTinh: row.gioiTinh,
          },
          card: {
            cardId: row.cardId,
            soThe: row.soThe,
          },
          taiKhoan: row.taiKhoan,
        };
      });

      handleSaveEditedRows(formattedTickets);
      setEditedRows(new Set());
    }
    setIsEditing((prev) => !prev);
  }, [isEditing, editedRows, data, handleSaveEditedRows]);

  // Determine if all rows are selected
  const isAllSelected = useMemo(
    () => selectedRows.length === data.length && data.length > 0,
    [selectedRows, data]
  );

  // Fetch phone numbers and card numbers khi component mount
  useEffect(() => {
    fetchPhoneNumbers();
    fetchCardNumbers();
  }, [fetchPhoneNumbers, fetchCardNumbers]);

  // Kiểm tra dữ liệu đầu vào
  console.log("EditableTable Data:", data);

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
                  <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                    <th style={{ width: "50px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
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
                    <tr {...row.getRowProps()} key={row.original.id}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.original.id)}
                          onChange={() => toggleRowSelection(row.original.id)}
                        />
                      </td>
                      {row.cells.map((cell) => (
                        <td {...cell.getCellProps()} key={cell.column.id}>
                          {isEditing && selectedRows.includes(row.original.id) ? (
                            (() => {
                              switch (cell.column.id) {
                                case "sdt":
                                  return (
                                    <>
                                      <input
                                        list={`phone-options-${row.index}`}
                                        value={cell.value || ""}
                                        onChange={(e) =>
                                          handlePhoneSelect(row.index, e.target.value)
                                        }
                                        onFocus={fetchPhoneNumbers}
                                        placeholder="Nhập số điện thoại"
                                        className="input-field"
                                      />
                                      <datalist id={`phone-options-${row.index}`}>
                                        {phoneOptions.map((option, idx) => (
                                          <option key={idx} value={option.sdt} />
                                        ))}
                                      </datalist>
                                    </>
                                  );
                                case "soThe":
                                  return (
                                    <>
                                      <input
                                        list={`so-the-${row.index}`}
                                        value={cell.value || ""}
                                        onChange={(e) =>
                                          handleSoTheSelect(row.index, e.target.value)
                                        }
                                        onFocus={fetchCardNumbers}
                                        placeholder="Nhập số thẻ"
                                        className="input-field"
                                      />
                                      <datalist id={`so-the-${row.index}`}>
                                        {cardOptions.map((option, idx) => (
                                          <option key={idx} value={option.soThe} />
                                        ))}
                                      </datalist>
                                    </>
                                  );
                                case "gioiTinh":
                                  return (
                                    <select
                                      value={cell.value || "Nam"}
                                      onChange={(e) =>
                                        handleCellEdit(row.index, "gioiTinh", e.target.value)
                                      }
                                      className="input-field"
                                    >
                                      <option value="Nam">Nam</option>
                                      <option value="Nữ">Nữ</option>
                                    </select>
                                  );
                                case "veHoanKhay":
                                  return (
                                    <select
                                      value={cell.value || "Có"}
                                      onChange={(e) =>
                                        handleCellEdit(row.index, "veHoanKhay", e.target.value)
                                      }
                                      className="input-field"
                                    >
                                      <option value="Có">Có</option>
                                      <option value="Không">Không</option>
                                    </select>
                                  );
                                case "ngayGioBayDi":
                                case "ngayGioBayDen":
                                case "ngayXuat":
                                  return (
                                    <input
                                      type="datetime-local"
                                      value={
                                        cell.value
                                          ? cell.value.slice(0, 16)
                                          : ""
                                      }
                                      onChange={(e) =>
                                        handleCellEdit(
                                          row.index,
                                          cell.column.id,
                                          e.target.value
                                        )
                                      }
                                      className="input-field"
                                    />
                                  );
                                case "addOn":
                                  return (
                                    <button
                                      onClick={() => handleClickAddOnOpen(row.index)}
                                      className="button-container"
                                    >
                                      Nhập
                                    </button>
                                  );
                                default:
                                  return (
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
                                      className="input-field"
                                    />
                                  );
                              }
                            })()
                          ) : (
                            (cell.column.id === "ngayXuat" ||
                              cell.column.id === "ngayGioBayDi" ||
                              cell.column.id === "ngayGioBayDen") ?
                              formatDate(cell.value) :
                              cell.value
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
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

          {/* Edit, Delete, and Export Buttons */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={toggleEditMode}
              style={{
                marginRight: "10px",
                cursor: selectedRows.length === 0 ? "not-allowed" : "pointer",
              }}
              disabled={selectedRows.length === 0}
            >
              {isEditing ? "Save" : "Edit"}
            </button>
            <button
              onClick={handleDeleteSelectedRows}
              disabled={selectedRows.length === 0}
              style={{
                marginRight: "10px",
                cursor: selectedRows.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Delete Selected
            </button>
            <button
              onClick={() => exportTableToExcel(data)}
              style={{
                marginTop: "10px",
                display: "inline-block",
                padding: "8px 16px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Export to Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EditableTable;
