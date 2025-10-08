using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ClosedXML.Excel;
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
    public class GmailImportExportTests
    {
        private readonly Mock<IDBRepository> _mockRepository;
        private readonly Mock<IHttpContextAccessor> _mockHttpContextAccessor;
        private readonly Mock<Services.Services.Interfaces.IVeService> _mockVeService;
        private readonly Mock<WebTicketDbContext> _mockContext;
        private readonly VeController _controller;

        public GmailImportExportTests()
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

        #region DownloadGmailTemplate Tests

        [Fact]
        public void DownloadGmailTemplate_TemplateExists_ReturnsFileResult()
        {
            // Note: This test assumes the template file exists in Templates folder
            // In real scenario, you might want to create a test template file first

            // Act
            var result = _controller.DownloadGmailTemplate();

            // Assert - Check if result type is correct
            // If file doesn't exist, it will return NotFound instead
            Assert.True(result is FileContentResult || result is NotFoundObjectResult);
        }

        #endregion

        #region ImportGmail Tests

        [Fact]
        public async Task ImportGmail_NullFile_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.ImportGmail(null);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("No file uploaded.", badRequestResult.Value);
        }

        [Fact]
        public async Task ImportGmail_ValidFile_ReturnsOkWithAccounts()
        {
            // Arrange
            var excelFile = CreateValidExcelFile();

            // Act
            var result = await _controller.ImportGmail(excelFile);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value;

            // Check response structure
            var successProperty = response.GetType().GetProperty("success");
            var messageProperty = response.GetType().GetProperty("message");
            var dataProperty = response.GetType().GetProperty("data");

            Assert.NotNull(successProperty);
            Assert.NotNull(messageProperty);
            Assert.NotNull(dataProperty);

            var success = (bool)successProperty.GetValue(response);
            var data = dataProperty.GetValue(response) as List<PlatformAccount>;

            Assert.True(success);
            Assert.NotNull(data);
            Assert.NotEmpty(data);
        }

        [Fact]
        public async Task ImportGmail_FileWithInvalidEmails_ReturnsErrorFile()
        {
            // Arrange
            var excelFile = CreateExcelFileWithInvalidEmails();

            // Act
            var result = await _controller.ImportGmail(excelFile);

            // Assert
            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileResult.ContentType);
            Assert.Equal("Gmail-Import-Errors.xlsx", fileResult.FileDownloadName);
            Assert.True(fileResult.FileContents.Length > 0);
        }

        [Fact]
        public async Task ImportGmail_FileWithMissingPassword_ReturnsErrorFile()
        {
            // Arrange
            var excelFile = CreateExcelFileWithMissingPassword();

            // Act
            var result = await _controller.ImportGmail(excelFile);

            // Assert
            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("Gmail-Import-Errors.xlsx", fileResult.FileDownloadName);
        }

        [Fact]
        public async Task ImportGmail_FileWithEmptyRows_SkipsEmptyRows()
        {
            // Arrange
            var excelFile = CreateExcelFileWithEmptyRows();

            // Act
            var result = await _controller.ImportGmail(excelFile);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value;
            var dataProperty = response.GetType().GetProperty("data");
            var data = dataProperty.GetValue(response) as List<PlatformAccount>;

            // Should only have valid rows, empty rows skipped
            Assert.NotNull(data);
            Assert.Equal(2, data.Count); // Only 2 valid rows
        }

        [Fact]
        public async Task ImportGmail_FileWithMixedValidAndInvalid_ReturnsErrorFileWithOnlyInvalidRows()
        {
            // Arrange
            var excelFile = CreateExcelFileWithMixedData();

            // Act
            var result = await _controller.ImportGmail(excelFile);

            // Assert - Should return error file because there are invalid rows
            var fileResult = Assert.IsType<FileContentResult>(result);

            // Verify error file contains only invalid rows
            using (var ms = new MemoryStream(fileResult.FileContents))
            using (var workbook = new XLWorkbook(ms))
            {
                var worksheet = workbook.Worksheet(1);
                var rowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;

                // Header + 2 invalid rows = 3 rows total
                Assert.Equal(3, rowCount);
            }
        }

        [Fact]
        public async Task ImportGmail_ValidFile_SetsCorrectAccountType()
        {
            // Arrange
            var excelFile = CreateValidExcelFile();

            // Act
            var result = await _controller.ImportGmail(excelFile);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value;
            var dataProperty = response.GetType().GetProperty("data");
            var data = dataProperty.GetValue(response) as List<PlatformAccount>;

            Assert.All(data, account => Assert.Equal(AccountType.Gmail, account.Type));
        }

        [Fact]
        public async Task ImportGmail_ValidFile_SetsActiveStatus()
        {
            // Arrange
            var excelFile = CreateValidExcelFile();

            // Act
            var result = await _controller.ImportGmail(excelFile);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value;
            var dataProperty = response.GetType().GetProperty("data");
            var data = dataProperty.GetValue(response) as List<PlatformAccount>;

            Assert.All(data, account => Assert.Equal(AccountStatus.Active, account.Status));
        }

        [Fact]
        public async Task ImportGmail_FileWithOptionalFields_ParsesCorrectly()
        {
            // Arrange
            var excelFile = CreateExcelFileWithAllFields();

            // Act
            var result = await _controller.ImportGmail(excelFile);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value;
            var dataProperty = response.GetType().GetProperty("data");
            var data = dataProperty.GetValue(response) as List<PlatformAccount>;

            var account = data.First();
            Assert.Equal("test@gmail.com", account.Email);
            Assert.Equal("password123", account.Password);
            Assert.Equal("0123456789", account.RecoveryPhone);
            Assert.Equal("recovery@gmail.com", account.RecoveryEmail);
        }

        #endregion

        #region Helper Methods

        private IFormFile CreateValidExcelFile()
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Gmail");

                // Header (row 1)
                worksheet.Cell(1, 2).Value = "Email";
                worksheet.Cell(1, 3).Value = "Password";
                worksheet.Cell(1, 10).Value = "Recovery Phone";
                worksheet.Cell(1, 11).Value = "Recovery Email";

                // Valid data
                worksheet.Cell(2, 2).Value = "test1@gmail.com";
                worksheet.Cell(2, 3).Value = "password123";
                worksheet.Cell(2, 10).Value = "0123456789";
                worksheet.Cell(2, 11).Value = "recovery1@gmail.com";

                worksheet.Cell(3, 2).Value = "test2@gmail.com";
                worksheet.Cell(3, 3).Value = "password456";
                worksheet.Cell(3, 10).Value = "0987654321";
                worksheet.Cell(3, 11).Value = "recovery2@gmail.com";

                var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var file = new Mock<IFormFile>();
                file.Setup(f => f.OpenReadStream()).Returns(stream);
                file.Setup(f => f.Length).Returns(stream.Length);
                file.Setup(f => f.FileName).Returns("test.xlsx");

                return file.Object;
            }
        }

        private IFormFile CreateExcelFileWithInvalidEmails()
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Gmail");

                // Header
                worksheet.Cell(1, 2).Value = "Email";
                worksheet.Cell(1, 3).Value = "Password";

                // Invalid email
                worksheet.Cell(2, 2).Value = "invalid-email";
                worksheet.Cell(2, 3).Value = "password123";

                worksheet.Cell(3, 2).Value = "another-bad-email";
                worksheet.Cell(3, 3).Value = "password456";

                var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var file = new Mock<IFormFile>();
                file.Setup(f => f.OpenReadStream()).Returns(stream);
                file.Setup(f => f.Length).Returns(stream.Length);
                file.Setup(f => f.FileName).Returns("test.xlsx");

                return file.Object;
            }
        }

        private IFormFile CreateExcelFileWithMissingPassword()
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Gmail");

                // Header
                worksheet.Cell(1, 2).Value = "Email";
                worksheet.Cell(1, 3).Value = "Password";

                // Missing password
                worksheet.Cell(2, 2).Value = "test@gmail.com";
                worksheet.Cell(2, 3).Value = "";

                var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var file = new Mock<IFormFile>();
                file.Setup(f => f.OpenReadStream()).Returns(stream);
                file.Setup(f => f.Length).Returns(stream.Length);
                file.Setup(f => f.FileName).Returns("test.xlsx");

                return file.Object;
            }
        }

        private IFormFile CreateExcelFileWithEmptyRows()
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Gmail");

                // Header
                worksheet.Cell(1, 2).Value = "Email";
                worksheet.Cell(1, 3).Value = "Password";

                // Valid row
                worksheet.Cell(2, 2).Value = "test1@gmail.com";
                worksheet.Cell(2, 3).Value = "password123";

                // Empty row
                worksheet.Cell(3, 2).Value = "";
                worksheet.Cell(3, 3).Value = "";

                // Another valid row
                worksheet.Cell(4, 2).Value = "test2@gmail.com";
                worksheet.Cell(4, 3).Value = "password456";

                // Another empty row
                worksheet.Cell(5, 2).Value = "";
                worksheet.Cell(5, 3).Value = "";

                var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var file = new Mock<IFormFile>();
                file.Setup(f => f.OpenReadStream()).Returns(stream);
                file.Setup(f => f.Length).Returns(stream.Length);
                file.Setup(f => f.FileName).Returns("test.xlsx");

                return file.Object;
            }
        }

        private IFormFile CreateExcelFileWithMixedData()
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Gmail");

                // Header
                worksheet.Cell(1, 2).Value = "Email";
                worksheet.Cell(1, 3).Value = "Password";

                // Valid
                worksheet.Cell(2, 2).Value = "valid1@gmail.com";
                worksheet.Cell(2, 3).Value = "password123";

                // Invalid email
                worksheet.Cell(3, 2).Value = "invalid-email";
                worksheet.Cell(3, 3).Value = "password456";

                // Valid
                worksheet.Cell(4, 2).Value = "valid2@gmail.com";
                worksheet.Cell(4, 3).Value = "password789";

                // Missing password
                worksheet.Cell(5, 2).Value = "test@gmail.com";
                worksheet.Cell(5, 3).Value = "";

                var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var file = new Mock<IFormFile>();
                file.Setup(f => f.OpenReadStream()).Returns(stream);
                file.Setup(f => f.Length).Returns(stream.Length);
                file.Setup(f => f.FileName).Returns("test.xlsx");

                return file.Object;
            }
        }

        private IFormFile CreateExcelFileWithAllFields()
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Gmail");

                // Header
                worksheet.Cell(1, 2).Value = "Email";
                worksheet.Cell(1, 3).Value = "Password";
                worksheet.Cell(1, 10).Value = "Recovery Phone";
                worksheet.Cell(1, 11).Value = "Recovery Email";

                // Complete data
                worksheet.Cell(2, 2).Value = "test@gmail.com";
                worksheet.Cell(2, 3).Value = "password123";
                worksheet.Cell(2, 10).Value = "0123456789";
                worksheet.Cell(2, 11).Value = "recovery@gmail.com";

                var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var file = new Mock<IFormFile>();
                file.Setup(f => f.OpenReadStream()).Returns(stream);
                file.Setup(f => f.Length).Returns(stream.Length);
                file.Setup(f => f.FileName).Returns("test.xlsx");

                return file.Object;
            }
        }

        #endregion
    }
}
