using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.API.Hubs;

[Authorize]
public sealed class NotificationHub : Hub
{
    public async Task JoinNotifications()
    {
        if (Context.UserIdentifier is null)
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"notifications_{Context.UserIdentifier}");
    }
}
