using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.ConfirmPasswordReset;

public sealed class ConfirmPasswordResetCommandHandler : IRequestHandler<ConfirmPasswordResetCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cacheService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IDateTimeService _dateTimeService;
    private readonly ICurrentUserService _currentUser;

    public ConfirmPasswordResetCommandHandler(
        IUnitOfWork unitOfWork,
        ICacheService cacheService,
        IPasswordHasher passwordHasher,
        IDateTimeService dateTimeService,
        ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _cacheService = cacheService;
        _passwordHasher = passwordHasher;
        _dateTimeService = dateTimeService;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(ConfirmPasswordResetCommand request, CancellationToken cancellationToken)
    {
        var hashedToken = Features.Auth.TokenHashing.Sha256(request.Token);
        var key = $"password-reset:{hashedToken}";

        var userIdRaw = await _cacheService.GetAsync<string>(key, cancellationToken);
        if (!Guid.TryParse(userIdRaw, out var userId))
        {
            return Result.Failure("Invalid or expired password reset token.");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result.Failure("User not found.");
        }

        user.ChangePasswordHash(_passwordHasher.Hash(request.NewPassword));

        var activeTokens = await _unitOfWork.RefreshTokens.GetActiveByUserIdAsync(userId, cancellationToken);
        foreach (var token in activeTokens)
        {
            token.Revoke(_dateTimeService.UtcNow, _currentUser.IpAddress, "Password reset");
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _cacheService.RemoveAsync(key, cancellationToken);

        return Result.Success();
    }
}
