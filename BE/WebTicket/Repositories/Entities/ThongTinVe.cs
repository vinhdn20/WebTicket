using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class ThongTinVe : BaseEntity
    {
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
    }
}
