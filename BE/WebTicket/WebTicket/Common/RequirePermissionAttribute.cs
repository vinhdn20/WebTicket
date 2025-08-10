using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Repositories.Interfaces;
using WebTicket.Common;
using Entities;

namespace WebTicket.Common
{
    public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
    {
        private readonly string _permission;

        public RequirePermissionAttribute(string permission)
        {
            _permission = permission;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            // Check if user is authenticated
            if (!context.HttpContext.User.Identity.IsAuthenticated)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Get user ID from claims
            var userId = context.HttpContext.GetUserId();
            if (userId == Guid.Empty)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Get repository from DI container
            var repository = context.HttpContext.RequestServices.GetRequiredService<IDBRepository>();

            // Check if user has the required permission
            var hasPermission = await CheckUserPermissionAsync(repository, userId, _permission);
            
            if (!hasPermission)
            {
                context.Result = new ForbidResult();
                return;
            }
        }

        private async Task<bool> CheckUserPermissionAsync(IDBRepository repository, Guid userId, string permissionName)
        {
            try
            {
                // Get user with role
                var user = await repository.GetAsync<Users>(u => u.Id == userId && u.IsActive);
                if (user == null)
                    return false;

                // Check role permissions
                var rolePermission = await repository.GetAsync<RolePermission>(
                    rp => rp.RoleId == user.RoleId && 
                          rp.Permission.Name == permissionName);

                if (rolePermission != null)
                    return true;

                // Check direct user permissions
                var userPermission = await repository.GetAsync<UserPermission>(
                    up => up.UserId == userId && 
                          up.Permission.Name == permissionName);

                return userPermission != null;
            }
            catch
            {
                return false;
            }
        }
    }
}