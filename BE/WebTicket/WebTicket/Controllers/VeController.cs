// Import required modules
using Common;
using Mapster;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;
using Repositories.Interfaces;
using Repositories.Models;
using Services.Services.Interfaces;
using WebTicket.Controllers;
using WebTicket.Models;

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
        [Authorize]
        public async Task<IActionResult> CreateTicket([FromBody] List<AddVe> addModel)
        {


            try
            {
                var ticketInfos = addModel.Adapt<List<ThongTinVe>>();
                for (int i = 0; i < ticketInfos.Count; i++)
                {
                    var ticketInfo = ticketInfos[i];
                    if (ticketInfo == null || string.IsNullOrEmpty(ticketInfo.ChangDi) ||
                    string.IsNullOrEmpty(ticketInfo.ChangVe) ||
                    string.IsNullOrEmpty(ticketInfo.MaDatChoHang) ||
                    ticketInfo.NgayGioBayDi == default ||
                    ticketInfo.NgayGioBayDen == default)
                    {
                        return BadRequest("Missing required fields");
                    }
                    ticketInfo = InitCreationInfo(ticketInfo);

                    var card = await _repository.GetAsync<Card>(x => x.SoThe.Equals(ticketInfo.Card.SoThe));
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

                    var customer = await _repository.GetAsync<Customer>(x => x.GioiTinh.Equals(ticketInfo.Customer.GioiTinh)
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
                }

                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(CreateTicket), new { ticketInfos });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Server error: " + ex.Message);
            }
        }

        [HttpPut("xuatve")]
        [Authorize]
        public async Task<IActionResult> UpdateTicket([FromBody] List<AddVe> putModel)
        {
            try
            {
                var ticketInfos = putModel.Adapt<List<ThongTinVe>>();
                for (int i = 0; i < ticketInfos.Count; i++)
                {
                    var ticketInfo = ticketInfos[i];
                    if (ticketInfo == null || string.IsNullOrEmpty(ticketInfo.ChangDi) ||
                    string.IsNullOrEmpty(ticketInfo.ChangVe) ||
                    string.IsNullOrEmpty(ticketInfo.MaDatChoHang) ||
                    ticketInfo.NgayGioBayDi == default ||
                    ticketInfo.NgayGioBayDen == default)
                    {
                        return BadRequest("Missing required fields");
                    }
                    ticketInfo = InitUpdateInfo(ticketInfo);
                    var card = await _repository.GetAsync<Card>(x => x.SoThe.Equals(ticketInfo.Card.SoThe));
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

                    var customer = await _repository.GetAsync<Customer>(x => x.GioiTinh.Equals(ticketInfo.Customer.GioiTinh)
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

                    var updateTicket = ticketInfo.DeepCopy();
                    updateTicket.Customer = null;
                    updateTicket.AGCustomer = null;
                    updateTicket.Card = null;
                    _context.ThongTinVes.Update(updateTicket);
                }
                await _repository.SaveChangesAsync();
                return Ok(ticketInfos);
            }
            catch (Exception ex)
            {
                return BadRequest("Server error:" + ex.ToString());
            }
        }

        [HttpDelete("xuatve")]
        public async Task<IActionResult> DeleteTicket([FromBody] List<Guid> deleteIds)
        {
            try
            {
                var deletes = await _repository.GetAllWithAsync<ThongTinVe>(x => deleteIds.Contains(x.Id));
                await _repository.DeleteRangeAsync(deletes, true);
                return Ok(deletes);
            }
            catch (Exception e)
            {
                return BadRequest("Server error:" + e.ToString());
            }
        }

        [HttpGet("bangVe")]
        [Authorize]
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
        [Authorize]
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

        [HttpPost("ag")]
        [Authorize]
        public async Task<IActionResult> AddAg(List<AGCustomer> customer)
        {
            try
            {
                customer.ForEach(x => x.Id = Guid.NewGuid());
                var result = await _repository.AddRangeAsync(customer, true);
                return Ok(customer);
            }
            catch (Exception ex)
            {
                return BadRequest("Server error: " + ex.Message);
            }
        }

        [HttpDelete("ag")]
        [Authorize]
        public async Task<IActionResult> DeleteAg(List<Guid> customer)
        {
            try
            {
                var customers = await _repository.GetAllWithNoTrackingAsync<AGCustomer>(x => customer.Contains(x.Id)).ToListAsync();
                var result = await _repository.DeleteRangeAsync(customers, true);
                return Ok(customer);
            }
            catch (Exception ex)
            {
                return BadRequest("Server error: " + ex.Message);
            }
        }

        [HttpGet("ag")]
        [Authorize]
        public async Task<IActionResult> GetAGInfo(string? sdt)
        {
            try
            {
                if (string.IsNullOrEmpty(sdt))
                {
                    var result = await _repository.Context.AgCustomers.ToListAsync();
                    return Ok(result);
                }
                else
                {
                    var result = await _repository.GetAllWithAsync<AGCustomer>(x => x.SDT.Contains(sdt));
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return BadRequest("Server error: " + ex.Message);
            }
        }

        [HttpPost("card")]
        [Authorize]
        public async Task<IActionResult> AddAg(List<Card> card)
        {
            try
            {
                card.ForEach(x => x.Id = Guid.NewGuid());
                var result = await _repository.AddRangeAsync(card, true);
                return Ok(card);
            }
            catch (Exception ex)
            {
                return BadRequest("Server error: " + ex.Message);
            }
        }

        [HttpGet("ag/{cardNumber}")]
        [Authorize]
        public async Task<IActionResult> GetCardInfo(string cardNumber)
        {
            try
            {
                var result = await _repository.GetAllWithAsync<Card>(x => x.SoThe.Contains(cardNumber));
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest("Server error: " + ex.Message);
            }
        }

        [HttpDelete("card")]
        [Authorize]
        public async Task<IActionResult> GetCardInfo(List<Guid> cardIds)
        {
            try
            {
                var result = await _repository.GetAllWithAsync<Card>(x => cardIds.Contains(x.Id));
                await _repository.DeleteRangeAsync(result, true);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest("Server error: " + ex.Message);
            }
        }
    }
}