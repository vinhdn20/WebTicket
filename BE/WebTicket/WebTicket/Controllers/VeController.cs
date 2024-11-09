// Import required modules
using Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;
using Repositories.Interfaces;
using Repositories.Models;
using Services.Services.Interfaces;
using WebTicket.Controllers;

namespace Ve.Controllers
{
    public class VeController : APIBaseController
    {
        private readonly WebTicketDbContext _context;
        private readonly IVeService _veService;

        public VeController(IHttpContextAccessor accessor,
            WebTicketDbContext context, IVeService veService,
            IDBRepository repository
            ) : base(accessor, repository)
        {
            _context = context;
            _veService = veService;
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
                ticketInfo = InitCreationInfo(ticketInfo);

                var card = await _repository.GetAsync<Card>(x => x.SoThe.Equals(ticketInfo.Card.SoThe) && x.TaiKhoan.ToLower().Equals(ticketInfo.Card.TaiKhoan.ToLower()));
                if (card is null)
                {
                    ticketInfo.Card = InitCreationInfo(ticketInfo.Card);
                    ticketInfo.Card.Id = Guid.NewGuid();
                    ticketInfo.CardId = ticketInfo.Card.Id;
                    _context.Cards.Add(ticketInfo.Card);
                }
                else
                {
                    ticketInfo.Card = card;
                    ticketInfo.CardId = card.Id;
                }

                var ag = await _repository.GetAsync<AGCustomer>(x => x.SDT.Equals(ticketInfo.AGCustomer.SDT) 
                                                                                && x.Mail.Equals(ticketInfo.AGCustomer.Mail)
                                                                                && x.TenAG.ToLower().Equals(ticketInfo.AGCustomer.TenAG.ToLower()));
                if (ag is null)
                {
                    ticketInfo.AGCustomer = InitCreationInfo(ticketInfo.AGCustomer);
                    ticketInfo.AGCustomer.Id = Guid.NewGuid();
                    ticketInfo.AGCustomerId = ticketInfo.AGCustomer.Id;
                    _context.AgCustomers.Add(ticketInfo.AGCustomer);
                }
                else
                {
                    ticketInfo.AGCustomer = ag;
                    ticketInfo.AGCustomerId = ag.Id;
                }

                var customer = await _repository.GetAsync<Customer>(x =>  x.GioiTinh.Equals(ticketInfo.Customer.GioiTinh)
                                                                                && x.TenKhachHang.ToLower().Equals(ticketInfo.Customer.TenKhachHang.ToLower()));
                if (customer is null)
                {
                    ticketInfo.Customer = InitCreationInfo(ticketInfo.Customer);
                    ticketInfo.Customer.Id = Guid.NewGuid();
                    ticketInfo.CustomerId = ticketInfo.Customer.Id;
                    _context.Customers.Add(ticketInfo.Customer);
                }
                else
                {
                    ticketInfo.Customer = customer;
                    ticketInfo.CustomerId = customer.Id;
                }

                var addTicket = ticketInfo.DeepCopy();
                addTicket.Customer = null;
                addTicket.AGCustomer = null;
                addTicket.Card = null;
                _context.ThongTinVes.Add(addTicket);
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

        [HttpPost("filter")]
        public async Task<IActionResult> Filter(TablePageParameter pageParameter)
        {
            try
            {
                var result = await _veService.Filter(pageParameter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest("Server error: " + ex.Message);
            }
        }
    }
}