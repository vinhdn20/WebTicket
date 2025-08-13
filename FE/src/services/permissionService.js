import { isAuthenticated } from './authService';

const API_URL = process.env.REACT_APP_API_URL;

export const fetchAndStorePermissions = async () => {
  try {
    if (!isAuthenticated()) {
      window.Permissions = [];
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      window.Permissions = [];
      return;
    }

    const response = await fetch(`${API_URL}/User/my-permissions`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch permissions");
    }

    const permissions = await response.json();
    window.Permissions = permissions;
  } catch (error) {
    console.warn("Fetch permissions failed:", error);
    window.Permissions = [];
  }
};

// Auto-fetch permissions on service load (page reload)
if (typeof window !== 'undefined') {
  fetchAndStorePermissions();
}
