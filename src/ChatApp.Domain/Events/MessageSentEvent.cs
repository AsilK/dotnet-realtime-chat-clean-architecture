using ChatApp.Domain.Common;
using ChatApp.Domain.Entities;

namespace ChatApp.Domain.Events;

public sealed class MessageSentEvent : IDomainEvent
{
    public MessageSentEvent(Message message)
    {
        Message = message;
    }

    public Message Message { get; }
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}
