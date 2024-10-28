using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repositories.Interfaces;
using Services.Models;
using Services.Services.Interfaces;

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

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginModel model)
        {
            try
            {
                var token = _userService.LoginAsync(model);
                return Ok(token);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}
