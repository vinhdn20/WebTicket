using Repositories.Entities;

namespace WebTicket.Models
{
    public class AddVe
    {
        public DateTime NgayXuat { get; set; }
        public string ChangDi { get; set; }
        public DateTime NgayGioBayDi { get; set; }
        public string ChangVe { get; set; }
        public DateTime NgayGioBayDen { get; set; }
        public string MaDatChoHang { get; set; }
        public string AddOn { get; set; }
        public string MaDatChoTrip { get; set; }
        public string ThuAG { get; set; }
        public string GiaXuat { get; set; }
        public string LuuY { get; set; }
        public string VeHoanKhay { get; set; }

        //public Guid AGCustomerId { get; set; }
        public AgCustomerModel AGCustomer { get; set; }

        //public Guid CustomerId { get; set; }
        public CustomerModel Customer { get; set; }

        //public Guid CardId { get; set; }
        public CardModel Card { get; set; }
        public string TaiKhoan { get; set; }
    }

    public class AgCustomerModel
    {
        public string TenAG { get; set; }
        public string Mail { get; set; }
        public string SDT { get; set; }
    }

    public class CustomerModel
    {
        public string TenKhachHang { get; set; }
        public string GioiTinh { get; set; }
    }

    public class CardModel
    {
        public string SoThe { get; set; }
    }
}
