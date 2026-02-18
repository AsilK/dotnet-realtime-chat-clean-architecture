using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;
using ChatApp.Domain.Exceptions;
using ChatApp.Domain.ValueObjects;

namespace ChatApp.Domain.Entities;

public sealed class User : AuditableEntity
{
    private readonly List<RefreshToken> _refreshTokens = new();

    private User()
    {
    }

    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string Username { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string? Bio { get; private set; }
    public string? AvatarUrl { get; private set; }
    public UserRole Role { get; private set; } = UserRole.User;
    public bool IsEmailVerified { get; private set; }
    public bool IsOnline { get; private set; }
    public DateTime? LastSeenAtUtc { get; private set; }

    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    public static User Register(Email email, Username username, string passwordHash, string displayName)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new DomainException("Password hash is required.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainException("Display name is required.");
        }

        return new User
        {
            Id = Guid.NewGuid(),
            Email = email.Value,
            Username = username.Value,
            PasswordHash = passwordHash,
            DisplayName = displayName.Trim(),
            IsEmailVerified = false,
            IsOnline = false
        };
    }

    public void VerifyEmail() => IsEmailVerified = true;

    public void UpdateProfile(string displayName, string? bio, string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainException("Display name is required.");
        }

        DisplayName = displayName.Trim();
        Bio = string.IsNullOrWhiteSpace(bio) ? null : bio.Trim();
        AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim();
    }

    public void ChangePasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new DomainException("Password hash is required.");
        }

        PasswordHash = passwordHash;
    }

    public void SetOnlineStatus(bool isOnline, DateTime nowUtc)
    {
        IsOnline = isOnline;
        LastSeenAtUtc = isOnline ? LastSeenAtUtc : nowUtc;
    }

    public void AssignRole(UserRole role)
    {
        Role = role;
    }

    public void AddRefreshToken(RefreshToken refreshToken)
    {
        _refreshTokens.Add(refreshToken);
    }

    public void RemoveRefreshToken(Guid refreshTokenId)
    {
        var token = _refreshTokens.FirstOrDefault(x => x.Id == refreshTokenId);
        if (token is not null)
        {
            _refreshTokens.Remove(token);
        }
    }
}
