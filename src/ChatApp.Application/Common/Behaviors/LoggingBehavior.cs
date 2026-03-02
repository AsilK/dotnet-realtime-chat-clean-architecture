using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Application.Common.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        _logger.LogDebug("Handling request {RequestName}", typeof(TRequest).Name);
        var response = await next();
        _logger.LogDebug("Handled request {RequestName}", typeof(TRequest).Name);

        return response;
    }
}
