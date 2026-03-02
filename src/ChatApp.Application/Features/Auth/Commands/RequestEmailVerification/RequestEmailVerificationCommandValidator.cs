using FluentValidation;

namespace ChatApp.Application.Features.Auth.Commands.RequestEmailVerification;

public sealed class RequestEmailVerificationCommandValidator : AbstractValidator<RequestEmailVerificationCommand>
{
    public RequestEmailVerificationCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}
