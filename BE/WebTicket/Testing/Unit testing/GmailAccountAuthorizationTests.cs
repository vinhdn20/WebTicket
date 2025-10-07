using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Common;
using Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Moq;
using Repositories.Interfaces;
using WebTicket.Common;
using Xunit;

namespace Testing.Unit_testing
{
    public class GmailAccountAuthorizationTests
    {
        private readonly Mock<IDBRepository> _mockRepository;
        private readonly Mock<HttpContext> _mockHttpContext;
        private readonly Mock<IServiceProvider> _mockServiceProvider;
        private AuthorizationFilterContext _filterContext;

        public GmailAccountAuthorizationTests()
        {
            _mockRepository = new Mock<IDBRepository>();
            _mockHttpContext = new Mock<HttpContext>();
            _mockServiceProvider = new Mock<IServiceProvider>();

            var actionContext = new ActionContext(
                _mockHttpContext.Object,
                new Microsoft.AspNetCore.Routing.RouteData(),
                new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor()
            );

            _filterContext = new AuthorizationFilterContext(
                actionContext,
                new List<IFilterMetadata>()
            );

            _mockHttpContext.Setup(x => x.RequestServices).Returns(_mockServiceProvider.Object);
            _mockServiceProvider.Setup(x => x.GetService(typeof(IDBRepository))).Returns(_mockRepository.Object);
        }

        #region Authentication Tests

        [Fact]
        public async Task RequirePermission_WithUnauthenticatedUser_ReturnsUnauthorized()
        {
            // Arrange
            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            var identity = new ClaimsIdentity(); // Not authenticated
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.IsType<UnauthorizedResult>(_filterContext.Result);
        }

        [Fact]
        public async Task RequirePermission_WithNoUserId_ReturnsUnauthorized()
        {
            // Arrange
            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            var identity = new ClaimsIdentity("TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.IsType<UnauthorizedResult>(_filterContext.Result);
        }

        #endregion

        #region GmailAccountManage Permission Tests

        [Fact]
        public async Task RequirePermission_UserWithGmailManagePermission_AllowsAccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            var permissionId = Guid.NewGuid();

            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            // Setup authenticated user with claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Setup user with role
            var user = new Users
            {
                Id = userId,
                Email = "admin@test.com",
                RoleId = roleId,
                IsActive = true
            };

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Users, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(user);

            // Setup role permission
            var rolePermission = new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = roleId,
                PermissionId = permissionId,
                Permission = new Permission
                {
                    Id = permissionId,
                    Name = PermissionHelper.CommonPermissions.GmailAccountManage,
                    Resource = Resources.GmailAccount,
                    Action = Actions.Manage
                }
            };

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<RolePermission, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(rolePermission);

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.Null(_filterContext.Result); // No result means authorization succeeded
        }

        [Fact]
        public async Task RequirePermission_UserWithoutGmailManagePermission_ReturnsForbidden()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();

            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            // Setup authenticated user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Setup user without Gmail permission
            var user = new Users
            {
                Id = userId,
                Email = "user@test.com",
                RoleId = roleId,
                IsActive = true
            };

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Users, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(user);

            // No role permission (returns null)
            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<RolePermission, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync((RolePermission?)null);

            // No user permission (returns null)
            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<UserPermission, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync((UserPermission?)null);

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.IsType<ForbidResult>(_filterContext.Result);
        }

        [Fact]
        public async Task RequirePermission_UserWithDirectGmailPermission_AllowsAccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            var permissionId = Guid.NewGuid();

            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            // Setup authenticated user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Setup user
            var user = new Users
            {
                Id = userId,
                Email = "user@test.com",
                RoleId = roleId,
                IsActive = true
            };

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Users, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(user);

            // No role permission
            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<RolePermission, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync((RolePermission?)null);

            // Setup direct user permission
            var userPermission = new UserPermission
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PermissionId = permissionId,
                Permission = new Permission
                {
                    Id = permissionId,
                    Name = PermissionHelper.CommonPermissions.GmailAccountManage,
                    Resource = Resources.GmailAccount,
                    Action = Actions.Manage
                }
            };

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<UserPermission, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(userPermission);

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.Null(_filterContext.Result); // Authorization succeeded
        }

        [Fact]
        public async Task RequirePermission_InactiveUser_ReturnsForbidden()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();

            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            // Setup authenticated user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Setup inactive user
            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Users, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync((Users?)null); // User not found or inactive

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.IsType<ForbidResult>(_filterContext.Result);
        }

        [Fact]
        public async Task RequirePermission_UserWithTripPermissionOnly_CannotAccessGmail()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            var permissionId = Guid.NewGuid();

            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            // Setup authenticated user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Setup user
            var user = new Users
            {
                Id = userId,
                Email = "user@test.com",
                RoleId = roleId,
                IsActive = true
            };

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Users, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(user);

            // Setup role permission for Trip (not Gmail)
            var rolePermission = new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = roleId,
                PermissionId = permissionId,
                Permission = new Permission
                {
                    Id = permissionId,
                    Name = PermissionHelper.CommonPermissions.TripAccountManage, // Different permission
                    Resource = Resources.TripAccount,
                    Action = Actions.Manage
                }
            };

            // The query will not match, so return null
            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<RolePermission, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync((RolePermission?)null);

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<UserPermission, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync((UserPermission?)null);

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.IsType<ForbidResult>(_filterContext.Result);
        }

        [Fact]
        public async Task RequirePermission_RepositoryException_ReturnsForbidden()
        {
            // Arrange
            var userId = Guid.NewGuid();

            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            // Setup authenticated user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Setup repository to throw exception
            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Users, bool>>>(), It.IsAny<bool>()))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.IsType<ForbidResult>(_filterContext.Result);
        }

        #endregion

        #region Other Permission Tests

        [Fact]
        public async Task RequirePermission_AdminWithAllPermissions_CanAccessGmail()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var adminRoleId = Guid.NewGuid();
            var permissionId = Guid.NewGuid();

            var attribute = new RequirePermissionAttribute(PermissionHelper.CommonPermissions.GmailAccountManage);

            // Setup authenticated admin user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Setup admin user
            var user = new Users
            {
                Id = userId,
                Email = "admin@test.com",
                RoleId = adminRoleId,
                IsActive = true
            };

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Users, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(user);

            // Setup admin role permission
            var rolePermission = new RolePermission
            {
                Id = Guid.NewGuid(),
                RoleId = adminRoleId,
                PermissionId = permissionId,
                Permission = new Permission
                {
                    Id = permissionId,
                    Name = PermissionHelper.CommonPermissions.GmailAccountManage,
                    Resource = Resources.GmailAccount,
                    Action = Actions.Manage
                }
            };

            _mockRepository
                .Setup(repo => repo.GetAsync(It.IsAny<System.Linq.Expressions.Expression<Func<RolePermission, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(rolePermission);

            // Act
            await attribute.OnAuthorizationAsync(_filterContext);

            // Assert
            Assert.Null(_filterContext.Result); // Authorization succeeded
        }

        #endregion
    }
}
