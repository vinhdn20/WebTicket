import React, { useState } from 'react';
import "../style/login.css";
import { useNavigate } from 'react-router-dom';

const AccountCreation = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("https://localhost:7113/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        navigate("/home");
      } else {
        alert("Login failed. Please check your email and password.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className='container_login'>
      <h1>QUẢN LÝ BÁN VÉ</h1>
      <div className='container_line'>
        <label style={{ marginRight: "5px" }}>Email:</label>
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className='container_line'>
        <label style={{ marginRight: "5px" }}>Mật khẩu:</label>
        <input
          style={{ fontSize: "14px" }}
          type="password"
          name="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">Đăng Nhập</button>
    </form>
  );
};

export default AccountCreation;
