using ChatApp.Infrastructure.Options;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ChatApp.Infrastructure.Services;

public sealed class RefreshTokenCleanupBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefreshTokenCleanupBackgroundService> _logger;
    private readonly RefreshTokenCleanupOptions _options;

    public RefreshTokenCleanupBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<RefreshTokenCleanupOptions> options,
        ILogger<RefreshTokenCleanupBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Refresh token cleanup is disabled.");
            return;
        }

        await CleanupAsync(stoppingToken);

        var intervalHours = Math.Max(1, _options.IntervalHours);
        using var timer = new PeriodicTimer(TimeSpan.FromHours(intervalHours));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await CleanupAsync(stoppingToken);
        }
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoffUtc = DateTime.UtcNow.AddDays(-Math.Max(1, _options.RetentionDays));

            var deletedCount = await dbContext.RefreshTokensSet
                .Where(x => x.ExpiresAtUtc < cutoffUtc || (x.RevokedAtUtc.HasValue && x.RevokedAtUtc < cutoffUtc))
                .ExecuteDeleteAsync(cancellationToken);

            if (deletedCount > 0)
            {
                _logger.LogInformation("Refresh token cleanup removed {DeletedCount} rows older than {CutoffUtc}", deletedCount, cutoffUtc);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Refresh token cleanup cycle failed.");
        }
    }
}
