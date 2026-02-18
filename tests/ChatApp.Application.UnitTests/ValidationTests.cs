using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Features.Auth.Commands.Register;
using ChatApp.Application.Features.Messages.Commands.SendMessage;
using ChatApp.Domain.Enums;
using FluentAssertions;
using Moq;

namespace ChatApp.Application.UnitTests;

public sealed class ValidationTests
{
    [Fact]
    public void RegisterValidator_ShouldFail_ForWeakPassword()
    {
        var validator = new RegisterCommandValidator();
        var result = validator.Validate(new RegisterCommand("u@test.com", "user1", "weak", "User One"));

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void SendMessageValidator_ShouldFail_ForEmptyContent()
    {
        var validator = new SendMessageCommandValidator();
        var result = validator.Validate(new SendMessageCommand(Guid.NewGuid(), string.Empty, MessageType.Text));

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void CurrentUserServiceContract_CanBeMocked()
    {
        var mock = new Mock<ICurrentUserService>();
        mock.Setup(x => x.UserId).Returns(Guid.NewGuid());

        mock.Object.UserId.Should().NotBe(Guid.Empty);
    }
}
