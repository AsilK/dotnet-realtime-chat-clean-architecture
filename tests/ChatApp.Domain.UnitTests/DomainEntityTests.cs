using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using ChatApp.Domain.Exceptions;
using ChatApp.Domain.ValueObjects;
using FluentAssertions;

namespace ChatApp.Domain.UnitTests;

public sealed class DomainEntityTests
{
    [Fact]
    public void Email_ShouldThrow_WhenFormatIsInvalid()
    {
        Action action = () => _ = new Email("bad-email");
        action.Should().Throw<DomainException>();
    }

    [Fact]
    public void UserRegister_ShouldCreateValidUser()
    {
        var user = User.Register(new Email("test@example.com"), new Username("tester"), "hash", "Test User");

        user.Email.Should().Be("test@example.com");
        user.Username.Should().Be("tester");
        user.Role.Should().Be(UserRole.User);
    }

    [Fact]
    public void Message_Delete_ShouldMarkDeletedAndReplaceContent()
    {
        var message = Message.Create(Guid.NewGuid(), Guid.NewGuid(), "hello", MessageType.Text);

        message.Delete();

        message.IsDeleted.Should().BeTrue();
        message.Content.Should().Be("[Message deleted]");
    }
}
