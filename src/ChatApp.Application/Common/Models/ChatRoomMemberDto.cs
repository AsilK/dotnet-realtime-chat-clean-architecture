namespace ChatApp.Application.Common.Models;

public sealed record ChatRoomMemberDto(
    Guid ChatRoomId,
    Guid UserId,
    string Role,
    DateTime JoinedAtUtc,
    bool IsBanned);
