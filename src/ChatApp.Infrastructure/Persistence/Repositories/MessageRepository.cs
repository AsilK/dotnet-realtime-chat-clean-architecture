using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public sealed class MessageRepository : BaseRepository<Message>, IMessageRepository
{
    private const int MaxPageSize = 100;

    public MessageRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override Task<Message?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return DbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PaginatedList<Message>> GetRoomMessagesAsync(Guid roomId, int pageNumber, int pageSize, Guid? beforeMessageId = null, CancellationToken cancellationToken = default)
    {
        var effectivePageNumber = Math.Max(pageNumber, 1);
        pageNumber = Math.Max(pageNumber, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = DbSet
            .AsNoTracking()
            .Where(x => x.ChatRoomId == roomId)
            .OrderByDescending(x => x.CreatedAtUtc);
        var cursorApplied = false;

        if (beforeMessageId.HasValue)
        {
            var cursorCreatedAt = await DbSet
                .AsNoTracking()
                .Where(x => x.Id == beforeMessageId.Value && x.ChatRoomId == roomId)
                .Select(x => (DateTime?)x.CreatedAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (cursorCreatedAt.HasValue)
            {
                query = query.Where(x => x.CreatedAtUtc < cursorCreatedAt.Value)
                    .OrderByDescending(x => x.CreatedAtUtc);
                effectivePageNumber = 1;
                cursorApplied = true;
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var itemsQuery = query.Take(pageSize);
        if (!cursorApplied)
        {
            itemsQuery = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);
        }

        var items = await itemsQuery.ToListAsync(cancellationToken);

        return new PaginatedList<Message>(items, effectivePageNumber, pageSize, totalCount);
    }

    public async Task<PaginatedList<Message>> SearchMessagesAsync(Guid roomId, string term, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(pageNumber, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var normalizedTerm = term.Trim();
        var query = DbSet
            .AsNoTracking()
            .Where(x => x.ChatRoomId == roomId && EF.Functions.ILike(x.Content, $"%{normalizedTerm}%"))
            .OrderByDescending(x => x.CreatedAtUtc);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<Message>(items, pageNumber, pageSize, totalCount);
    }
}
