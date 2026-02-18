using ChatApp.Domain.Entities;

namespace ChatApp.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    IQueryable<User> Users { get; }
    IQueryable<ChatRoom> ChatRooms { get; }
    IQueryable<ChatRoomMember> ChatRoomMembers { get; }
    IQueryable<Message> Messages { get; }
    IQueryable<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
