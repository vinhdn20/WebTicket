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
    public class AGCustomerService : BasicOperationService<AGCustomer>, IAGCustomerService
    {
        public AGCustomerService(IDBRepository repository) : base(repository)
        {
        }

        public async Task<(bool Success, string Message, int ProcessedCount)> ImportFromExcelAsync(Stream fileStream, string fileName)
        {
            try
            {
                var agCustomers = new List<AGCustomer>();
                var errors = new List<string>();
                int rowNumber = 3; // Data starts from row 3

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
                    var lastRowUsed = worksheet.LastRowUsed()?.RowNumber() ?? 2;

                    for (int row = 3; row <= lastRowUsed; row++)
                    {
                        try
                        {
                            var mail = worksheet.Cell(row, 3).GetString().Trim(); // Column C
                            var tenAG = worksheet.Cell(row, 4).GetString().Trim(); // Column D  
                            var sdt = worksheet.Cell(row, 5).GetString().Trim(); // Column E

                            // Skip empty rows
                            if (string.IsNullOrWhiteSpace(mail) && string.IsNullOrWhiteSpace(tenAG) && string.IsNullOrWhiteSpace(sdt))
                            {
                                continue;
                            }

                            // Validate required fields
                            if (string.IsNullOrWhiteSpace(tenAG))
                            {
                                errors.Add($"Row {row}: TenAG is required");
                                continue;
                            }

                            //if (string.IsNullOrWhiteSpace(mail))
                            //{
                            //    errors.Add($"Row {row}: Mail is required");
                            //    continue;
                            //}

                            if (string.IsNullOrWhiteSpace(sdt))
                            {
                                errors.Add($"Row {row}: SDT is required");
                                continue;
                            }

                            // Check if AGCustomer already exists
                            var existingCustomer = await _repository.GetAsync<AGCustomer>(x => 
                                x.SDT.Equals(sdt) && x.Mail.Equals(mail ?? string.Empty) && x.TenAG.ToLower().Equals(tenAG.ToLower()));

                            if (existingCustomer != null)
                            {
                                errors.Add($"Row {row}: AGCustomer with SDT '{sdt}', Mail '{mail}', and TenAG '{tenAG}' already exists");
                                continue;
                            }

                            var agCustomer = new AGCustomer
                            {
                                Id = Guid.NewGuid(),
                                TenAG = tenAG,
                                Mail = mail ?? string.Empty,
                                SDT = sdt,
                                CreatedTime = DateTime.UtcNow,
                                ModifiedTime = DateTime.UtcNow
                            };

                            agCustomers.Add(agCustomer);
                        }
                        catch (Exception ex)
                        {
                            errors.Add($"Row {row}: Error processing row - {ex.Message}");
                        }
                    }
                }

                if (agCustomers.Any())
                {
                    await _repository.AddRangeAsync(agCustomers, true);
                }

                var message = $"Successfully processed {agCustomers.Count} records";
                if (errors.Any())
                {
                    message += $". {errors.Count} errors: " + string.Join("; ", errors.Take(5));
                    if (errors.Count > 5)
                    {
                        message += $" and {errors.Count - 5} more errors.";
                    }
                }

                return (true, message, agCustomers.Count);
            }
            catch (Exception ex)
            {
                return (false, $"Error processing file: {ex.Message}", 0);
            }
        }
    }
}
