using Microsoft.AspNetCore.Mvc;
using Repositories.Entities;
using Repositories.Interfaces;
using WebTicket.Common;

namespace WebTicket.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class APIBaseController : Controller
    {
        protected internal readonly HttpContext _httpContext;
        protected readonly IDBRepository _repository;
        public APIBaseController(IHttpContextAccessor accessor, IDBRepository repository)
        {
            _httpContext = accessor.HttpContext;
            _repository = repository;
        }

        protected T InitCreationInfo<T>(T entity) where T : BaseEntity
        {
            entity.CreatedTime = DateTime.UtcNow;
            entity.ModifiedTime = entity.CreatedTime;
            entity.CreatedById = _httpContext.GetUserId();
            entity.ModifiedById = entity.CreatedById;
            return entity;
        }
        protected T InitUpdateInfo<T>(T entity) where T : BaseEntity
        {
            entity.ModifiedTime = DateTime.UtcNow;
            entity.ModifiedById = _httpContext.GetUserId();
            return entity;
        }
    }
}
