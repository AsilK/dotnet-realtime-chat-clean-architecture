using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;

namespace ChatApp.API.Hubs;

public sealed class MessageRateLimitingHubFilter : IHubFilter
{
    private const int LimitPerMinute = 60;
    private readonly IMemoryCache _memoryCache;

    public MessageRateLimitingHubFilter(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext,
        Func<HubInvocationContext, ValueTask<object?>> next)
    {
        var method = invocationContext.HubMethodName;
        if (method is "SendTypingIndicator" or "MarkMessageAsRead")
        {
            var userId = invocationContext.Context.UserIdentifier ?? invocationContext.Context.ConnectionId;
            var key = $"hub-rate:{userId}:{DateTime.UtcNow:yyyyMMddHHmm}";

            var count = _memoryCache.GetOrCreate(key, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
                return 0;
            });

            if (count >= LimitPerMinute)
            {
                throw new HubException("Rate limit exceeded for hub messages.");
            }

            _memoryCache.Set(key, count + 1, TimeSpan.FromMinutes(1));
        }

        return await next(invocationContext);
    }
}
