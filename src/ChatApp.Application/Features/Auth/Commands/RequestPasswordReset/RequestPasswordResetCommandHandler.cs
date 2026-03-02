using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.RequestPasswordReset;

public sealed class RequestPasswordResetCommandHandler : IRequestHandler<RequestPasswordResetCommand, Result>
{
    private static readonly TimeSpan ResetTokenTtl = TimeSpan.FromHours(1);

    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cacheService;
    private readonly IEmailDispatchQueue _emailDispatchQueue;

    public RequestPasswordResetCommandHandler(
        IUnitOfWork unitOfWork,
        ICacheService cacheService,
        IEmailDispatchQueue emailDispatchQueue)
    {
        _unitOfWork = unitOfWork;
        _cacheService = cacheService;
        _emailDispatchQueue = emailDispatchQueue;
    }

    public async Task<Result> Handle(RequestPasswordResetCommand request, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);
        if (user is null)
        {
            return Result.Success();
        }

        var rawToken = AuthSecurityTokenFactory.GenerateToken();
        var hashedToken = TokenHashing.Sha256(rawToken);

        await _cacheService.SetAsync($"password-reset:{hashedToken}", user.Id.ToString(), ResetTokenTtl, cancellationToken);

        var subject = "ChatApp - Password Reset";
        var body = $"<p>Hello {user.DisplayName},</p><p>Use this token to reset your password:</p><p><b>{rawToken}</b></p><p>This token expires in 1 hour.</p>";

        await _emailDispatchQueue.QueueAsync(user.Email, subject, body, cancellationToken);
        return Result.Success();
    }
}
