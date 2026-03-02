using ChatApp.Application.Common.Interfaces;
using ChatApp.Infrastructure.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ChatApp.Infrastructure.Services;

public sealed class EmailDispatchBackgroundService : BackgroundService
{
    private readonly EmailDispatchQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailDispatchBackgroundService> _logger;
    private readonly EmailQueueOptions _options;

    public EmailDispatchBackgroundService(
        EmailDispatchQueue queue,
        IServiceScopeFactory scopeFactory,
        IOptions<EmailQueueOptions> options,
        ILogger<EmailDispatchBackgroundService> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var workItem in _queue.ReadAllAsync(stoppingToken))
        {
            await SendWithRetriesAsync(workItem, stoppingToken);
        }
    }

    private async Task SendWithRetriesAsync(EmailDispatchQueue.EmailWorkItem workItem, CancellationToken cancellationToken)
    {
        var maxAttempts = Math.Max(1, _options.MaxRetryAttempts);
        var baseDelayMs = Math.Max(100, _options.InitialRetryDelayMilliseconds);
        var timeoutSeconds = Math.Max(1, _options.SendTimeoutSeconds);

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

                using var scope = _scopeFactory.CreateScope();
                var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                await sender.SendAsync(workItem.To, workItem.Subject, workItem.HtmlBody, timeoutCts.Token);
                return;
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested && attempt < maxAttempts)
            {
                var delay = TimeSpan.FromMilliseconds(baseDelayMs * attempt + Random.Shared.Next(50, 250));
                _logger.LogWarning("Email send timed out for {To}; retry {Attempt}/{MaxAttempts} in {DelayMs}ms", workItem.To, attempt, maxAttempts, delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken);
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                var delay = TimeSpan.FromMilliseconds(baseDelayMs * attempt + Random.Shared.Next(50, 250));
                _logger.LogWarning(ex, "Email send failed for {To}; retry {Attempt}/{MaxAttempts} in {DelayMs}ms", workItem.To, attempt, maxAttempts, delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Email send permanently failed for {To} after {MaxAttempts} attempts", workItem.To, maxAttempts);
                return;
            }
        }
    }
}
