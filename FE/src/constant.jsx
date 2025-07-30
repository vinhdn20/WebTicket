const API_URL = process.env.REACT_APP_API_URL;

export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (!refreshToken) {
      console.log("No refresh token found");
      return null;
    }

    const refreshResponse = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${refreshToken}`
      },
      credentials: "include",
    });

    if (!refreshResponse.ok) {
      // Refresh token hết hạn hoặc không hợp lệ
      console.log("Refresh token expired or invalid");
      // Xóa tokens cũ và chuyển về trang đăng nhập
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/";
      return null;
    }

    const refreshData = await refreshResponse.json();
    
    // Lưu cả access token và refresh token mới
    localStorage.setItem("accessToken", refreshData.accessToken);
    localStorage.setItem("refreshToken", refreshData.refreshToken);
    
    return refreshData.accessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    // Xóa tokens cũ và chuyển về trang đăng nhập
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
    return null;
  }
}

export function processResult(result) {
  return result.items.map((item) => ({
    id: item.id,
    cardId: item.cardId,
    agCustomerId: item.agCustomerId || item.agId,
    customerId: item.customerId,
    ngayXuat: item.ngayXuat,
    giaXuat: item.giaXuat,
    addOn: item.addOn,
    thuAG: item.thuAG,
    luuY: item.luuY,
    veHoanKhay: item.veHoanKhay,
    tenAG: item.agCustomer?.tenAG || null,
    mail: item.agCustomer?.mail || null,
    sdt: item.agCustomer?.sdt || null,
    soThe: item.card?.soThe || null,
    taiKhoan: item.taiKhoan || null,
    // Lấy veDetail nếu có, nếu không thì mảng rỗng
    veDetail: Array.isArray(item.veDetail)
      ? item.veDetail.map((v) => ({
          changBay: v.changBay,
          ngayGioBay: v.ngayGioBay,
          hangBay: v.hangBay,
          soHieuChuyenBay: v.soHieuChuyenBay,
          thamChieuHang: v.thamChieuHang,
          maDatCho: v.maDatCho,
          tenKhachHang: v.tenKhachHang,
          id: v.id,
        }))
      : [],
  }));
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-based
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export const formatNumberWithCommas = (num) => {
  if (!num) return "";
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
