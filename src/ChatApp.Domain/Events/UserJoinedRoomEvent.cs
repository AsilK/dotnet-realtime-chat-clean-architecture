using ChatApp.Domain.Common;

namespace ChatApp.Domain.Events;

public sealed class UserJoinedRoomEvent : IDomainEvent
{
    public UserJoinedRoomEvent(Guid roomId, Guid userId)
    {
        RoomId = roomId;
        UserId = userId;
    }

    public Guid RoomId { get; }
    public Guid UserId { get; }
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}
