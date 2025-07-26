export async function refreshAccessToken() {
    try {
        const refreshResponse = await fetch("https://localhost:44331/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include',
        });

        if (!refreshResponse.ok) {
            throw new Error("Failed to refresh access token: " + refreshResponse.statusText);
        }

        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.accessToken;
        localStorage.setItem("accessToken", newAccessToken); // Save new token to localStorage
        return newAccessToken;
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return null;
    }
}

export function processResult(result) {
    console.log(result, "result");
    return result.items.map((item) => ({
        id: item.id,
        cardId: item.cardId,
        agCustomerId: item.agId,
        customerId: item.customerId,
        ngayXuat: item.ngayXuat,
        changDi: item.changDi,
        ngayGioBayDi: item.ngayGioBayDi,
        changVe: item.changVe,
        ngayGioBayDen: item.ngayGioBayDen,
        maDatChoHang: item.maDatChoHang,
        addOn: item.addOn,
        maDatChoTrip: item.maDatChoTrip,
        thuAG: item.thuAG,
        giaXuat: item.giaXuat,
        luuY: item.luuY,
        veHoanKhay: item.veHoanKhay,
        tenAG: item.agCustomer?.tenAG || null,
        mail: item.agCustomer?.mail || null,
        sdt: item.agCustomer?.sdt || null,
        tenKhachHang: item.customer?.tenKhachHang || null,
        gioiTinh: item.customer?.gioiTinh || null,
        soThe: item.card?.soThe || null,
        taiKhoan: item.taiKhoan || null,
    }));
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatNumberWithCommas = (num) => {
    if (!num) return '';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};