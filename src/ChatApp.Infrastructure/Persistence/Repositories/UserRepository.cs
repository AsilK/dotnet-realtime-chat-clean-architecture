using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public sealed class UserRepository : BaseRepository<User>, IUserRepository
{
    private const int MaxPageSize = 100;

    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return DbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public Task<User?> GetByIdReadOnlyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return DbSet.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.ToLowerInvariant();
        return DbSet.FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);
    }

    public Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        return DbSet.FirstOrDefaultAsync(x => x.Username == username, cancellationToken);
    }

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.ToLowerInvariant();
        return DbSet.AnyAsync(x => x.Email == normalizedEmail, cancellationToken);
    }

    public Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        return DbSet.AnyAsync(x => x.Username == username, cancellationToken);
    }

    public async Task<PaginatedList<User>> SearchAsync(string? term, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(pageNumber, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = DbSet.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var normalizedTerm = term.Trim();
            query = query.Where(x =>
                EF.Functions.ILike(x.Username, $"%{normalizedTerm}%") ||
                EF.Functions.ILike(x.DisplayName, $"%{normalizedTerm}%") ||
                EF.Functions.ILike(x.Email, $"%{normalizedTerm}%"));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.Username)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<User>(items, pageNumber, pageSize, totalCount);
    }

    public Task<bool> IsBlockedAsync(Guid blockerUserId, Guid blockedUserId, CancellationToken cancellationToken = default)
    {
        return Context.UserBlocksSet.AnyAsync(x => x.BlockerUserId == blockerUserId && x.BlockedUserId == blockedUserId, cancellationToken);
    }

    public Task AddBlockAsync(UserBlock block, CancellationToken cancellationToken = default)
    {
        return Context.UserBlocksSet.AddAsync(block, cancellationToken).AsTask();
    }

    public async Task RemoveBlockAsync(Guid blockerUserId, Guid blockedUserId, CancellationToken cancellationToken = default)
    {
        var existing = await Context.UserBlocksSet
            .FirstOrDefaultAsync(x => x.BlockerUserId == blockerUserId && x.BlockedUserId == blockedUserId, cancellationToken);

        if (existing is not null)
        {
            Context.UserBlocksSet.Remove(existing);
        }
    }
}
