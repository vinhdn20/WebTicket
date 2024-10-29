using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class UserTokens : BaseEntity
    {
        public string RefreshToken { get; set; }
        public DateTime ExpiryDate { get; set; }
        public bool IsRevoked { get; set; }

        [ForeignKey(nameof(Users))]
        public Guid UserId { get; set; }
        public virtual Users Users { get; set; }
    }
}
