using Common;
using Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories.Interfaces;
using Services.Models;
using Services.Services.Interfaces;
using System.Security.Claims;
using WebTicket.Common;

namespace WebTicket.Controllers
{
    public class UserController : APIBaseController
    {
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;


        public UserController(IHttpContextAccessor accessor, IConfiguration configuration, IDBRepository repository,
                                   IUserService userService) : base(accessor, repository)
        {
            _configuration = configuration;
            _userService = userService;
        }

        [HttpPost("add")]
        [RequirePermission(PermissionHelper.CommonPermissions.UsersManage)]
        public async Task<IActionResult> AddUser([FromBody] AddUser model)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Password))
                {
                    return BadRequest("Email and Password are required.");
                }

                // Check if user already exists
                var existingUser = await _repository.GetAllWithAsync<Users>(u => u.Email.ToLower() == model.Email.ToLower());
                if (existingUser == null)
                {
                    return BadRequest("User with this email already exists.");
                }

                // Validate permissions if provided
                List<Permission>? validPermissions = null;
                if (model.PermissionNames != null && model.PermissionNames.Any())
                {
                    validPermissions = await _repository.GetAllWithNoTrackingAsync<Permission>(
                        p => model.PermissionNames.Contains(p.Name)).ToListAsync();
                    
                    if (validPermissions.Count != model.PermissionNames.Count)
                    {
                        var foundNames = validPermissions.Select(p => p.Name).ToList();
                        var invalidNames = model.PermissionNames.Except(foundNames).ToList();
                        return BadRequest($"Invalid permission names: {string.Join(", ", invalidNames)}");
                    }
                }

                // Get Staff role as default
                var staffRole = await _repository.GetAsync<Role>(r => r.Type == RoleType.Staff);
                if (staffRole == null)
                {
                    return BadRequest("Staff role not found in system.");
                }

                // Create new user entity
                var newUser = new Users
                {
                    Email = model.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(model.Password),
                    IsActive = true,
                    RoleId = staffRole.Id
                };

                // Set creation info using base controller method
                InitCreationInfo(newUser);

                // Add user through service
                await _userService.AddAsync(newUser);

                // Add user permissions if provided
                if (validPermissions != null && validPermissions.Any())
                {
                    var userPermissions = validPermissions.Select(permission => 
                    {
                        var userPermission = new UserPermission
                        {
                            UserId = newUser.Id,
                            PermissionId = permission.Id
                        };
                        InitCreationInfo(userPermission);
                        return userPermission;
                    }).ToList();

                    await _repository.AddRangeAsync(userPermissions);
                    await _repository.SaveChangesAsync();
                }

                return Ok(new { 
                    message = "User created successfully", 
                    userId = newUser.Id,
                    permissionsAdded = model.PermissionNames?.Count ?? 0
                });
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPut("update")]
        [RequirePermission(PermissionHelper.CommonPermissions.UsersManage)]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUser model)
        {
            try
            {
                //if (model.UserId == _httpContext.GetUserId())
                //{
                //    return BadRequest("Không thể cập nhật quyền của chính mình");
                //}
                // Get existing user with role
                var existingUser = await _repository.GetAsync<Users>(u => u.Id == model.UserId);
                if (existingUser == null)
                {
                    return NotFound("User not found.");
                }

                var checkDuplicateUser = await _repository.AnyAsync<Users>(u => u.Email.ToLower() == model.Email.ToLower() && u.Id != model.UserId);
                if (checkDuplicateUser)
                {
                    return BadRequest("Tên tài khoản/email đã tồn tại");
                }

                // Get current user to check admin privileges
                var currentUserId = _httpContext.GetUserId();
                var currentUser = await _repository.GetAsync<Users>(u => u.Id == currentUserId);
                if (currentUser == null)
                {
                    return Unauthorized("Current user not found.");
                }

                // Check if target user is Admin and current user is not Admin
                if (existingUser.Role?.Type == RoleType.Admin && currentUser.Role?.Type != RoleType.Admin)
                {
                    return Forbid("Only Admin users can update Admin accounts.");
                }

                // Update email if provided
                if (!string.IsNullOrWhiteSpace(model.Email))
                {
                    // Check if new email already exists (excluding current user)
                    var duplicateUser = await _repository.GetAsync<Users>(
                        u => u.Email.ToLower() == model.Email.ToLower() && u.Id != model.UserId);
                    if (duplicateUser != null)
                    {
                        return BadRequest("Email already exists for another user.");
                    }
                    existingUser.Email = model.Email;
                }

                // Update password if provided
                if (!string.IsNullOrWhiteSpace(model.Password))
                {
                    existingUser.Password = BCrypt.Net.BCrypt.HashPassword(model.Password);
                }

                // Update active status if provided
                if (model.IsActive.HasValue)
                {
                    existingUser.IsActive = model.IsActive.Value;
                }

                // Set modification info
                InitUpdateInfo(existingUser);

                // Update user
                await _repository.UpdateAsync(existingUser);

                // Handle permissions update if provided
                var existingPermissions = await _repository.GetAllWithNoTrackingAsync<UserPermission>(
                        up => up.UserId == model.UserId).ToListAsync();
                if (existingPermissions.Any())
                {
                    await _repository.DeleteRangeAsync(existingPermissions);
                }

                // Add new permissions if any
                if (model.PermissionNames.Any())
                {
                    var validPermissions = await _repository.GetAllWithNoTrackingAsync<Permission>(
                        p => model.PermissionNames.Contains(p.Name)).ToListAsync();

                    if (validPermissions.Count != model.PermissionNames.Count)
                    {
                        var foundNames = validPermissions.Select(p => p.Name).ToList();
                        var invalidNames = model.PermissionNames.Except(foundNames).ToList();
                        return BadRequest($"Invalid permission names: {string.Join(", ", invalidNames)}");
                    }

                    var newUserPermissions = validPermissions.Select(permission =>
                    {
                        var userPermission = new UserPermission
                        {
                            UserId = model.UserId,
                            PermissionId = permission.Id
                        };
                        InitCreationInfo(userPermission);
                        return userPermission;
                    }).ToList();

                    await _repository.AddRangeAsync(newUserPermissions);
                }

                await _repository.SaveChangesAsync();

                return Ok(new
                {
                    message = "User updated successfully",
                    userId = model.UserId,
                    permissionsUpdated = model.PermissionNames?.Count ?? 0
                });
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpDelete("delete/{userId}")]
        [RequirePermission(PermissionHelper.CommonPermissions.UsersManage)]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            try
            {
                // Get existing user
                var existingUser = await _repository.GetAsync<Users>(u => u.Id == userId);
                if (existingUser == null)
                {
                    return NotFound("User not found.");
                }

                // Check if trying to delete admin user (prevent accidental deletion)
                if (existingUser.Email == "admin@admin.com")
                {
                    return BadRequest("Cannot delete admin user.");
                }

                // Get current user to prevent self-deletion
                var currentUserId = _httpContext.GetUserId();
                if (userId == currentUserId)
                {
                    return BadRequest("Cannot delete your own account.");
                }

                // Delete user permissions first (foreign key constraint)
                var userPermissions = await _repository.GetAllWithTrackingAsync<UserPermission>(
                    up => up.UserId == userId).ToListAsync();
                if (userPermissions.Any())
                {
                    await _repository.DeleteRangeAsync(userPermissions);
                }

                // Delete user tokens
                var userTokens = await _repository.GetAllWithTrackingAsync<UserTokens>(
                    ut => ut.UserId == userId).ToListAsync();
                if (userTokens.Any())
                {
                    await _repository.DeleteRangeAsync(userTokens);
                }

                // Delete the user
                await _repository.DeleteAsync(existingUser);
                await _repository.SaveChangesAsync();

                return Ok(new
                {
                    message = "User deleted successfully",
                    userId = userId,
                    userEmail = existingUser.Email
                });
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("my-permissions")]
        [Authorize]
        public async Task<IActionResult> GetMyPermissions()
        {
            try
            {
                var currentUserId = _httpContext.GetUserId();
                if (currentUserId == Guid.Empty)
                {
                    return Unauthorized("User not found in token.");
                }

                // Get user with role
                var user = await _repository.GetAsync<Users>(u => u.Id == currentUserId && u.IsActive);
                if (user == null)
                {
                    return NotFound("User not found or inactive.");
                }

                var allPermissions = new List<Permission>();

                // Get role permissions
                var rolePermissions = await _repository.GetAllWithNoTrackingAsync<RolePermission>(
                        rp => rp.RoleId == user.RoleId).ToListAsync();

                allPermissions.AddRange(rolePermissions.Select(rp => rp.Permission));

                // Get direct user permissions
                var userPermissions = await _repository.GetAllWithNoTrackingAsync<UserPermission>(
                    up => up.UserId == currentUserId).ToListAsync();
                
                allPermissions.AddRange(userPermissions.Select(up => up.Permission));

                // Remove duplicates and sort
                var uniquePermissions = allPermissions
                    .GroupBy(p => p.Id)
                    .Select(g => g.First())
                    .OrderBy(p => p.Resource)
                    .ThenBy(p => p.Action)
                    .ToList();

                var result = new
                {
                    userId = currentUserId,
                    userEmail = user.Email,
                    roleName = user.Role?.Type.GetDescription(),
                    roleType = user.Role?.Type,
                    permissions = uniquePermissions.Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        description = p.Description,
                        resource = p.Resource,
                        action = p.Action,
                        displayName = PermissionHelper.GetDisplayName(p.Name),
                        resourceDisplayName = PermissionHelper.GetResourceDisplayName(p.Resource),
                        actionDisplayName = PermissionHelper.GetActionDisplayName(p.Action)
                    }).ToList(),
                    totalPermissions = uniquePermissions.Count
                };

                return Ok(result);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("list")]
        [RequirePermission(PermissionHelper.CommonPermissions.UsersManage)]
        public async Task<IActionResult> GetUserList()
        {
            try
            {
                // Get all active users with their roles
                var users = await _repository.GetAllWithNoTrackingAsync<Users>().ToListAsync();

                var userListResult = new List<object>();
                var allRolePermisison = await _repository.GetAllWithNoTrackingAsync<RolePermission>()
                    .Include(x => x.Permission).ToListAsync();

                foreach (var user in users)
                {
                    var allPermissions = new List<Permission>();

                    // Get role permissions

                    var rolePermissions = allRolePermisison.Where(
                        rp => rp.RoleId == user.RoleId).ToList();

                    allPermissions.AddRange(rolePermissions.Select(rp => rp.Permission));

                    // Get direct user permissions
                    var userPermissions = await _repository.GetAllWithNoTrackingAsync<UserPermission>(
                        up => up.UserId == user.Id).ToListAsync();

                    allPermissions.AddRange(userPermissions.Select(up => up.Permission));

                    // Remove duplicates and sort
                    var uniquePermissions = allPermissions
                        .GroupBy(p => p.Id)
                        .Select(g => g.First())
                        .OrderBy(p => p.Resource)
                        .ThenBy(p => p.Action)
                        .ToList();

                    // Get role info
                    Role? userRole = await _repository.GetAsync<Role>(r => r.Id == user.RoleId);


                    var userResult = new
                    {
                        userId = user.Id,
                        email = user.Email,
                        isActive = user.IsActive,
                        createdTime = user.CreatedTime,
                        lastLoginAt = user.LastLoginAt,
                        role = userRole != null ? new
                        {
                            id = userRole.Id,
                            type = userRole.Type,
                            typeName = userRole.Type.GetDescription(),
                            description = userRole.Description
                        } : null,
                        permissions = uniquePermissions.Select(p => new
                        {
                            id = p.Id,
                            name = p.Name,
                            description = p.Description,
                            resource = p.Resource,
                            action = p.Action,
                            displayName = PermissionHelper.GetDisplayName(p.Name),
                            resourceDisplayName = PermissionHelper.GetResourceDisplayName(p.Resource),
                            actionDisplayName = PermissionHelper.GetActionDisplayName(p.Action)
                        }).ToList(),
                        totalPermissions = uniquePermissions.Count
                    };

                    userListResult.Add(userResult);
                }

                var result = new
                {
                    users = userListResult.OrderBy(u => ((dynamic)u).email).ToList(),
                    totalUsers = userListResult.Count
                };

                return Ok(result);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> LoginAsync([FromBody] LoginModel model)
        {
            try
            {
                var token = await _userService.LoginAsync(model);
                if (string.IsNullOrEmpty(token.token))
                {
                    return BadRequest("Sai email hoặc mật khẩu");
                }
                SetRefreshTokenCookie(token.refreshToken);

                return Ok(new { accessToken = token.token });
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("logout")]
        [Authorize]
        public async Task<IActionResult> LoginOutAsync()
        {
            try
            {
                var userIdClaim = new Guid(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                await _userService.LogoutAsync(userIdClaim);

                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest();
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized("No refresh token provided.");
            }

            var tokens = await _userService.GetNewByRefreshToken(refreshToken);

            if(string.IsNullOrEmpty(tokens.token) || string.IsNullOrEmpty(tokens.refreshToken))
            {
                return Unauthorized("Invalid or expired refresh token.");
            }

            SetRefreshTokenCookie(tokens.refreshToken);

            return Ok(new { accessToken = tokens.token });
        }

        [HttpGet("test")]
        [Authorize]
        public IActionResult TestLogin()
        {
            return Ok();
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var isHaveValidTIme = int.TryParse(_configuration["Jwt:ValidTimeRF"], out int validTime);
            if (!isHaveValidTIme)
            {
                validTime = 5;
            }
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Use Secure = true in production
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddHours(validTime)
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}
