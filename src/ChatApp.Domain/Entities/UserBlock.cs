using ChatApp.Domain.Common;

namespace ChatApp.Domain.Entities;

public sealed class UserBlock : BaseEntity
{
    private UserBlock()
    {
    }

    public Guid BlockerUserId { get; private set; }
    public Guid BlockedUserId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static UserBlock Create(Guid blockerUserId, Guid blockedUserId)
    {
        return new UserBlock
        {
            BlockerUserId = blockerUserId,
            BlockedUserId = blockedUserId,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
