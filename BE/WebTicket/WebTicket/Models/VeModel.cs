using Repositories.Entities;

namespace WebTicket.Models
{
    public class AddVe
    {
        public Guid AGCustomerId { get; set; }
        public DateTime NgayXuat { get; set; }
        public string GiaXuat { get; set; }
        public string AddOn { get; set; }
        public string ThuAG { get; set; }
        public string LuuY { get; set; }
        public bool VeHoanKhay { get; set; }

        public Guid CardId { get; set; }
        public List<AddVeDetail> VeDetails { get; set; } = new List<AddVeDetail>();
    }

    public class UpdateVe
    {
        public Guid Id { get; set; }

        public DateTime NgayXuat { get; set; }
        public string GiaXuat { get; set; }
        public string AddOn { get; set; }
        public string ThuAG { get; set; }
        public string LuuY { get; set; }
        public bool VeHoanKhay { get; set; }

        public Guid CardId { get; set; }

        public List<AddVeDetail> VeDetails { get; set; } = new List<AddVeDetail>();
    }

    public class AgCustomerModel
    {
        public string TenAG { get; set; }
        public string Mail { get; set; }
        public string SDT { get; set; }
    }

    public class CardModel
    {
        public string SoThe { get; set; }
    }

    public class AddVeDetail
    {
        public string ChangBay { get; set; }
        public DateTime NgayGioBay { get; set; }
        public string HangBay { get; set; }
        public string SoHieuChuyenBay { get; set; }
        public string ThamChieuHang { get; set; }
        public string MaDatCho { get; set; }
        public string TenKhachHang { get; set; }
    } 
}
