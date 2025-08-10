using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Entities;
using Repositories.Interfaces;
using Common;
using WebTicket.Common;
using Microsoft.EntityFrameworkCore;

namespace WebTicket.Controllers
{
    public class PermissionController : APIBaseController
    {
        public PermissionController(IHttpContextAccessor accessor, IDBRepository repository) 
            : base(accessor, repository)
        {
        }

        [HttpGet("list")]
        [RequirePermission(PermissionHelper.CommonPermissions.PermissionsManage)]
        public async Task<IActionResult> GetPermissions()
        {
            try
            {
                var permissions = await _repository.GetAllWithNoTrackingAsync<Permission>().ToListAsync();
                
                var result = permissions.OrderByDescending(x => x.Name).Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    description = p.Description,
                    resource = p.Resource,
                    action = p.Action,
                    displayName = PermissionHelper.GetDisplayName(p.Name),
                    resourceDisplayName = PermissionHelper.GetResourceDisplayName(p.Resource),
                    actionDisplayName = PermissionHelper.GetActionDisplayName(p.Action)
                }).ToList();

                return Ok(result);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("checkhaspermission")]
        [Authorize]
        public async Task<bool> CheckUserPermissionAsync(string name)
        {
            try
            {
                var userId = _httpContext.GetUserId();
                // Get user with role
                var user = await _repository.GetAsync<Users>(u => u.Id == userId && u.IsActive);
                if (user == null)
                    return false;

                // Check role permissions
                var rolePermission = await _repository.GetAsync<RolePermission>(
                    rp => rp.RoleId == user.RoleId && 
                          rp.Permission.Name == name);

                if (rolePermission != null)
                    return true;

                // Check direct user permissions
                var userPermission = await _repository.GetAsync<UserPermission>(
                    up => up.UserId == userId && 
                          up.Permission.Name == name);

                return userPermission != null;
            }
            catch
            {
                return false;
            }
        }
    }
}