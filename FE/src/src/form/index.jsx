import React, { useState, useMemo } from 'react';
import { useTable, usePagination, useRowSelect } from 'react-table';
import '../style/index.css'
const data = [
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Trần Thị B', gioiTinh: 'Nữ', maDatCho: 'XYZ456', thuAG: 1500 },
  { tenKhachHang: 'Nguyễn Văn A', gioiTinh: 'Nam', maDatCho: 'ABC123', thuAG: 1000 },

];

const columns = [
  { Header: 'Tên khách hàng', accessor: 'tenKhachHang' },
  { Header: 'Giới tính', accessor: 'gioiTinh' },
  { Header: 'Mã đặt chỗ', accessor: 'maDatCho' },
  { Header: 'Thu AG', accessor: 'thuAG' },
];

const TicketTable = () => {
  const [filterText, setFilterText] = useState('');
  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.tenKhachHang.toLowerCase().includes(filterText.toLowerCase()) ||
      item.gioiTinh.toLowerCase().includes(filterText.toLowerCase()) ||
      item.maDatCho.toLowerCase().includes(filterText.toLowerCase()) ||
      item.thuAG.toString().includes(filterText)
    );
  }, [filterText]);

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
    gotoPage,
    setPageSize,
    state: { pageIndex, pageSize },
    selectedFlatRows,
    toggleRowSelected,
  } = useTable(
    { columns, data: filteredData, initialState: { pageIndex: 0 } },
    usePagination,
    useRowSelect,
    hooks => {
      hooks.visibleColumns.push(columns => [
        {
          id: 'selection',
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

  return (
    <div className="container">
      <h1>Hệ thống xuất vé</h1>

      {/* Form nhập liệu */}
      <div className="form-container">
        <div>
          <label>Ngày xuất:</label>
          <input type="text" value={new Date().toLocaleString()} disabled />
        </div>
        <div>
          <label>Liên hệ (SĐT):</label>
          <input type="text" />
        </div>
        <div>
          <label>Mail:</label>
          <input type="email" />
        </div>
        <div>
          <label>Tên AG:</label>
          <input type="text" />
        </div>
        <div>
          <label>Chặng bay đi:</label>
          <input type="text" value="CXR Sân bay Cam Ranh T2" disabled />
        </div>
        <div>
          <label>Ngày giờ bay đi:</label>
          <input type="datetime-local" />
        </div>
        <div>
          <label>Chặng bay đến:</label>
          <input type="text" value="CXR Sân bay Cam Ranh T2" disabled />
        </div>
        <div>
          <label>Ngày giờ bay đến:</label>
          <input type="datetime-local" />
        </div>
        <div>
          <label>Mã đặt chỗ hãng:</label>
          <input type="text" />
        </div>
        <div>
          <label>Tên khách hàng:</label>
          <input type="text" />
        </div>
        <div>
          <label>Giới tính:</label>
          <select>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
        <div>
          <label>Mã đặt chỗ trip:</label>
          <input type="text" />
        </div>
        <div>
          <label>Thu AG:</label>
          <input type="number" />
        </div>
        <div>
          <label>Giá xuất:</label>
          <input type="number" />
        </div>
        <div>
          <label>Số thẻ thanh toán:</label>
          <select>
            <option value="9012">9012</option>
            <option value="3456">3456</option>
          </select>
        </div>
        <div>
          <label>Tài khoản:</label>
          <textarea rows="3"></textarea>
        </div>
        <div>
          <label>Lưu ý:</label>
          <textarea rows="3"></textarea>
        </div>
        <div>
          <label>Vé hoàn khay:</label>
          <select>
            <option value="Có">Có</option>
            <option value="Không">Không</option>
          </select>
        </div>

        <div className="button-container">
          <button>Xuất Vé</button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <input
        type="text"
        placeholder="Tìm kiếm..."
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        style={{ marginBottom: '20px', padding: '10px', width: '300px' }}
      />
      <table {...getTableProps()} className="table-container">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
        <span style={{marginRight: "10px"}}>
          Trang {pageIndex + 1} của {pageOptions.length}
        </span>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30].map(size => (
            <option key={size} value={size}>
              Hiển thị {size}
            </option>
          ))}
        </select>
      </div>

      {/* Các hàng đã chọn */}
      <div style={{ marginTop: '20px' }}>
        <h4>Các hàng đã chọn:</h4>
        <ul>
          {selectedFlatRows.map(row => (
            <li key={row.original.maDatCho}>{row.original.tenKhachHang}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TicketTable;
