using Repositories.Entities;
using Repositories.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services.Interfaces
{
    public interface IVeService : IBasicOperationService<ThongTinVe>
    {
        Task<TableInfo<ThongTinVe>> Filter(TablePageParameter pageParameter);
    }
}
