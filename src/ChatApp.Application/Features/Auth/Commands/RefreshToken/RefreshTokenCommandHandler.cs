using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;

    public RefreshTokenCommandHandler(
        IUnitOfWork unitOfWork,
        IJwtTokenService jwtTokenService,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService)
    {
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
    }

    public async Task<Result<AuthResponseDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var hashed = Features.Auth.TokenHashing.Sha256(request.RefreshToken);
        var existing = await _unitOfWork.RefreshTokens.GetByTokenHashAsync(hashed, cancellationToken);

        if (existing is null || !existing.IsActive)
        {
            return Result.Failure<AuthResponseDto>("Invalid refresh token.");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(existing.UserId, cancellationToken);
        if (user is null)
        {
            return Result.Failure<AuthResponseDto>("User not found.");
        }

        var newRefreshRaw = _jwtTokenService.GenerateRefreshToken();
        var newRefreshHash = Features.Auth.TokenHashing.Sha256(newRefreshRaw);

        existing.Replace(newRefreshHash);
        existing.Revoke(_dateTimeService.UtcNow, _currentUserService.IpAddress, "Rotated");

        var nextToken = Domain.Entities.RefreshToken.Create(
            user.Id,
            newRefreshHash,
            _jwtTokenService.GetRefreshTokenExpiryUtc(),
            _currentUserService.IpAddress ?? "unknown");

        await _unitOfWork.RefreshTokens.AddAsync(nextToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new AuthResponseDto(
            user.Id,
            user.Email,
            user.Username,
            user.DisplayName,
            _jwtTokenService.GenerateAccessToken(user),
            newRefreshRaw,
            _jwtTokenService.GetAccessTokenExpiryUtc(),
            nextToken.ExpiresAtUtc));
    }
}
