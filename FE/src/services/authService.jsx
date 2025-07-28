// src/services/authService.js
import { refreshAccessToken } from "../constant";

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const fetchWithAuth = async (endpoint, options = {}, openSnackbar) => {
  let accessToken = localStorage.getItem("accessToken");

  const authHeaders = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: authHeaders,
    });

    if (response.status === 401) {
      // Cố gắng làm mới token
      const newToken = await refreshAccessToken();
      if (newToken) {
        accessToken = newToken;
        localStorage.setItem("accessToken", newToken); // Cập nhật token trong localStorage

        // Thử lại yêu cầu gốc với token mới
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            ...authHeaders,
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          window.location.href = "/";
          throw new Error("Unauthorized: Token refresh failed.");
        }
      } else {
        window.location.href = "/";
        throw new Error("Unauthorized: No token refresh available.");
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
    openSnackbar(
      "Có lỗi xảy ra khi thực hiện yêu cầu. Vui lòng thử lại.",
      "error"
    );
    throw error;
  }
};
