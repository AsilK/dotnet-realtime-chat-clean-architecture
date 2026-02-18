using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;
using ChatApp.Domain.Events;
using ChatApp.Domain.Exceptions;

namespace ChatApp.Domain.Entities;

public sealed class Message : AuditableEntity
{
    private readonly List<MessageReaction> _reactions = new();

    private Message()
    {
    }

    public Guid Id { get; private set; }
    public Guid ChatRoomId { get; private set; }
    public Guid SenderId { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public MessageType Type { get; private set; }
    public Guid? ReplyToMessageId { get; private set; }
    public bool IsEdited { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? EditedAtUtc { get; private set; }

    public IReadOnlyCollection<MessageReaction> Reactions => _reactions.AsReadOnly();

    public static Message Create(Guid chatRoomId, Guid senderId, string content, MessageType type)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new DomainException("Message content cannot be empty.");
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ChatRoomId = chatRoomId,
            SenderId = senderId,
            Content = content.Trim(),
            Type = type,
            IsEdited = false,
            IsDeleted = false
        };

        message.AddDomainEvent(new MessageSentEvent(message));
        return message;
    }

    public void SetReplyTo(Guid replyToMessageId)
    {
        ReplyToMessageId = replyToMessageId;
    }

    public void Edit(string newContent, DateTime nowUtc)
    {
        if (IsDeleted)
        {
            throw new DomainException("Cannot edit a deleted message.");
        }

        if (string.IsNullOrWhiteSpace(newContent))
        {
            throw new DomainException("Message content cannot be empty.");
        }

        Content = newContent.Trim();
        IsEdited = true;
        EditedAtUtc = nowUtc;
    }

    public void Delete()
    {
        IsDeleted = true;
        Content = "[Message deleted]";
    }

    public void AddReaction(Guid userId, string emoji)
    {
        if (_reactions.Any(x => x.UserId == userId && x.Emoji == emoji))
        {
            return;
        }

        _reactions.Add(MessageReaction.Create(Id, userId, emoji));
    }

    public void RemoveReaction(Guid userId, string emoji)
    {
        var reaction = _reactions.FirstOrDefault(x => x.UserId == userId && x.Emoji == emoji);
        if (reaction is not null)
        {
            _reactions.Remove(reaction);
        }
    }
}
