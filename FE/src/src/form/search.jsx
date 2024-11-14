import React, { useState } from "react";
import "../style/table.css";

const columnSearch = [
    { Header: "Liên hệ (SĐT)", accessor: "sdt" },
    { Header: "Mã đặt chỗ hãng", accessor: "maDatChoHang" },
    { Header: "Tên khách hàng", accessor: "tenKhachHang" },
    { Header: "Mã đặt chỗ trip", accessor: "maDatChoTrip" },
];

const SearchComponent = ({ setColumnFilters }) => {
    const [filters, setFilters] = useState({
        sdt: "",
        maDatChoHang: "",
        tenKhachHang: "",
        maDatChoTrip: "",
    });

    const handleFilterChange = (accessor, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [accessor]: value,
        }));
    };

    const handleSearch = () => {
        const formattedFilters = {
          sdt: [filters.sdt],
          maDatChoHang: [filters.maDatChoHang],
          tenKhachHang: [filters.tenKhachHang],
          maDatChoTrip: [filters.maDatChoTrip],
        };
    
        setColumnFilters((prev) => ({
          ...prev,
          filters: formattedFilters,
          pageIndex: 1, // Reset to the first page for new search
        }));
      };

    return (
        <div className="container">
            <div className="tittle">
                <h3>Tìm Kiếm</h3>
            </div>
            <div className="search-container" style={{ marginBottom: "20px" }}>
                {columnSearch.map((column) => (
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
                        <input
                            type="text"
                            value={filters[column.accessor]}
                            onChange={(e) => handleFilterChange(column.accessor, e.target.value)}
                            className="filter-input"
                            style={{
                                padding: "8px",
                                width: "100%",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                            }}
                        />
                    </div>
                ))}
            </div>
            <div className="button-container">
                <button onClick={handleSearch}>Tìm kiếm</button>
            </div>
        </div>
    );
};

export default SearchComponent;
