namespace WebTicket
{
    public static class ServiceExtension
    {
        public static IServiceCollection ConfigureCORS(this IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy(name: "AllowedCorsOrigins",
                        builder =>
                        {
                            builder
                                .WithOrigins("http://localhost:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                        });
            });
            return services;
        }

        private static bool IsOriginAllowed(string origin)
        {
            var uri = new Uri(origin);
            var env = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "n/a";

            var isAllowed = uri.Host.Equals("example.com", StringComparison.OrdinalIgnoreCase)
                            || uri.Host.Equals("another-example.com", StringComparison.OrdinalIgnoreCase)
                            || uri.Host.EndsWith(".example.com", StringComparison.OrdinalIgnoreCase)
                            || uri.Host.EndsWith(".another-example.com", StringComparison.OrdinalIgnoreCase);
            //if (!isAllowed && env.Contains("DEV", StringComparison.OrdinalIgnoreCase))
            if (!isAllowed)
                isAllowed = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase);
            return isAllowed;
        }

    }
}
