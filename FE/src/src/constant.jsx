export async function refreshAccessToken() {
    try {
        const refreshResponse = await fetch("https://localhost:7113/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
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
    return result.items.map((item) => ({
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