using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using ChatApp.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence;

public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(ApplicationDbContext context, CancellationToken cancellationToken = default)
    {
        await context.Database.MigrateAsync(cancellationToken);

        if (await context.UsersSet.AnyAsync(cancellationToken))
        {
            return;
        }

        // Minimal seed data keeps local bootstrap and integration checks fast.
        var admin = User.Register(new Email("admin@chatapp.local"), new Username("admin"), BCrypt.Net.BCrypt.HashPassword("Admin123!"), "System Admin");
        admin.VerifyEmail();
        admin.AssignRole(UserRole.Admin);

        var room = ChatRoom.Create("General", RoomType.Public, admin.Id, "General discussion room");

        await context.UsersSet.AddAsync(admin, cancellationToken);
        await context.ChatRoomsSet.AddAsync(room, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}
