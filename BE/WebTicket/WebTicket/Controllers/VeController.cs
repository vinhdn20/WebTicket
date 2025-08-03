// Import required modules
using Common;
using Mapster;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
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
        public async Task<IActionResult> CreateTicket([FromBody] AddVe addModel)
        {


            try
            {
                var ticketInfo = addModel.Adapt<ThongTinVe>();
                ticketInfo.VeDetail = addModel.VeDetails.Adapt<List<VeDetail>>();
                ticketInfo = InitCreationInfo(ticketInfo);

                var addTicket = ticketInfo.DeepCopy();
                _context.ThongTinVes.Add(addTicket);

                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(CreateTicket), new { ticketInfo });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Server error: " + ex.Message);
            }
        }

        [HttpPut("xuatve")]
        [Authorize]
        public async Task<IActionResult> UpdateTicket([FromBody] List<UpdateVe> putModels)
        {
            try
            {
                foreach (var putModel in putModels)
                {
                    var ticketInfo = putModel.Adapt<ThongTinVe>();
                    ticketInfo = InitUpdateInfo(ticketInfo);
                    var updateTicket = ticketInfo.DeepCopy();
                    _context.ThongTinVes.Update(updateTicket);
                }
                await _repository.SaveChangesAsync();
                return Ok(putModels);
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
        [HttpGet("card")]
        [Authorize]
        public async Task<IActionResult> GetCardInfo(string? soThe)
        {
            try
            {
                if (string.IsNullOrEmpty(soThe))
                {
                    var result = await _repository.Context.Cards.ToListAsync();
                    return Ok(result);
                }
                else
                {
                    var result = await _repository.GetAllWithAsync<Card>(x => x.SoThe.Contains(soThe));
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

        //[HttpGet("ag/{cardNumber}")]
        //[Authorize]
        //public async Task<IActionResult> GetCardInfo(string cardNumber)
        //{
        //    try
        //    {
        //        var result = await _repository.GetAllWithAsync<Card>(x => x.SoThe.Contains(cardNumber));
        //        return Ok(result);
        //    }
        //    catch (Exception ex)
        //    {
        //        return BadRequest("Server error: " + ex.Message);
        //    }
        //}

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