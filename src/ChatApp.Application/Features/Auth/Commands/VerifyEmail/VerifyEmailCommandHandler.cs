using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.VerifyEmail;

public sealed class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cacheService;

    public VerifyEmailCommandHandler(IUnitOfWork unitOfWork, ICacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _cacheService = cacheService;
    }

    public async Task<Result> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var hashedToken = Features.Auth.TokenHashing.Sha256(request.Token);
        var key = $"email-verification:{hashedToken}";

        var userIdRaw = await _cacheService.GetAsync<string>(key, cancellationToken);
        if (!Guid.TryParse(userIdRaw, out var userId))
        {
            return Result.Failure("Invalid or expired verification token.");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result.Failure("User not found.");
        }

        user.VerifyEmail();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _cacheService.RemoveAsync(key, cancellationToken);

        return Result.Success();
    }
}
