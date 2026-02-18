using ChatApp.Domain.Common;
using ChatApp.Domain.Exceptions;

namespace ChatApp.Domain.Entities;

public sealed class MessageReaction : BaseEntity
{
    private MessageReaction()
    {
    }

    public Guid MessageId { get; private set; }
    public Guid UserId { get; private set; }
    public string Emoji { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    public static MessageReaction Create(Guid messageId, Guid userId, string emoji)
    {
        if (string.IsNullOrWhiteSpace(emoji))
        {
            throw new DomainException("Emoji is required.");
        }

        return new MessageReaction
        {
            MessageId = messageId,
            UserId = userId,
            Emoji = emoji.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
