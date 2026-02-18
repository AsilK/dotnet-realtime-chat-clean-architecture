using System.Threading.RateLimiting;
using ChatApp.API.Hubs;
using ChatApp.Application;
using ChatApp.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;

namespace ChatApp.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddApplication();
        services.AddInfrastructure(configuration);

        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        var redisConnection = configuration["Redis:ConnectionString"] ?? "localhost:6379,abortConnect=false";
        services.AddMemoryCache();
        services.AddSingleton<Microsoft.AspNetCore.SignalR.IHubFilter, MessageRateLimitingHubFilter>();
        services.AddSignalR().AddStackExchangeRedis(redisConnection);

        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCors", builder =>
            {
                builder.AllowAnyHeader().AllowAnyMethod().AllowCredentials().SetIsOriginAllowed(_ => true);
            });
        });

        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter("auth", limiter =>
            {
                limiter.PermitLimit = 5;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueLimit = 0;
                limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            });

            options.AddFixedWindowLimiter("api", limiter =>
            {
                limiter.PermitLimit = 100;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueLimit = 0;
                limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            });
        });

        services.AddHealthChecks();

        return services;
    }
}
