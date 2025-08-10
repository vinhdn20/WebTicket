using System.ComponentModel;

namespace Entities
{
    public class Role : BaseEntity
    {
        public Guid Id { get; set; }
        public RoleType Type { get; set; }
        public string? Description { get; set; }


        public virtual ICollection<Users> Users { get; set; } = new List<Users>();
        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }

    public enum RoleType
    {
        [Description("Quản trị viên")]
        Admin = 1,

        [Description("Nhân viên")]
        Staff = 2,
    }
}
