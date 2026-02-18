namespace ChatApp.Application.Common.Models;

public sealed record UserDto(
    Guid Id,
    string Email,
    string Username,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    string Role,
    bool IsOnline,
    DateTime? LastSeenAtUtc);
