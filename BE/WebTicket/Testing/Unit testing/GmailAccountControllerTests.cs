using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Common;
using Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Repositories;
using Repositories.Interfaces;
using Ve.Controllers;
using Xunit;

namespace Testing.Unit_testing
{
    public class GmailAccountControllerTests
    {
        private readonly Mock<IDBRepository> _mockRepository;
        private readonly Mock<IHttpContextAccessor> _mockHttpContextAccessor;
        private readonly Mock<Services.Services.Interfaces.IVeService> _mockVeService;
        private readonly Mock<WebTicketDbContext> _mockContext;
        private readonly VeController _controller;

        public GmailAccountControllerTests()
        {
            _mockRepository = new Mock<IDBRepository>();
            _mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
            _mockVeService = new Mock<Services.Services.Interfaces.IVeService>();

            var options = new DbContextOptionsBuilder<WebTicketDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _mockContext = new Mock<WebTicketDbContext>(options);

            _controller = new VeController(
                _mockHttpContextAccessor.Object,
                _mockContext.Object,
                _mockVeService.Object,
                _mockRepository.Object
            );
        }

        #region AddGmail Tests

        [Fact]
        public async Task AddGmail_WithValidAccounts_ReturnsOkResult()
        {
            // Arrange
            var gmailAccounts = new List<PlatformAccount>
            {
                new PlatformAccount
                {
                    Email = "test@gmail.com",
                    Password = "password123",
                    RecoveryPhone = "0123456789",
                    RecoveryEmail = "recovery@gmail.com",
                    Status = AccountStatus.Active
                }
            };

            _mockRepository
                .Setup(repo => repo.AddRangeAsync(It.IsAny<List<PlatformAccount>>(), true))
                .ReturnsAsync(1);

            // Act
            var result = await _controller.AddGmail(gmailAccounts);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedAccounts = Assert.IsAssignableFrom<List<PlatformAccount>>(okResult.Value);
            Assert.Single(returnedAccounts);
            Assert.Equal(AccountType.Gmail, returnedAccounts[0].Type);
            Assert.NotEqual(Guid.Empty, returnedAccounts[0].Id);
        }

        [Fact]
        public async Task AddGmail_WithMultipleAccounts_SetsGmailTypeForAll()
        {
            // Arrange
            var gmailAccounts = new List<PlatformAccount>
            {
                new PlatformAccount { Email = "test1@gmail.com", Password = "pass1", Status = AccountStatus.Active },
                new PlatformAccount { Email = "test2@gmail.com", Password = "pass2", Status = AccountStatus.Active },
                new PlatformAccount { Email = "test3@gmail.com", Password = "pass3", Status = AccountStatus.Active }
            };

            _mockRepository
                .Setup(repo => repo.AddRangeAsync(It.IsAny<List<PlatformAccount>>(), true))
                .ReturnsAsync(3);

            // Act
            var result = await _controller.AddGmail(gmailAccounts);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedAccounts = Assert.IsAssignableFrom<List<PlatformAccount>>(okResult.Value);
            Assert.Equal(3, returnedAccounts.Count);
            Assert.All(returnedAccounts, account => Assert.Equal(AccountType.Gmail, account.Type));
            Assert.All(returnedAccounts, account => Assert.NotEqual(Guid.Empty, account.Id));
        }

        [Fact]
        public async Task AddGmail_WithRepositoryException_ReturnsBadRequest()
        {
            // Arrange
            var gmailAccounts = new List<PlatformAccount>
            {
                new PlatformAccount { Email = "test@gmail.com", Password = "pass", Status = AccountStatus.Active }
            };

            _mockRepository
                .Setup(repo => repo.AddRangeAsync(It.IsAny<List<PlatformAccount>>(), true))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.AddGmail(gmailAccounts);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Server error", badRequestResult.Value?.ToString());
        }

        #endregion

        #region DeleteGmail Tests

        // Note: DeleteGmail uses ToListAsync() which is complex to mock with IQueryable.
        // For full integration testing, consider using TestContainers or in-memory database.
        // These tests verify the exception handling path only.

        [Fact]
        public async Task DeleteGmail_WithRepositoryException_ReturnsBadRequest()
        {
            // Arrange
            var accountIds = new List<Guid> { Guid.NewGuid() };

            _mockRepository
                .Setup(repo => repo.GetAllWithNoTrackingAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PlatformAccount, bool>>>()))
                .Throws(new Exception("Database error"));

            // Act
            var result = await _controller.DeleteGmail(accountIds);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Server error", badRequestResult.Value?.ToString());
        }

        #endregion

        #region GetGmailInfo Tests

        [Fact]
        public async Task GetGmailInfo_WithoutEmail_ReturnsAllGmailAccounts()
        {
            // Arrange
            var gmailAccounts = new List<PlatformAccount>
            {
                new PlatformAccount { Id = Guid.NewGuid(), Email = "test1@gmail.com", Type = AccountType.Gmail, Status = AccountStatus.Active },
                new PlatformAccount { Id = Guid.NewGuid(), Email = "test2@gmail.com", Type = AccountType.Gmail, Status = AccountStatus.Active }
            };

            _mockRepository
                .Setup(repo => repo.GetAllWithAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PlatformAccount, bool>>>()))
                .ReturnsAsync(gmailAccounts);

            // Act
            var result = await _controller.GetGmailInfo(null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedAccounts = Assert.IsAssignableFrom<List<PlatformAccount>>(okResult.Value);
            Assert.Equal(2, returnedAccounts.Count);
            Assert.All(returnedAccounts, account => Assert.Equal(AccountType.Gmail, account.Type));
        }

        [Fact]
        public async Task GetGmailInfo_WithEmptyEmail_ReturnsAllGmailAccounts()
        {
            // Arrange
            var gmailAccounts = new List<PlatformAccount>
            {
                new PlatformAccount { Id = Guid.NewGuid(), Email = "test@gmail.com", Type = AccountType.Gmail, Status = AccountStatus.Active }
            };

            _mockRepository
                .Setup(repo => repo.GetAllWithAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PlatformAccount, bool>>>()))
                .ReturnsAsync(gmailAccounts);

            // Act
            var result = await _controller.GetGmailInfo(string.Empty);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedAccounts = Assert.IsAssignableFrom<List<PlatformAccount>>(okResult.Value);
            Assert.Single(returnedAccounts);
        }

        [Fact]
        public async Task GetGmailInfo_WithEmailFilter_ReturnsFilteredAccounts()
        {
            // Arrange
            var searchEmail = "john";
            var gmailAccounts = new List<PlatformAccount>
            {
                new PlatformAccount { Id = Guid.NewGuid(), Email = "john.doe@gmail.com", Type = AccountType.Gmail, Status = AccountStatus.Active }
            };

            _mockRepository
                .Setup(repo => repo.GetAllWithAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PlatformAccount, bool>>>()))
                .ReturnsAsync(gmailAccounts);

            // Act
            var result = await _controller.GetGmailInfo(searchEmail);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedAccounts = Assert.IsAssignableFrom<List<PlatformAccount>>(okResult.Value);
            Assert.Single(returnedAccounts);
            Assert.Contains(searchEmail, returnedAccounts[0].Email, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task GetGmailInfo_WithNoMatchingEmail_ReturnsEmptyList()
        {
            // Arrange
            var searchEmail = "nonexistent";
            var emptyList = new List<PlatformAccount>();

            _mockRepository
                .Setup(repo => repo.GetAllWithAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PlatformAccount, bool>>>()))
                .ReturnsAsync(emptyList);

            // Act
            var result = await _controller.GetGmailInfo(searchEmail);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedAccounts = Assert.IsAssignableFrom<List<PlatformAccount>>(okResult.Value);
            Assert.Empty(returnedAccounts);
        }

        [Fact]
        public async Task GetGmailInfo_WithRepositoryException_ReturnsBadRequest()
        {
            // Arrange
            _mockRepository
                .Setup(repo => repo.GetAllWithAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PlatformAccount, bool>>>()))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetGmailInfo(null);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Server error", badRequestResult.Value?.ToString());
        }

        #endregion
    }
}
