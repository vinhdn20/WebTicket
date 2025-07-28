const API_BASE_URL = process.env.REACT_APP_API_URL;

const apiService = {
  fetchPhoneNumbers: async () => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE_URL}/Ve/ag`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch phone numbers.");
    }

    return response.json();
  },

  fetchCardNumbers: async () => {
    const accessToken = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE_URL}/Ve/card`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch card numbers.");
    }

    return response.json();
  },

};

export default apiService;
