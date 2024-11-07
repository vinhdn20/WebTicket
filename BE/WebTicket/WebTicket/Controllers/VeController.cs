// Import required modules
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Repositories;
using Repositories.Entities;

namespace Ve.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class VeController : ControllerBase
    {
        private readonly WebTicketDbContext _context;

        public VeController(WebTicketDbContext context)
        {
            _context = context;
        }

        [HttpPost("xuatVe")]
        public async Task<IActionResult> CreateTicket([FromBody] ThongTinVe ticketInfo)
        {
            if (ticketInfo == null || string.IsNullOrEmpty(ticketInfo.ChangDi) ||
                string.IsNullOrEmpty(ticketInfo.ChangVe) ||
                string.IsNullOrEmpty(ticketInfo.MaDatChoHang) ||
                ticketInfo.NgayGioBayDi == default ||
                ticketInfo.NgayGioBayDen == default)
            {
                return BadRequest("Missing required fields");
            }

            try
            {
                _context.ThongTinVes.Add(ticketInfo);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(CreateTicket), new { id = ticketInfo.Id }, ticketInfo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Server error: " + ex.Message);
            }
        }

        [HttpGet("bangVe")]
        public async Task<IActionResult> GetTickets()
        {
            try
            {
                var tickets = await _context.ThongTinVes.ToListAsync();
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Server error: " + ex.Message);
            }
        }
    }
}