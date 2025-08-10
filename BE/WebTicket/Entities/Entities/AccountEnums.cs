using System.ComponentModel;

namespace Entities
{
    public enum AccountStatus
    {
        [Description("Hoạt động")]
        Active = 1,

        [Description("Không hoạt động")]
        Inactive = 2,

        [Description("Lỗi")]
        Error = 3
    }

    public enum AccountType
    {
        [Description("Trip")]
        Trip = 1,

        [Description("Agoda")]
        Agoda = 2
    }
}