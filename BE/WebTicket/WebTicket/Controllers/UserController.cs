using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Models;
using Services.Services.Interfaces;
using System.Security.Claims;

namespace WebTicket.Controllers
{
    public class UserController : Controller
    {
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;
        private readonly IDBRepository _repository;


        public UserController(IConfiguration configuration, IDBRepository repository,
                                   IUserService userService)
        {
            _configuration = configuration;
            _userService = userService;
            _repository = repository;
        }

        [HttpPost("add")]
        [AllowAnonymous]
        public async Task<IActionResult> AddUser([FromBody] AddUser model)
        {
            try
            {
                var id = Guid.NewGuid();
                var token = await _userService.AddAsync(new Repositories.Entities.Users
                {
                    Id = id,
                    Email = model.Email,
                    Password = model.Password,
                    CreatedById = id,
                    CreatedTime = DateTime.UtcNow,
                    ModifiedById = id,
                    ModifiedTime = DateTime.UtcNow
                });

                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> LoginAsync([FromBody] LoginModel model)
        {
            try
            {
                var token = await _userService.LoginAsync(model);
                SetRefreshTokenCookie(token.refreshToken);

                return Ok(new { accessToken = token.token });
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("logout")]
        [Authorize]
        public async Task<IActionResult> LoginOutAsync()
        {
            try
            {
                var userIdClaim = new Guid(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                await _userService.LogoutAsync(userIdClaim);

                return Ok();
            }
            catch (Exception e)
            {
                return BadRequest();
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized("No refresh token provided.");
            }

            var tokens = await _userService.GetNewByRefreshToken(refreshToken);

            if(string.IsNullOrEmpty(tokens.token) || string.IsNullOrEmpty(tokens.refreshToken))
            {
                return Unauthorized("Invalid or expired refresh token.");
            }

            SetRefreshTokenCookie(tokens.refreshToken);

            return Ok(new { accessToken = tokens.token });
        }

        [HttpGet("test")]
        [Authorize]
        public IActionResult TestLogin()
        {
            return Ok();
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var isHaveValidTIme = int.TryParse(_configuration["Jwt:ValidTimeRF"], out int validTime);
            if (!isHaveValidTIme)
            {
                validTime = 5;
            }
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Use Secure = true in production
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(validTime)
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}
