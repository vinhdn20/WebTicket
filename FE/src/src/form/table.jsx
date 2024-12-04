// src/form/EditableTable.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useTable, usePagination } from "react-table";
import "../style/table.css";
import { formatDate } from "../constant";
import { v4 as uuidv4 } from "uuid"; // Import uuid để tạo id duy nhất
import AddOnTable from "./addOnTable";
import PaginationControls from "./PaginationControls";
import ActionButtons from "./ActionButtons";
import apiService from "../services/apiSevrvice"; // Ensure correct path

const exportTableToExcel = (tableData, fileName = "table_data.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
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
  const [addOnMode, setAddOnMode] = useState("view"); // New state to track AddOnTable mode
  const [isLoadingPhones, setIsLoadingPhones] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Fetch phone and card numbers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingPhones(true);
        const phoneData = await apiService.fetchPhoneNumbers();
        setPhoneOptions(phoneData);
      } catch (error) {
        // Error handling is already done in apiService
      } finally {
        setIsLoadingPhones(false);
      }

      try {
        setIsLoadingCards(true);
        const cardData = await apiService.fetchCardNumbers();
        setCardOptions(cardData);
      } catch (error) {
        // Error handling is already done in apiService
      } finally {
        setIsLoadingCards(false);
      }
    };
    fetchData();
  }, []);

  const handlePhoneSelect = useCallback(
    (rowIndex, newValue) => {
      const selectedPhoneOption = phoneOptions.find(
        (option) => option.sdt === newValue.sdt
      );

      const updatedData = [...data];
      if (selectedPhoneOption) {
        updatedData[rowIndex] = {
          ...updatedData[rowIndex],
          sdt: selectedPhoneOption.sdt,
          tenAG: selectedPhoneOption.tenAG || "",
          mail: selectedPhoneOption.mail || "",
        };
      } else {
        updatedData[rowIndex] = {
          ...updatedData[rowIndex],
          sdt: newValue.sdt || "",
          tenAG: "",
          mail: "",
        };
      }

      setData(updatedData);
      setEditedRows((prev) => new Set(prev).add(data[rowIndex].id));
    },
    [data, phoneOptions, setData]
  );

  const handleSoTheSelect = useCallback(
    (rowIndex, value) => {
      const updatedData = [...data];
      updatedData[rowIndex].soThe = value;
      setData(updatedData);

      // Đánh dấu hàng đã chỉnh sửa
      setEditedRows((prev) => {
        const updated = new Set(prev);
        updated.add(data[rowIndex].id);
        return updated;
      });
    },
    [data, setData]
  );

  const handleClickAddOnOpen = useCallback(
    (index) => {
      setAddOnRow(index);
      // Determine mode based on isEditing and whether the row is selected
      const isRowSelected = selectedRows.includes(data[index].id);
      setAddOnMode(isEditing && isRowSelected ? "edit" : "view");
      setOpenAddOn(true);
    },
    [isEditing, selectedRows, data]
  );

  const columns = useMemo(
    () => [
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
    ],
    []
  );

  const memoizedData = useMemo(() => data, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    // Pagination properties
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize: setRTPageSize,
  } = useTable(
    {
      columns,
      data: memoizedData,
      initialState: { pageIndex: pageIndex - 1, pageSize },
      manualPagination: false,
      pageCount,
    },
    usePagination
  );

  const toggleRowSelection = useCallback(
    (id) => {
      setSelectedRows((prev) =>
        prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
      );
    },
    [setSelectedRows]
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedRows.length === data.length && data.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((row) => row.id));
    }
  }, [selectedRows, data, setSelectedRows]);

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

  const handlePageSizeChange = useCallback(
    (e) => {
      const newSize = Number(e.target.value);
      setPageSize(newSize);
      setPageIndex(1);
      setRTPageSize(newSize);
    },
    [setPageSize, setPageIndex, setRTPageSize]
  );

  const handlePreviousPage = useCallback(() => {
    if (pageIndex > 1) {
      setPageIndex(pageIndex - 1);
      previousPage();
    }
  }, [pageIndex, setPageIndex, previousPage]);

  const handleNextPage = useCallback(() => {
    if (pageIndex < pageCount) {
      setPageIndex(pageIndex + 1);
      nextPage();
    }
  }, [pageIndex, pageCount, setPageIndex, nextPage]);

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

  const handleDialogAddOnClose = useCallback(() => {
    setOpenAddOn(false);
  }, []);

  const handleSave = useCallback(
    (formData, rowIndex) => {
      const updatedData = [...data];
      const stringData = JSON.stringify(formData);
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        addOn: stringData,
      };
      setData(updatedData);
      // Optionally, mark row as edited
      setEditedRows((prev) => new Set(prev).add(updatedData[rowIndex].id));
    },
    [data, setData]
  );

  const memoizedInitialData = useMemo(() => {
    if (addOnRow !== null) {
      try {
        const parsedData = JSON.parse(
          data[addOnRow].addOn || '[{"stt": "", "dichVu": "", "soTien": ""}]'
        );
        return parsedData;
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return [{ stt: "", dichVu: "", soTien: "" }];
      }
    } else {
      return [{ stt: "", dichVu: "", soTien: "" }];
    }
  }, [addOnRow, data]);

  return (
    <>
      <div>
        {isLoadingPhones || isLoadingCards ? (
          <p style={{ textAlign: "center", margin: "20px" }}>Loading options...</p>
        ) : data.length === 0 ? (
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
                      <th style={{ width: "50px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          aria-label="Chọn tất cả hàng"
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
                            aria-label={`Chọn hàng ${row.index + 1}`}
                          />
                        </td>
                        {row.cells.map((cell) => (
                          <td {...cell.getCellProps()} key={cell.column.id}>
                            {cell.column.id === "addOn" ? (
                              <button
                                onClick={() =>
                                  handleClickAddOnOpen(row.index)
                                }
                                className="button-container"
                                style={{width: "100%"}}
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
                            ) : isEditing && selectedRows.includes(row.original.id) ? (
                              (() => {
                                switch (cell.column.id) {
                                  case "sdt":
                                    return (
                                      <>
                                        <input
                                          list={`phone-options-${row.index}`}
                                          value={cell.value || ""}
                                          onChange={(e) =>
                                            handlePhoneSelect(row.index, {
                                              sdt: e.target.value,
                                            })
                                          }
                                          placeholder="Nhập số điện thoại"
                                          className="input-field"
                                          aria-label="Nhập số điện thoại"
                                        />
                                        <datalist
                                          id={`phone-options-${row.index}`}
                                        >
                                          {phoneOptions.map((option, idx) => (
                                            <option
                                              key={idx}
                                              value={option.sdt}
                                            />
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
                                            handleSoTheSelect(
                                              row.index,
                                              e.target.value
                                            )
                                          }
                                          placeholder="Nhập số thẻ"
                                          className="input-field"
                                          aria-label="Nhập số thẻ"
                                        />
                                        <datalist id={`so-the-${row.index}`}>
                                          {cardOptions.map((option, idx) => (
                                            <option
                                              key={idx}
                                              value={option.soThe}
                                            />
                                          ))}
                                        </datalist>
                                      </>
                                    );
                                  case "gioiTinh":
                                    return (
                                      <select
                                        value={cell.value || "Nam"}
                                        onChange={(e) =>
                                          handleCellEdit(
                                            row.index,
                                            "gioiTinh",
                                            e.target.value
                                          )
                                        }
                                        className="input-field"
                                        aria-label="Chọn giới tính"
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
                                          handleCellEdit(
                                            row.index,
                                            "veHoanKhay",
                                            e.target.value
                                          )
                                        }
                                        className="input-field"
                                        aria-label="Chọn vé hoàn khay"
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
                                        aria-label={`Nhập ${cell.column.Header}`}
                                      />
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
                                        aria-label={`Nhập ${cell.column.Header}`}
                                      />
                                    );
                                }
                              })()
                            ) : (
                              <>
                                {(cell.column.id === "ngayXuat" ||
                                  cell.column.id === "ngayGioBayDi" ||
                                  cell.column.id === "ngayGioBayDen") ? (
                                  formatDate(cell.value)
                                ) : (
                                  cell.value
                                )}
                              </>
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
            <PaginationControls
              pageIndex={pageIndex}
              pageCount={pageCount}
              handlePreviousPage={handlePreviousPage}
              handleNextPage={handleNextPage}
              handlePageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
            />

            {/* Edit, Delete, and Export Buttons */}
            <ActionButtons
              isEditing={isEditing}
              toggleEditMode={toggleEditMode}
              selectedRowsCount={selectedRows.length}
              handleDeleteSelectedRows={handleDeleteSelectedRows}
              exportToExcel={exportTableToExcel}
            />
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
        mode={addOnMode} // Pass mode to AddOnTable
      />
    </>
  );
};

export default EditableTable;
