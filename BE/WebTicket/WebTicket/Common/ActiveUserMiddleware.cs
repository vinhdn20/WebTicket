using Entities;
using Repositories.Interfaces;
using WebTicket.Common;

namespace WebTicket.Common
{
    public class ActiveUserMiddleware
    {
        private readonly RequestDelegate _next;

        public ActiveUserMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IDBRepository repository)
        {
            // Skip check for non-authenticated requests
            if (!context.User.Identity.IsAuthenticated)
            {
                await _next(context);
                return;
            }

            // Get user ID from token
            var userId = context.GetUserId();
            if (userId != Guid.Empty)
            {
                // Check if user is still active
                var user = await repository.GetAsync<Users>(u => u.Id == userId);
                if (user == null || !user.IsActive)
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("User account is inactive");
                    return;
                }
            }

            await _next(context);
        }
    }
}