using Common;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Models;
using Services.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Services.Services.Implement
{
    public class UserService : BasicOperationService<Users>, IUserService
    {
        private readonly IConfiguration _configuration;
        public UserService(IDBRepository repository,
                            IConfiguration configuration) : base(repository)
        {
            _configuration = configuration;
        }
        public async Task<string> LoginAsync(LoginModel loginModel)
        {
            string hashPass = loginModel.Password.HashForPassword();
            var account = await _repository.GetAsync<Users>(x => x.Email.Equals(loginModel.Email) && x.Password.Equals(hashPass));

            var token = GenerateToken(loginModel.Email);
            return token;
        }

        private string GenerateToken(string email)
        {
            var claims = new[]
                    {
                        new Claim(JwtRegisteredClaimNames.Sub, email),
                        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
