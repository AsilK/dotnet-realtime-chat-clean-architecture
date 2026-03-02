using System.Security.Claims;
using System.Threading.RateLimiting;
using ChatApp.API.Hubs;
using ChatApp.Application;
using ChatApp.Infrastructure;
using Microsoft.AspNetCore.Http;
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
            options.OnRejected = static (context, _) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                return ValueTask.CompletedTask;
            };

            options.AddPolicy("auth", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetRateLimitPartitionKey(context, "auth"),
                    factory: static _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                    }));

            options.AddPolicy("api", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetRateLimitPartitionKey(context, "api"),
                    factory: static _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                    }));
        });

        services.AddHealthChecks();

        return services;
    }

    private static string GetRateLimitPartitionKey(HttpContext context, string policyName)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(userId))
        {
            return $"{policyName}:user:{userId}";
        }

        var forwardedFor = context.Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            var firstIp = forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(firstIp))
            {
                return $"{policyName}:ip:{firstIp}";
            }
        }

        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return $"{policyName}:ip:{ip}";
    }
}
