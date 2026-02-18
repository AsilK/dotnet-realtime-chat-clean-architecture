using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public sealed class ChatRoomMember : BaseEntity
{
    private ChatRoomMember()
    {
    }

    public Guid ChatRoomId { get; private set; }
    public Guid UserId { get; private set; }
    public MemberRole Role { get; private set; }
    public DateTime JoinedAtUtc { get; private set; }
    public bool IsBanned { get; private set; }

    public static ChatRoomMember Create(Guid chatRoomId, Guid userId, MemberRole role)
    {
        return new ChatRoomMember
        {
            ChatRoomId = chatRoomId,
            UserId = userId,
            Role = role,
            JoinedAtUtc = DateTime.UtcNow,
            IsBanned = false
        };
    }

    public void Promote(MemberRole role)
    {
        Role = role;
    }

    public void Ban()
    {
        IsBanned = true;
    }

    public void Unban()
    {
        IsBanned = false;
    }
}
