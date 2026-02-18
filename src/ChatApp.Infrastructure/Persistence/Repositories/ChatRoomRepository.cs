using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public sealed class ChatRoomRepository : BaseRepository<ChatRoom>, IChatRoomRepository
{
    public ChatRoomRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override Task<ChatRoom?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return DbSet
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PaginatedList<ChatRoom>> GetUserRoomsAsync(Guid userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = from room in Context.ChatRoomsSet
                    join member in Context.ChatRoomMembersSet on room.Id equals member.ChatRoomId
                    where member.UserId == userId && !member.IsBanned
                    select room;

        var totalCount = await query.CountAsync(cancellationToken);
        var rooms = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<ChatRoom>(rooms, pageNumber, pageSize, totalCount);
    }

    public Task<bool> IsMemberAsync(Guid roomId, Guid userId, CancellationToken cancellationToken = default)
    {
        return Context.ChatRoomMembersSet.AnyAsync(x => x.ChatRoomId == roomId && x.UserId == userId && !x.IsBanned, cancellationToken);
    }

    public Task<ChatRoomMember?> GetMemberAsync(Guid roomId, Guid userId, CancellationToken cancellationToken = default)
    {
        return Context.ChatRoomMembersSet.FirstOrDefaultAsync(x => x.ChatRoomId == roomId && x.UserId == userId, cancellationToken);
    }
}
