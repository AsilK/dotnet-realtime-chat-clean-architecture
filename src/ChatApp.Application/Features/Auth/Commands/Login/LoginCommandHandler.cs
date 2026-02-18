using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ICurrentUserService _currentUserService;

    public LoginCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AuthResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = request.EmailOrUsername.Contains('@')
            ? await _unitOfWork.Users.GetByEmailAsync(request.EmailOrUsername, cancellationToken)
            : await _unitOfWork.Users.GetByUsernameAsync(request.EmailOrUsername, cancellationToken);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Result.Failure<AuthResponseDto>("Invalid credentials.");
        }

        var refreshTokenRaw = _jwtTokenService.GenerateRefreshToken();
        var refreshToken = Domain.Entities.RefreshToken.Create(
            user.Id,
            Features.Auth.TokenHashing.Sha256(refreshTokenRaw),
            _jwtTokenService.GetRefreshTokenExpiryUtc(),
            _currentUserService.IpAddress ?? "unknown");

        await _unitOfWork.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new AuthResponseDto(
            user.Id,
            user.Email,
            user.Username,
            user.DisplayName,
            _jwtTokenService.GenerateAccessToken(user),
            refreshTokenRaw,
            _jwtTokenService.GetAccessTokenExpiryUtc(),
            refreshToken.ExpiresAtUtc));
    }
}
