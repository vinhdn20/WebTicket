using Common;
using Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class DbInitializer
    {
        public static async Task InitializeAsync(WebTicketDbContext context)
        {
            await context.Database.MigrateAsync();

            // Check if roles exist
            var rolesExist = await context.Roles.AnyAsync();

            Role adminRole;
            Role staffRole;

            if (!rolesExist)
            {
                // Create roles if they don't exist
                adminRole = new Role
            {
                Type = RoleType.Admin,
                Description = RoleType.Admin.GetDescription()
            };

                staffRole = new Role
                {
                    Type = RoleType.Staff,
                    Description = RoleType.Staff.GetDescription()
                };
                context.Roles.AddRange(adminRole, staffRole);
                await context.SaveChangesAsync(); // Save roles first to get their IDs
            }
            else
            {
                // Get existing roles
                adminRole = await context.Roles.FirstAsync(r => r.Type == RoleType.Admin);
                staffRole = await context.Roles.FirstAsync(r => r.Type == RoleType.Staff);
            }

            // Define all permissions that should exist
            var permissionsToEnsure = new List<Permission>()
            {
                // Manage permissions only
                new Permission
                {
                    Name = PermissionHelper.CommonPermissions.UsersManage,
                    Description = PermissionHelper.GetDisplayName(PermissionHelper.CommonPermissions.UsersManage),
                    Resource = Resources.Users,
                    Action = Actions.Manage
                },
                new Permission
                {
                    Name = PermissionHelper.CommonPermissions.PermissionsManage,
                    Description = PermissionHelper.GetDisplayName(PermissionHelper.CommonPermissions.PermissionsManage),
                    Resource = Resources.Permissions,
                    Action = Actions.Manage
                },
                new Permission
                {
                    Name = PermissionHelper.CommonPermissions.AGManage,
                    Description = PermissionHelper.GetDisplayName(PermissionHelper.CommonPermissions.AGManage),
                    Resource = Resources.AG,
                    Action = Actions.Manage
                },
                new Permission
                {
                    Name = PermissionHelper.CommonPermissions.MSTManage,
                    Description = PermissionHelper.GetDisplayName(PermissionHelper.CommonPermissions.MSTManage),
                    Resource = Resources.MST,
                    Action = Actions.Manage
                },
                new Permission
                {
                    Name = PermissionHelper.CommonPermissions.TripAccountManage,
                    Description = PermissionHelper.GetDisplayName(PermissionHelper.CommonPermissions.TripAccountManage),
                    Resource = Resources.TripAccount,
                    Action = Actions.Manage
                },
                new Permission
                {
                    Name = PermissionHelper.CommonPermissions.AgodaAccountManage,
                    Description = PermissionHelper.GetDisplayName(PermissionHelper.CommonPermissions.AgodaAccountManage),
                    Resource = Resources.AgodaAccount,
                    Action = Actions.Manage
                },
                new Permission
                {
                    Name = PermissionHelper.CommonPermissions.GmailAccountManage,
                    Description = PermissionHelper.GetDisplayName(PermissionHelper.CommonPermissions.GmailAccountManage),
                    Resource = Resources.GmailAccount,
                    Action = Actions.Manage
                }
            };

            // Check which permissions are missing and add them
            var existingPermissionNames = await context.Permissions
                .Select(p => p.Name)
                .ToListAsync();

            var newPermissions = permissionsToEnsure
                .Where(p => !existingPermissionNames.Contains(p.Name))
                .ToList();

            if (newPermissions.Any())
            {
                context.Permissions.AddRange(newPermissions);
                await context.SaveChangesAsync(); // Save new permissions
            }

            // Get all permissions (existing + new)
            var allPermissions = await context.Permissions.ToListAsync();

            // Assign all permissions to Admin role (only if not already assigned)
            var existingRolePermissions = await context.RolePermissions
                .Where(rp => rp.RoleId == adminRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var rolePermissions = allPermissions
                .Where(p => !existingRolePermissions.Contains(p.Id))
                .Select(permission =>
            {
                var rolePermission = new RolePermission
                {
                    RoleId = adminRole.Id,
                    PermissionId = permission.Id,
                    CreatedById = adminRole.Id,
                    ModifiedById = adminRole.Id,
                    CreatedTime = DateTime.UtcNow,
                    ModifiedTime = DateTime.UtcNow
                };
                return rolePermission;
            }).ToList();

            if (rolePermissions.Any())
            {
                context.RolePermissions.AddRange(rolePermissions);
            }

            // Create admin user only if it doesn't exist
            var adminUserExists = await context.Users.AnyAsync(u => u.Email == "admin@admin.com");
            if (!adminUserExists)
            {
                var adminUser = new Users
            {
                Email = "admin@admin.com",
                Password = BCrypt.Net.BCrypt.HashPassword("1qaz2wsxE"),
                RoleId = adminRole.Id,
                IsActive = true,
                CreatedById = adminRole.Id,
                    ModifiedById = adminRole.Id,
                    CreatedTime = DateTime.UtcNow,
                    ModifiedTime = DateTime.UtcNow
                };
                context.Users.AddRange(adminUser);
            }

            await context.SaveChangesAsync();
        }
    }
}
