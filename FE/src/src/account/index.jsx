import React, { useState } from 'react';

const AccountCreation = () => {
  const [role, setRole] = useState('employee');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Thực hiện tạo tài khoản tại đây
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Tài khoản:</label>
        <input type="text" name="username" required />
      </div>

      <div>
        <label>Mật khẩu:</label>
        <input type="password" name="password" required />
      </div>

      <div>
        <label>Quyền:</label>
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="employee">Nhân viên</option>
        </select>
      </div>

      <button type="submit">Tạo tài khoản</button>
    </form>
  );
};

export default AccountCreation;
