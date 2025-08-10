using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities
{
    public class Permission : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // Format: "resource.action"

        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string Resource { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty;
        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
        public virtual ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>(); 
    }

    public static class Resources
    {
        public const string Users = "users";
        //public const string Roles = "roles";
        public const string Permissions = "permissions";
        public const string AG = "ag";
        public const string MST = "masothe";
        public const string TripAccount = "tripaccount";
        public const string AgodaAccount = "agodaaccount";
    }

    public static class Actions
    {
        public const string Create = "create";
        public const string Read = "read";
        public const string Update = "update";
        public const string Delete = "delete";
        public const string Manage = "manage";
        public const string View = "view";
    }
}
