using ChatApp.Domain.Entities;
using ChatApp.Domain.ValueObjects;
using ChatApp.Infrastructure.Identity;
using ChatApp.Infrastructure.Options;
using ChatApp.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Options;

namespace ChatApp.Infrastructure.IntegrationTests;

public sealed class InfrastructureServiceTests
{
    [Fact]
    public void PasswordHasher_ShouldVerifyHash()
    {
        var hasher = new PasswordHasher();
        var hash = hasher.Hash("StrongP@ssw0rd");

        hasher.Verify("StrongP@ssw0rd", hash).Should().BeTrue();
    }

    [Fact]
    public void JwtTokenService_ShouldCreateAccessToken()
    {
        var settings = Microsoft.Extensions.Options.Options.Create(new JwtSettings
        {
            Secret = "12345678901234567890123456789012",
            Issuer = "ChatApp",
            Audience = "ChatApp.Users",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        });

        var service = new JwtTokenService(settings);
        var user = User.Register(new Email("token@test.com"), new Username("tokentest"), "hash", "Token User");
        var token = service.GenerateAccessToken(user);

        token.Should().NotBeNullOrWhiteSpace();
    }
}
