using System.ComponentModel.DataAnnotations;

namespace Entities
{
    public class PlatformAccount : BaseEntity
    {
        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Name { get; set; }

        [MaxLength(255)]
        public string? AccountName { get; set; }

        [MaxLength(100)]
        public string? Medal { get; set; }

        [Required]
        public AccountStatus Status { get; set; }

        [MaxLength(20)]
        public string? RecoveryPhone { get; set; }

        [MaxLength(255)]
        public string? RecoveryEmail { get; set; }

        public AccountType Type { get; set; }
    }
}