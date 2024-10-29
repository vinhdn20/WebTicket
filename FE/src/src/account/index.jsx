import React, { useState } from 'react';
import "../style/login.css"
import { useNavigate } from 'react-router-dom';
const AccountCreation = () => {
  const [role, setRole] = useState('employee');
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    navigate("/home")
    e.preventDefault();
    // Thực hiện tạo tài khoản tại đây
  };

  return (
    <form onSubmit={handleSubmit} className='container_login'>
      <h1>QUẢN LÝ BÁN VÉ</h1>
      <div className='container_line'>
        <label style={{marginRight: "5px"}}>Tài khoản:</label>
        <input type="text" name="username" required />
      </div>

      <div className='container_line'>
        <label style={{marginRight: "5px"}}>Mật khẩu:</label>
        <input style={{fontSize: "14px"}} type="password" name="password" required />
      </div>
      <button type="submit">Đăng Nhập</button>
    </form>
  );
};

export default AccountCreation;
