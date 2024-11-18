import React, { useState, useMemo, useEffect } from "react";
import { useTable, usePagination, useRowSelect } from "react-table";
import "../style/table.css";

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

const DataTable = ({ data, pageSize, pageIndex, setPageSize, setPageIndex }) => {
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
        state,
    } = useTable(
        {
            columns,
            data,
            initialState: { pageIndex: pageIndex - 1, pageSize }, // Sync with parent state
            manualPagination: true, // Prevent React Table from handling pagination
        },
        usePagination
    );

    // Handle page size change
    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPageIndex(1); // Reset to first page when page size changes
    };

    // Handle page navigation
    const handlePreviousPage = () => {
        if (pageIndex > 1) {
          setPageIndex(pageIndex - 1);
        }
      };

      const handleNextPage = () => {
        if (pageIndex < pageOptions.length) {
          setPageIndex(pageIndex + 1);
        }
      };

    return (
        <div>
            <div className="table-wrapper">
                <table {...getTableProps()} className="table-container">
                    <thead>
                        {headerGroups.map((headerGroup) => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map((column) => (
                                    <th {...column.getHeaderProps()}>{column.render("Header")}</th>
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
                <button onClick={handlePreviousPage} disabled={!canPreviousPage}>
                    Previous
                </button>
                <button onClick={handleNextPage} disabled={!canNextPage}>
                    Next
                </button>
                <span style={{ marginRight: "10px" }}>
                    Page {pageIndex} of {pageOptions.length || 1}
                </span>
                <select value={pageSize} onChange={handlePageSizeChange}>
                    {[10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>
                            Show {size}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DataTable;


