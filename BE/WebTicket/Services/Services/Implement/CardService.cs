using ClosedXML.Excel;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services.Implement
{
    public class CardService : BasicOperationService<Card>, ICardService
    {
        public CardService(IDBRepository repository) : base(repository)
        {
        }

        public async Task<(bool Success, string Message, int ProcessedCount)> ImportFromExcelAsync(Stream fileStream, string fileName)
        {
            try
            {
                var cards = new List<Card>();
                var errors = new List<string>();
                int rowNumber = 2; // Data starts from row 2

                // Create a memory stream copy to avoid conflicts with images
                using var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                
                var loadOptions = new LoadOptions
                {
                    RecalculateAllFormulas = false
                };
                
                using (var workbook = new XLWorkbook(memoryStream, loadOptions))
                {
                    var worksheet = workbook.Worksheet(1); // Get first worksheet
                    var lastRowUsed = worksheet.LastRowUsed()?.RowNumber() ?? 1;

                    for (int row = 2; row <= lastRowUsed; row++)
                    {
                        try
                        {
                            var soThe = worksheet.Cell(row, 6).GetString().Trim(); // Column F - SoThe

                            // Skip empty rows
                            if (string.IsNullOrWhiteSpace(soThe))
                            {
                                continue;
                            }

                            // Validate required fields
                            if (string.IsNullOrWhiteSpace(soThe))
                            {
                                errors.Add($"Row {row}: SoThe is required");
                                continue;
                            }

                            // Validate SoThe format: should contain at least 3 parts separated by " - "
                            var sotheParts = soThe.Split(" - ");
                            if (sotheParts.Length < 4)
                            {
                                errors.Add($"Row {row}: SoThe format is invalid. Expected format: 'VS - 9465 - TPB - NGO XUAN BAO'");
                                continue;
                            }

                            // Check if Card already exists
                            var existingCard = await _repository.GetAsync<Card>(x => x.SoThe.Equals(soThe));

                            if (existingCard != null)
                            {
                                errors.Add($"Row {row}: Card with SoThe '{soThe}' already exists");
                                continue;
                            }

                            var card = new Card
                            {
                                Id = Guid.NewGuid(),
                                SoThe = soThe,
                                CreatedTime = DateTime.UtcNow,
                                ModifiedTime = DateTime.UtcNow
                            };

                            cards.Add(card);
                        }
                        catch (Exception ex)
                        {
                            errors.Add($"Row {row}: Error processing row - {ex.Message}");
                        }
                    }
                }

                if (cards.Any())
                {
                    await _repository.AddRangeAsync(cards, true);
                }

                var message = $"Successfully processed {cards.Count} records";
                if (errors.Any())
                {
                    message += $". {errors.Count} errors: " + string.Join("; ", errors.Take(5));
                    if (errors.Count > 5)
                    {
                        message += $" and {errors.Count - 5} more errors.";
                    }
                }

                return (true, message, cards.Count);
            }
            catch (Exception ex)
            {
                return (false, $"Error processing file: {ex.Message}", 0);
            }
        }
    }
}