using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.RequestEmailVerification;

public sealed class RequestEmailVerificationCommandHandler : IRequestHandler<RequestEmailVerificationCommand, Result>
{
    private static readonly TimeSpan VerificationTokenTtl = TimeSpan.FromHours(24);

    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cacheService;
    private readonly IEmailDispatchQueue _emailDispatchQueue;

    public RequestEmailVerificationCommandHandler(
        IUnitOfWork unitOfWork,
        ICacheService cacheService,
        IEmailDispatchQueue emailDispatchQueue)
    {
        _unitOfWork = unitOfWork;
        _cacheService = cacheService;
        _emailDispatchQueue = emailDispatchQueue;
    }

    public async Task<Result> Handle(RequestEmailVerificationCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);
        if (user is null || user.IsEmailVerified)
        {
            return Result.Success();
        }

        var rawToken = AuthSecurityTokenFactory.GenerateToken();
        var hashedToken = TokenHashing.Sha256(rawToken);

        await _cacheService.SetAsync($"email-verification:{hashedToken}", user.Id.ToString(), VerificationTokenTtl, cancellationToken);

        var subject = "ChatApp - Email Verification";
        var body = $"<p>Hello {user.DisplayName},</p><p>Please verify your email with this token:</p><p><b>{rawToken}</b></p><p>This token expires in 24 hours.</p>";

        await _emailDispatchQueue.QueueAsync(user.Email, subject, body, cancellationToken);
        return Result.Success();
    }
}
