using ChatApp.Application.Common.Models;

namespace ChatApp.API.Hubs;

public interface IChatClient
{
    Task ReceiveMessage(MessageDto message);
    Task UserStatusChanged(string userId, string status);
    Task UserJoinedRoom(string userId, Guid roomId);
    Task UserLeftRoom(string userId, Guid roomId);
    Task UserTyping(string userId, Guid roomId);
    Task MessageRead(Guid messageId, string userId);
}
