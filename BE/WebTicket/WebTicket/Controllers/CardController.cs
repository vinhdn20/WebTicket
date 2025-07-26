using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repositories.Interfaces;
using Services.Services.Interfaces;
using System.Text;

namespace WebTicket.Controllers
{
    public class CardController : APIBaseController
    {
        private readonly ICardService _cardService;

        public CardController(IHttpContextAccessor accessor, IDBRepository repository, ICardService cardService) : base(accessor, repository)
        {
            _cardService = cardService;
        }

        [HttpPost("import")]
        [Authorize]
        public async Task<IActionResult> ImportExcel(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                var allowedExtensions = new[] { ".xlsx", ".xls" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest("Only Excel files (.xlsx, .xls) are allowed");
                }

                const int maxFileSize = 10 * 1024 * 1024; // 10MB
                if (file.Length > maxFileSize)
                {
                    return BadRequest("File size exceeds 10MB limit");
                }

                using var stream = file.OpenReadStream();
                var result = await _cardService.ImportFromExcelAsync(stream, file.FileName);

                if (result.Success)
                {
                    return Ok(new
                    {
                        message = result.Message,
                        fileName = file.FileName,
                        processedCount = result.ProcessedCount
                    });
                }
                else
                {
                    return BadRequest(result.Message);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error processing file: {ex.Message}");
            }
        }
    }
}