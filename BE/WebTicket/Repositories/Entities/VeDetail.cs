using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class VeDetail : BaseEntity
    {
        public Guid AGCustomerId { get; set; }
        public virtual AGCustomer AGCustomer { get; set; }
        public string ChangBay { get; set; }
        public DateTime NgayGioBay { get; set; }
        public string HangBay { get; set; }
        public string SoHieuChuyenBay { get; set; }
        public string ThamChieuHang { get; set; }
        public string MaDatCho { get; set; }
        public string TenKhachHang { get; set; }
        //public Guid CustomerId { get; set; }
        //public virtual Customer Customer { get; set; }
        public Guid ThongTinVeId { get; set; }
        public virtual ThongTinVe ThongTinVe { get; set; }
    }
}
