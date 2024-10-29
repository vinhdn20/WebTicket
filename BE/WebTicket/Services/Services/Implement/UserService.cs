using Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Models;
using Services.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
        public async Task<(string token, string refreshToken)> LoginAsync(LoginModel loginModel)
        {
            //string hashPass = loginModel.Password.HashForPassword();
            var account = await _repository.GetAsync<Users>(x => x.Email.Equals(loginModel.Email) && x.Password.Equals(loginModel.Password));

            var token = GenerateToken(account);
            var refreshToken = GenerateRefreshToken();

            await UpdateRFTokenAsync(account.Id, refreshToken);
            return (token, refreshToken);
        }

        private string GenerateToken(Users user)
        {
            var userReturn = new
            {
                Id = user.Id,
                Email = user.Email,
            };
            var claims = new[]
                    {
                        //new Claim(JwtRegisteredClaimNames.Sub, JsonConvert.SerializeObject(userReturn)),
                        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
                    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var isHaveValidTIme = int.TryParse(_configuration["Jwt:ValidTime"], out int validTime);
            if (!isHaveValidTIme)
            {
                validTime = 5;
            }
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(validTime),
                signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<(string token, string refreshToken)> GetNewByRefreshToken(string refreshToken)
        {
            // Query the UserTokens table to find a non-revoked, non-expired refresh token
            var userToken = await _repository.GetAsync<UserTokens>(token =>
                token.RefreshToken == refreshToken &&
                token.IsRevoked == false &&
                token.ExpiryDate > DateTime.UtcNow);

            // If no valid token is found, return null
            if (userToken == null)
            {
                return ("","");
            }

            var token = GenerateToken(userToken.Users);
            var newRefreshToken = GenerateRefreshToken();

            await UpdateRFTokenAsync(userToken.UserId, newRefreshToken);
            return (token, newRefreshToken);
        }

        public async Task LogoutAsync(Guid userId)
        {
            // Retrieve the token entry based on userId and the provided refresh token
            var userToken = await _repository.GetAllWithNoTrackingAsync<UserTokens>(token => token.UserId == userId).ToListAsync();

            foreach (var token in userToken)
            {
                token.ModifiedTime = DateTime.UtcNow;
                token.IsRevoked = true;
            }

            // Save the updated token information
            await _repository.UpdateRangeAsync(userToken, true);
        }


        private string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

        private async Task UpdateRFTokenAsync(Guid userId, string refreshToken)
        {
            var listOldToken = await _repository.GetAllWithNoTrackingAsync<UserTokens>(x => x.UserId == userId).ToListAsync();
            foreach (var token in listOldToken)
            {
                token.IsRevoked = true;
            }

            if(listOldToken.Count > 0)
                await _repository.UpdateRangeAsync<UserTokens>(listOldToken);

            var isHaveValidTIme = int.TryParse(_configuration["Jwt:ValidTimeRF"], out int validTime);
            if (!isHaveValidTIme)
            {
                validTime = 5;
            }
            await _repository.AddAsync<UserTokens>(new UserTokens
            {
                UserId = userId,
                IsRevoked = false,
                RefreshToken = refreshToken,
                ExpiryDate = DateTime.UtcNow.AddHours(validTime),
                CreatedById = userId,
                CreatedTime = DateTime.UtcNow,
                ModifiedById = userId,
                ModifiedTime = DateTime.UtcNow
            });
            await _repository.SaveChangesAsync();
        }
    }
}
