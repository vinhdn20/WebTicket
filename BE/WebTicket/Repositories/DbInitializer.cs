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
            if (await context.Roles.AnyAsync())
            {
                return;
            }

            var adminRole = new Role
            {
                Type = RoleType.Admin,
                Description = RoleType.Admin.GetDescription()
            };

            var staffRole = new Role
            {
                Type = RoleType.Staff,
                Description = RoleType.Staff.GetDescription()
            };
            context.Roles.AddRange(adminRole, staffRole);
            await context.SaveChangesAsync(); // Save roles first to get their IDs

            var permissions = new List<Permission>()
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
                }
            };
            
            context.Permissions.AddRange(permissions);
            await context.SaveChangesAsync(); // Save permissions first to get their IDs

            // Assign all permissions to Admin role
            var rolePermissions = permissions.Select(permission =>
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

            context.RolePermissions.AddRange(rolePermissions);

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
            
            await context.SaveChangesAsync();
        }
    }
}
