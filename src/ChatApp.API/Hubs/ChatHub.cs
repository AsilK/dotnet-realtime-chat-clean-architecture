using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Features.ChatRooms.Queries.GetUserRooms;
using ChatApp.Application.Features.Messages.Commands.MarkMessageAsRead;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.API.Hubs;

[Authorize]
public sealed class ChatHub : Hub<IChatClient>
{
    private readonly IMediator _mediator;
    private readonly ICacheService _cache;

    public ChatHub(IMediator mediator, ICacheService cache)
    {
        _mediator = mediator;
        _cache = cache;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrWhiteSpace(userId))
        {
            await base.OnConnectedAsync();
            return;
        }

        await _cache.SetAsync($"user:{userId}:connection", Context.ConnectionId, TimeSpan.FromHours(4));
        await _cache.SetAsync($"user:{userId}:status", "online", TimeSpan.FromHours(4));

        var rooms = await _mediator.Send(new GetUserRoomsQuery());
        if (rooms.IsSuccess && rooms.Value is not null)
        {
            foreach (var room in rooms.Value.Items)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{room.Id}");
            }
        }

        await Clients.All.UserStatusChanged(userId, "online");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrWhiteSpace(userId))
        {
            await _cache.RemoveAsync($"user:{userId}:connection");
            await _cache.SetAsync($"user:{userId}:status", "offline", TimeSpan.FromHours(4));
            await _cache.SetAsync($"user:{userId}:lastSeen", DateTime.UtcNow.ToString("O"), TimeSpan.FromDays(7));

            await Clients.All.UserStatusChanged(userId, "offline");
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(Guid roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");
        await Clients.Group($"room_{roomId}").UserJoinedRoom(Context.UserIdentifier ?? string.Empty, roomId);
    }

    public async Task LeaveRoom(Guid roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room_{roomId}");
        await Clients.Group($"room_{roomId}").UserLeftRoom(Context.UserIdentifier ?? string.Empty, roomId);
    }

    public async Task SendTypingIndicator(Guid roomId)
    {
        await Clients.OthersInGroup($"room_{roomId}").UserTyping(Context.UserIdentifier ?? string.Empty, roomId);
    }

    public async Task MarkMessageAsRead(Guid messageId)
    {
        await _mediator.Send(new MarkMessageAsReadCommand(messageId));
        await Clients.Group($"room_read_{messageId}").MessageRead(messageId, Context.UserIdentifier ?? string.Empty);
    }
}
