using System.Threading.Channels;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace ChatApp.Infrastructure.Services;

public sealed class EmailDispatchQueue : IEmailDispatchQueue
{
    private readonly Channel<EmailWorkItem> _channel;

    public EmailDispatchQueue(IOptions<EmailQueueOptions> options)
    {
        var configuredCapacity = options.Value.Capacity;
        var capacity = configuredCapacity <= 0 ? 1000 : configuredCapacity;

        _channel = Channel.CreateBounded<EmailWorkItem>(new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });
    }

    public ValueTask QueueAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(new EmailWorkItem(to, subject, htmlBody), cancellationToken);
    }

    public IAsyncEnumerable<EmailWorkItem> ReadAllAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }

    public readonly record struct EmailWorkItem(string To, string Subject, string HtmlBody);
}
