namespace ChatApp.Application.Common.Interfaces;

public interface IEmailDispatchQueue
{
    ValueTask QueueAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
