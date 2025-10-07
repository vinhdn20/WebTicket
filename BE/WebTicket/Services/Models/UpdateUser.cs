using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Models
{
    public class UpdateUser
    {
        [Required]
        public Guid UserId { get; set; }

        public string? Email { get; set; }
        public string? Username { get; set; }

        public string? Password { get; set; }
        
        public bool? IsActive { get; set; }
        
        public List<string>? PermissionNames { get; set; }
    }
}