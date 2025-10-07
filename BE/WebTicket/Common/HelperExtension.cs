using Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Resources;
using System.Text;
using System.Threading.Tasks;

namespace Common
{
    public static class EnumExtensions
    {
        public static string GetDescription(this Enum value)
        {
            var field = value.GetType().GetField(value.ToString());
            var attribute = field?.GetCustomAttributes(typeof(DescriptionAttribute), false)
                                  .FirstOrDefault() as DescriptionAttribute;
            return attribute?.Description ?? value.ToString();
        }
    }

    public static class PermissionHelper
    {
        public static string CreatePermissionName(string resource, string action)
        {
            return $"{resource}.{action}";
        }

        public static (string resource, string action) ParsePermissionName(string permissionName)
        {
            var parts = permissionName.Split('.');
            return parts.Length == 2 ? (parts[0], parts[1]) : (string.Empty, string.Empty);
        }

        // Display names cho resources
        private static readonly Dictionary<string, string> ResourceDisplayNames = new()
        {
            { Resources.Users, "Người dùng" },
            //{ Resources.Roles, "Vai trò" },
            { Resources.Permissions, "Quyền hạn" },
            { Resources.AG, "AG" },
            { Resources.MST, "Mã số thẻ" },
            { Resources.TripAccount, "Tài khoản Trip" },
            { Resources.AgodaAccount, "Tài khoản Agoda" },
            { Resources.GmailAccount, "Gmail" }
        };

        // Display names cho actions
        private static readonly Dictionary<string, string> ActionDisplayNames = new()
        {
            { Actions.Create, "Tạo mới" },
            { Actions.Read, "Xem" },
            { Actions.Update, "Cập nhật" },
            { Actions.Delete, "Xóa" },
            { Actions.Manage, "Quản lý" },
            { Actions.View, "Xem" },
        };

        // Dictionary cho display names - sử dụng constants thay vì hardcode
        private static readonly Dictionary<string, string> PermissionDisplayNames = new()
        {
            // Management permissions only
            { CreatePermissionName(Resources.Users, Actions.Manage), "Quản lý người dùng" },
            { CreatePermissionName(Resources.Permissions, Actions.Manage), "Quản lý quyền hạn" },
            { CreatePermissionName(Resources.AG, Actions.Manage), "Quản lý AG" },
            { CreatePermissionName(Resources.MST, Actions.Manage), "Quản lý mã số thẻ" },
            { CreatePermissionName(Resources.TripAccount, Actions.Manage), "Quản lý tài khoản Trip" },
            { CreatePermissionName(Resources.AgodaAccount, Actions.Manage), "Quản lý tài khoản Agoda" },
            { CreatePermissionName(Resources.GmailAccount, Actions.Manage), "Quản lý Gmail" },
        };

        // Lấy display name từ permission name
        public static string GetDisplayName(string permissionName)
        {
            if (PermissionDisplayNames.TryGetValue(permissionName, out var displayName))
                return displayName;

            // Fallback: Tạo display name từ resource.action
            var (resource, action) = ParsePermissionName(permissionName);
            return $"{GetResourceDisplayName(resource)} - {GetActionDisplayName(action)}";
        }

        public static string GetResourceDisplayName(string resource)
        {
            return ResourceDisplayNames.TryGetValue(resource, out var displayName) ? displayName : resource;
        }

        public static string GetActionDisplayName(string action)
        {
            return ActionDisplayNames.TryGetValue(action, out var displayName) ? displayName : action;
        }

        // Lấy tất cả permissions group theo resource
        public static Dictionary<string, List<string>> GetPermissionsByResource()
        {
            return PermissionDisplayNames.Keys
                .GroupBy(p => ParsePermissionName(p).resource)
                .ToDictionary(
                    g => GetResourceDisplayName(g.Key),
                    g => g.Select(GetDisplayName).ToList()
                );
        }

        // Helper methods để tạo permissions một cách type-safe
        public static class CommonPermissions
        {
            // User permissions
            public const string UsersManage = Resources.Users + "." + Actions.Manage;

            // Role permissions
            //public const string RolesManage = Resources.Roles + "." + Actions.Manage;
            public const string PermissionsManage = Resources.Permissions + "." + Actions.Manage;

            // AG permissions
            public const string AGManage = Resources.AG + "." + Actions.Manage;

            // MST permissions
            public const string MSTManage = Resources.MST + "." + Actions.Manage;

            // TripAccount permissions
            public const string TripAccountManage = Resources.TripAccount + "." + Actions.Manage;

            // AgodaAccount permissions
            public const string AgodaAccountManage = Resources.AgodaAccount + "." + Actions.Manage;

            // GmailAccount permissions
            public const string GmailAccountManage = Resources.GmailAccount + "." + Actions.Manage;

        }
    }
}
