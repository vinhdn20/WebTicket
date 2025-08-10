using Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services.Interfaces
{
    public interface IAGCustomerService : IBasicOperationService<AGCustomer>
    {
        Task<(bool Success, string Message, int ProcessedCount)> ImportFromExcelAsync(Stream fileStream, string fileName);
    }
}
