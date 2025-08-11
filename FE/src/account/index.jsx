import React, { useState, useEffect } from 'react';
import "../style/login.css";
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

const formWrapperStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)",
};

const formStyle = {
  background: "#fff",
  padding: "36px 32px 28px 32px",
  borderRadius: "18px",
  boxShadow: "0 8px 32px rgba(59,130,246,0.10)",
  minWidth: "340px",
  maxWidth: "95vw",
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const titleStyle = {
  textAlign: "center",
  fontWeight: 800,
  fontSize: "1.6rem",
  color: "#1e293b",
  marginBottom: "10px",
  letterSpacing: "1px",
};

const labelStyle = {
  fontWeight: 600,
  color: "#334155",
  marginBottom: "6px",
  display: "block",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1.5px solid #cbd5e1",
  fontSize: "15px",
  outline: "none",
  marginBottom: "8px",
  background: "#f1f5f9",
  transition: "border 0.2s",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "rgb(34,197,94)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "8px",
  transition: "background 0.2s",
};

const buttonSecondaryStyle = {
  ...buttonStyle,
  background: "#f1f5f9",
  color: "#2563eb",
  border: "1.5px solid #cbd5e1",
  marginTop: "0",
};

const switchTextStyle = {
  textAlign: "center",
  marginTop: "10px",
  color: "#64748b",
  fontSize: "14px",
};

const AccountCreation = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchAndStorePermissions = React.useCallback(async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;
      const resp = await fetch(`${API_URL}/User/my-permissions`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!resp.ok) throw new Error("Failed to fetch permissions");
      const perms = await resp.json();
      window.Permissions = perms;
    } catch (err) {
      console.warn("Fetch permissions failed:", err);
      window.Permissions = [];
    }
  }, [API_URL]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchAndStorePermissions().finally(() =>
        navigate("/home", { replace: true })
      );
    }
  }, [navigate, fetchAndStorePermissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/User/login`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        await fetchAndStorePermissions();

        navigate("/home");
      } else {
        alert("Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/User/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerEmail, password: registerPassword }),
      });
      if (response.ok) {
        alert("Tạo tài khoản thành công! Bạn có thể đăng nhập.");
        setShowRegister(false);
        setRegisterEmail('');
        setRegisterPassword('');
      } else {
        alert("Tạo tài khoản thất bại. Email có thể đã tồn tại.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo tài khoản.");
    }
  };

  return (
    <div style={formWrapperStyle}>
      {showRegister ? (
        <form onSubmit={handleRegister} style={formStyle}>
          <div style={titleStyle}>ĐĂNG KÝ TÀI KHOẢN</div>
          <div>
            <label style={labelStyle}>Email:</label>
            <input
              type="email"
              required
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              style={inputStyle}
              placeholder="Nhập email"
            />
          </div>
          <div>
            <label style={labelStyle}>Mật khẩu:</label>
            <input
              type="password"
              required
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              style={inputStyle}
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button type="submit" style={buttonStyle}>Tạo tài khoản</button>
          <button
            type="button"
            style={buttonSecondaryStyle}
            onClick={() => setShowRegister(false)}
          >
            Quay lại đăng nhập
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={titleStyle}>QUẢN LÝ BÁN VÉ</div>
          <div>
            <label style={labelStyle}>Email:</label>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="Nhập email"
            />
          </div>
          <div>
            <label style={labelStyle}>Mật khẩu:</label>
            <input
              type="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button type="submit" style={buttonStyle}>Đăng Nhập</button>
          <div style={switchTextStyle}>
            Chưa có tài khoản?{" "}
            <span
              style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
              onClick={() => setShowRegister(true)}
            >
              Đăng ký ngay
            </span>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountCreation;
