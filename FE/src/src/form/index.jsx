import React, { useState, useMemo } from 'react';
import { useTable, usePagination, useRowSelect } from 'react-table';
import '../style/table.css';

const initialData = [
  {
    ngayXuat: new Date().toLocaleString(),
    lienHe: '0987654321',
    mail: 'example@mail.com',
    tenAG: 'Agent A',
    changBayDi: 'CXR Sân bay Cam Ranh T2 - TAS Sân bay quốc tế T2',
    ngayGioBayDi: '2023-12-25T15:30',
    changBayDen: 'CXR Sân bay Cam Ranh T2 - TAS Sân bay quốc tế T2',
    ngayGioBayDen: '2023-12-25T17:30',
    maDatChoHang: 'ABC123',
    tenKhachHang: 'Nguyễn Văn A',
    gioiTinh: 'Nam',
    addOn: 'Wifi, Extra luggage',
    maDatChoTrip: 'TRIP123',
    thuAG: 1000,
    giaXuat: 2000,
    soTheThanhToan: '9012',
    taiKhoan: 'Ngân hàng X',
    luuY: 'Nên check-in sớm 1 giờ',
    veHoanKhay: 'Có',
  },
  // 10 dữ liệu mẫu khác
  ...Array(10).fill().map((_, index) => ({
    ngayXuat: new Date().toLocaleString(),
    lienHe: `098765432${index}`,
    mail: `example${index}@mail.com`,
    tenAG: `Agent ${String.fromCharCode(65 + index)}`,
    changBayDi: 'SGN Sân bay Tân Sơn Nhất - HAN Sân bay Nội Bài',
    ngayGioBayDi: `2023-12-2${5 + index}T10:00`,
    changBayDen: 'HAN Sân bay Nội Bài - SGN Sân bay Tân Sơn Nhất',
    ngayGioBayDen: `2023-12-2${5 + index}T12:00`,
    maDatChoHang: `ABC12${index}`,
    tenKhachHang: `Nguyễn Văn ${String.fromCharCode(66 + index)}`,
    gioiTinh: index % 2 === 0 ? 'Nam' : 'Nữ',
    addOn: index % 2 === 0 ? 'Wifi, Extra luggage' : 'Extra meal',
    maDatChoTrip: `TRIP12${index}`,
    thuAG: 1000 + index * 100,
    giaXuat: 2000 + index * 200,
    soTheThanhToan: `901${index}`,
    taiKhoan: `Ngân hàng ${String.fromCharCode(88 + index)}`,
    luuY: index % 2 === 0 ? 'Nên check-in sớm 1 giờ' : 'Mang theo hộ chiếu',
    veHoanKhay: index % 2 === 0 ? 'Có' : 'Không',
  })),
];

const columns = [
  { Header: 'Ngày xuất', accessor: 'ngayXuat' },
  { Header: 'Liên hệ (SĐT)', accessor: 'lienHe' },
  { Header: 'Mail', accessor: 'mail' },
  { Header: 'Tên AG', accessor: 'tenAG' },
  { Header: 'Chặng bay đi', accessor: 'changBayDi' },
  { Header: 'Ngày giờ bay đi', accessor: 'ngayGioBayDi' },
  { Header: 'Chặng bay đến', accessor: 'changBayDen' },
  { Header: 'Ngày giờ bay đến', accessor: 'ngayGioBayDen' },
  { Header: 'Mã đặt chỗ hãng', accessor: 'maDatChoHang' },
  { Header: 'Tên khách hàng', accessor: 'tenKhachHang' },
  { Header: 'Giới tính', accessor: 'gioiTinh' },
  { Header: 'Add on', accessor: 'addOn' },
  { Header: 'Mã đặt chỗ trip', accessor: 'maDatChoTrip' },
  { Header: 'Thu AG', accessor: 'thuAG' },
  { Header: 'Giá xuất', accessor: 'giaXuat' },
  { Header: 'Số thẻ thanh toán', accessor: 'soTheThanhToan' },
  { Header: 'Tài khoản', accessor: 'taiKhoan' },
  { Header: 'Lưu ý', accessor: 'luuY' },
  { Header: 'Vé hoàn khay', accessor: 'veHoanKhay' },
];

const TicketTable = () => {
  const [filterText, setFilterText] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [data, setData] = useState(initialData);

  const filteredData = useMemo(() => {
    return data.filter(item =>
      Object.entries(columnFilters).every(([key, value]) =>
        value ? item[key].toString().toLowerCase().includes(value.toLowerCase()) : true
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

  const handleAddTicket = () => {
    const newTicket = {
      ngayXuat: new Date().toLocaleString(),
      lienHe: document.querySelector('[name="lienHe"]').value || null,
      mail: document.querySelector('[name="mail"]').value || null,
      tenAG: document.querySelector('[name="tenAG"]').value || null,
      changBayDi: document.querySelector('[name="changBayDi"]').value || null,
      ngayGioBayDi: document.querySelector('[name="ngayGioBayDi"]').value || null,
      changBayDen: document.querySelector('[name="changBayDen"]').value || null,
      ngayGioBayDen: document.querySelector('[name="ngayGioBayDen"]').value || null,
      maDatChoHang: document.querySelector('[name="maDatChoHang"]').value || null,
      tenKhachHang: document.querySelector('[name="tenKhachHang"]').value || null,
      gioiTinh: document.querySelector('[name="gioiTinh"]').value || null,
      addOn: document.querySelector('[name="addOn"]').value || null,
      maDatChoTrip: document.querySelector('[name="maDatChoTrip"]').value || null,
      thuAG: document.querySelector('[name="thuAG"]').value || null,
      giaXuat: document.querySelector('[name="giaXuat"]').value || null,
      soTheThanhToan: document.querySelector('[name="soTheThanhToan"]').value || null,
      taiKhoan: document.querySelector('[name="taiKhoan"]').value || null,
      luuY: document.querySelector('[name="luuY"]').value || null,
      veHoanKhay: document.querySelector('[name="veHoanKhay"]').value || null,
    };
    setData(prevData => [...prevData, newTicket]);
  };

  const handleFilterChange = (columnId, value) => {
    setColumnFilters(prevFilters => ({
      ...prevFilters,
      [columnId]: value,
    }));
  };
  const handleSearchByName = async () => {
    try {
      // Placeholder for API call to search for data based on filters
      console.log(columnFilters)
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(columnFilters),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="container">
      <h1>Hệ thống xuất vé</h1>
      <hr width="30%" align="center" style={{ marginBottom: "25px" }} />
      {/* Form nhập liệu */}
      <div className='tittle'>
        <h3>Nhập Liệu</h3>
      </div>
      <div className="form-container">
        <div>
          <label>Ngày xuất:</label>
          <input type="text" value={new Date().toLocaleString()} disabled />
        </div>
        <div>
          <label>Liên hệ (SĐT):</label>
          <input type="text" name="lienHe" />
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
          <input type="text" name="changBayDi" defaultValue="CXR Sân bay Cam Ranh T2 - TAS Sân bay quốc tế T2" disabled />
        </div>
        <div>
          <label>Ngày giờ bay đi:</label>
          <input type="datetime-local" name="ngayGioBayDi" />
        </div>
        <div>
          <label>Chặng bay đến:</label>
          <input type="text" name="changBayDen" defaultValue="CXR Sân bay Cam Ranh T2 - TAS Sân bay quốc tế T2" disabled />
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
          <select name="soTheThanhToan">
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
          <label>Vé hoàn khay:</label>
          <select name="veHoanKhay">
            <option value="Có">Có</option>
            <option value="Không">Không</option>
          </select>
        </div>
      </div>
      <div className="button-container">
        <button onClick={handleAddTicket}>Xuất Vé</button>
      </div>
      <hr width="30%" align="center" style={{ marginBottom: "25px", marginTop: "25px" }} />
      {/* Bảng dữ liệu */}
      <div className='tittle'>
        <h3>Tìm Kiếm</h3>
      </div>
      <div className="search-container" style={{ marginBottom: '20px' }}>
        {columns.map(column => (
          <div key={column.accessor} className="filter-input-wrapper" style={{ marginBottom: '10px' }}>
            <label className="filter-label" style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>{column.Header}:</label>
            {['gioiTinh', 'veHoanKhay'].includes(column.accessor) ? (
              <select
                value={columnFilters[column.accessor] || ''}
                onChange={e => handleFilterChange(column.accessor, e.target.value)}
                className="filter-select"
                style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Tất cả</option>
                {column.accessor === 'gioiTinh' && (
                  <>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </>
                )}
                {column.accessor === 'veHoanKhay' && (
                  <>
                    <option value="Có">Có</option>
                    <option value="Không">Không</option>
                  </>
                )}
              </select>
            ) : column.accessor === 'mail' ? (
              <input
                type="email"
                value={columnFilters[column.accessor] || ''}
                onChange={e => handleFilterChange(column.accessor, e.target.value)}
                className="filter-input"
                style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            ) : column.accessor === 'ngayGioBayDi' || column.accessor === 'ngayGioBayDen' ? (
              <input
                type="datetime-local"
                value={columnFilters[column.accessor] || ''}
                onChange={e => handleFilterChange(column.accessor, e.target.value)}
                className="filter-input"
                style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            ) : column.accessor === 'ngayXuat' ? (
              <input
                type="datetime-local"
                value={columnFilters[column.accessor] || ''}
                onChange={e => handleFilterChange(column.accessor, e.target.value)}
                className="filter-input"
                style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            ) : (
              <input
                type="text"
                value={columnFilters[column.accessor] || ''}
                onChange={e => handleFilterChange(column.accessor, e.target.value)}
                className="filter-input"
                style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="button-container">
        <button onClick={handleSearchByName}>Tìm kiếm</button>
      </div>

      <hr width="30%" align="center" style={{ marginBottom: "25px", marginTop: "25px" }} />
      <div className='tittle'>
        <h3>Bảng Dữ Liệu</h3>
      </div>
      <div className='table-wrapper'>
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
      </div>

      {/* Pagination */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
        <span style={{ marginRight: '10px' }}>
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
        <h3>Các hàng đã chọn:</h3>
        <ul>
          {selectedFlatRows.map(row => (
            <li key={row.original.maDatChoHang}>{row.original.tenKhachHang}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TicketTable;
