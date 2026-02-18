namespace ChatApp.Application.Common.Models;

public sealed record ChatRoomDto(
    Guid Id,
    string Name,
    string? Description,
    string? AvatarUrl,
    string Type,
    Guid CreatedByUserId,
    int MemberCount);
