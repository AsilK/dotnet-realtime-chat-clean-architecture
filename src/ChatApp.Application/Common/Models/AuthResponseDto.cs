namespace ChatApp.Application.Common.Models;

public sealed record AuthResponseDto(
    Guid UserId,
    string Email,
    string Username,
    string DisplayName,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAtUtc,
    DateTime RefreshTokenExpiresAtUtc);
