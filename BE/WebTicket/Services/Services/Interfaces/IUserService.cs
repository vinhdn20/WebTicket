using Repositories.Entities;
using Services.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services.Interfaces
{
    public interface IUserService : IBasicOperationService<Users>
    {
        Task<(string token, string refreshToken)> LoginAsync(LoginModel loginModel);
        Task<(string token, string refreshToken)> GetNewByRefreshToken(string refreshToken);
        Task LogoutAsync(Guid userId);
    }
}
