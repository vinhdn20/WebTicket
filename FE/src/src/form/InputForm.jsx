import React, { useState } from "react";
import "../style/table.css";

const InputForm = () => {
  // Form state management
  const [data, setData] = useState({
    sdt: "",
    mail: "",
    tenAG: "",
    changDi: "CXR Sân bay Cam Ranh T2 - TAS Sân bay quốc tế T2",
    ngayGioBayDi: "",
    changVe: "CXR Sân bay Cam Ranh T2 - TAS Sân bay quốc tế T2",
    ngayGioBayDen: "",
    maDatChoHang: "",
    tenKhachHang: "",
    gioiTinh: "Nam",
    addOn: "",
    maDatChoTrip: "",
    thuAG: "",
    giaXuat: "",
    soThe: "",
    taiKhoan: "",
    luuY: "",
    veHoanKhay: "Có",
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  async function callCreateTicketAPI(ticketData) {
    try {
      const response = await fetch("https://localhost:44331/Ve/xuatVe", {
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

  // Handle form submission
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

  return (
    <div className="container">
      <h1>Hệ thống xuất vé</h1>
      <hr width="30%" align="center" style={{ marginBottom: "25px" }} />
      <div className="tittle">
        <h3>Nhập Liệu</h3>
      </div>
      <form className="form-container" onSubmit={handleAddTicket}>
        <div>
          <label>Ngày xuất:</label>
          <input type="text" value={new Date().toLocaleString()} disabled />
        </div>
        <div>
          <label>Liên hệ (SĐT):</label>
          <input type="text" name="sdt" value={data.sdt} onChange={handleInputChange} />
        </div>
        <div>
          <label>Mail:</label>
          <input type="email" name="mail" value={data.mail} onChange={handleInputChange} />
        </div>
        <div>
          <label>Tên AG:</label>
          <input type="text" name="tenAG" value={data.tenAG} onChange={handleInputChange} />
        </div>
        <div>
          <label>Chặng bay đi:</label>
          <input type="text" name="changDi" value={data.changDi} onChange={handleInputChange} />
        </div>
        <div>
          <label>Ngày giờ bay đi:</label>
          <input type="datetime-local" name="ngayGioBayDi" value={data.ngayGioBayDi} onChange={handleInputChange} />
        </div>
        <div>
          <label>Chặng bay đến:</label>
          <input type="text" name="changVe" value={data.changVe} onChange={handleInputChange} />
        </div>
        <div>
          <label>Ngày giờ bay đến:</label>
          <input type="datetime-local" name="ngayGioBayDen" value={data.ngayGioBayDen} onChange={handleInputChange} />
        </div>
        <div>
          <label>Mã đặt chỗ hãng:</label>
          <input type="text" name="maDatChoHang" value={data.maDatChoHang} onChange={handleInputChange} />
        </div>
        <div>
          <label>Tên khách hàng:</label>
          <input type="text" name="tenKhachHang" value={data.tenKhachHang} onChange={handleInputChange} />
        </div>
        <div>
          <label>Giới tính:</label>
          <select name="gioiTinh" value={data.gioiTinh} onChange={handleInputChange}>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
        <div>
          <label>Add on:</label>
          <input type="text" name="addOn" value={data.addOn} onChange={handleInputChange} />
        </div>
        <div>
          <label>Mã đặt chỗ trip:</label>
          <input type="text" name="maDatChoTrip" value={data.maDatChoTrip} onChange={handleInputChange} />
        </div>
        <div>
          <label>Thu AG:</label>
          <input type="number" name="thuAG" value={data.thuAG} onChange={handleInputChange} />
        </div>
        <div>
          <label>Giá xuất:</label>
          <input type="number" name="giaXuat" value={data.giaXuat} onChange={handleInputChange} />
        </div>
        <div>
          <label>Số thẻ thanh toán:</label>
          <textarea rows="1" name="soThe" value={data.soThe} onChange={handleInputChange}></textarea>
        </div>
        <div>
          <label>Tài khoản:</label>
          <textarea rows="3" name="taiKhoan" value={data.taiKhoan} onChange={handleInputChange}></textarea>
        </div>
        <div>
          <label>Lưu ý:</label>
          <textarea rows="3" name="luuY" value={data.luuY} onChange={handleInputChange}></textarea>
        </div>
        <div>
          <label>Vé có hoàn hay không:</label>
          <select name="veHoanKhay" value={data.veHoanKhay} onChange={handleInputChange}>
            <option value="Có">Có</option>
            <option value="Không">Không</option>
          </select>
        </div>
        <div className="button-container">
          <button type="submit">Xuất Vé</button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;
