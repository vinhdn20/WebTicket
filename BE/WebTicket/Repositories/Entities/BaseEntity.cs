using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class BaseEntity
    {
        public Guid Id { get; set; }
        public Guid CreatedById { get; set; }
        public Guid ModifiedById { get; set; }
        public long CreatedTime { get; set; }
        public long ModifiedTime { get; set; }
    }
}
