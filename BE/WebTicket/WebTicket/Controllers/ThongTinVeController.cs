using Microsoft.AspNetCore.Mvc;

namespace WebTicket.Controllers
{
    public class ThongTinVeController : Controller
    {
        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }
    }
}
