using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities
{
    public class UserPermission : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid PermissionId { get; set; }

        public virtual Users User { get; set; }
        public virtual Permission Permission { get; set; }

    }
}
