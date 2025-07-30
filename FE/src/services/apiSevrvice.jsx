import { fetchWithAuth } from './authService';

const apiService = {
  fetchPhoneNumbers: async (openSnackbar) => {
    try {
      const data = await fetchWithAuth('/Ve/ag', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }, openSnackbar);
      
      return data;
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
      throw error;
    }
  },

  fetchCardNumbers: async (openSnackbar) => {
    try {
      const data = await fetchWithAuth('/Ve/card', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }, openSnackbar);
      
      return data;
    } catch (error) {
      console.error("Error fetching card numbers:", error);
      throw error;
    }
  },
};

export default apiService;
