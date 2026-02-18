using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public sealed class MessageRepository : BaseRepository<Message>, IMessageRepository
{
    public MessageRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override Task<Message?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return DbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PaginatedList<Message>> GetRoomMessagesAsync(Guid roomId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = DbSet.Where(x => x.ChatRoomId == roomId).OrderByDescending(x => x.CreatedAtUtc);
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<Message>(items, pageNumber, pageSize, totalCount);
    }

    public async Task<PaginatedList<Message>> SearchMessagesAsync(Guid roomId, string term, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = DbSet
            .Where(x => x.ChatRoomId == roomId && x.Content.Contains(term))
            .OrderByDescending(x => x.CreatedAtUtc);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<Message>(items, pageNumber, pageSize, totalCount);
    }
}
