using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class AGCustomer : BaseEntity
    {
        public string TenAG { get; set; }
        public string Mail { get; set; }
        public string SDT { get; set; }
    }
}
