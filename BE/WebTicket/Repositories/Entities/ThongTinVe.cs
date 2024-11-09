using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class ThongTinVe : BaseEntity
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
        public string GiaXuat { get;set; }
        public string LuuY { get; set; }
        public string VeHoanKhay { get; set; }

        public Guid AGCustomerId { get; set; }
        public virtual AGCustomer AgCustomer { get; set; }

        public Guid CustomerId { get; set; }
        public virtual Customer Customer { get; set; }

        public Guid CardId { get; set; }
        public virtual Card Card { get; set; }
    }
}
