// src/services/authService.js
import { refreshAccessToken } from "../constant";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Function để logout và xóa tokens
export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/";
};

// Function để check xem user có đăng nhập không
export const isAuthenticated = () => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  return !!(accessToken && refreshToken);
};

export const fetchWithAuth = async (endpoint, options = {}, openSnackbar) => {
  let accessToken = localStorage.getItem("accessToken");
  
  if (!isAuthenticated()) {
    logout();
    return;
  }

  const authHeaders = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: authHeaders,
    });

    // Nếu access token hết hạn (401)
    if (response.status === 401) {
      console.log("Access token expired, attempting to refresh...");
      
      // Cố gắng làm mới token
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        console.log("Token refreshed successfully");
        accessToken = newToken;

        // Thử lại yêu cầu gốc với token mới
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Nếu vẫn còn lỗi 401 sau khi refresh
        if (response.status === 401) {
          console.log("Still unauthorized after token refresh");
          logout();
          throw new Error("Unauthorized: Token refresh failed.");
        }
      } else {
        console.log("Token refresh failed");
        logout();
        throw new Error("Unauthorized: Token refresh failed.");
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`Error in fetchWithAuth for ${endpoint}:`, error);
    
    // Nếu có lỗi network hoặc lỗi khác, hiển thị thông báo
    if (openSnackbar && typeof openSnackbar === 'function') {
      openSnackbar(
        "Có lỗi xảy ra khi thực hiện yêu cầu. Vui lòng thử lại.",
        "error"
      );
    }
    
    throw error;
  }
};
