using System.Security.Claims;

namespace WebTicket.Common
{
    public static class HttpContextExtension
    {
        public static Guid GetUserId(this HttpContext httpContext)
        {
            Guid userId = Guid.Empty;
            if (httpContext != null && httpContext.User != null)
            {
                if (httpContext.User.Identity.IsAuthenticated)
                {
                    var useridClaim = httpContext.User.Claims.FirstOrDefault(c => c.Type.Equals(ClaimTypes.NameIdentifier));
                    if (useridClaim != null)
                    {
                        Guid.TryParse(useridClaim.Value, out userId);
                    }
                }
            }
            return userId;
        }
    }
}
