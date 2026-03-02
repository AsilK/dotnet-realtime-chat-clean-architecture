using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;

namespace ChatApp.Application.Common.Interfaces;

public interface IChatRoomRepository : IBaseRepository<ChatRoom>
{
    Task<ChatRoom?> GetByIdReadOnlyAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PaginatedList<ChatRoom>> GetUserRoomsAsync(Guid userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ChatRoomMember>> GetRoomMembersAsync(Guid roomId, CancellationToken cancellationToken = default);
    Task<bool> IsMemberAsync(Guid roomId, Guid userId, CancellationToken cancellationToken = default);
    Task<ChatRoomMember?> GetMemberAsync(Guid roomId, Guid userId, CancellationToken cancellationToken = default);
}
