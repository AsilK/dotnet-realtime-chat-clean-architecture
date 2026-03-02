using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using ChatApp.Domain.ValueObjects;
using MediatR;

namespace ChatApp.Application.Features.Auth.Commands.Register;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IMediator _mediator;

    public RegisterCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _mediator = mediator;
    }

    public async Task<Result<AuthResponseDto>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (await _unitOfWork.Users.ExistsByEmailAsync(request.Email, cancellationToken))
        {
            return Result.Failure<AuthResponseDto>("Email already exists.");
        }

        if (await _unitOfWork.Users.ExistsByUsernameAsync(request.Username, cancellationToken))
        {
            return Result.Failure<AuthResponseDto>("Username already exists.");
        }

        var user = User.Register(
            new Email(request.Email),
            new Username(request.Username),
            _passwordHasher.Hash(request.Password),
            request.DisplayName);

        var refreshTokenRaw = _jwtTokenService.GenerateRefreshToken();
        var refreshToken = Domain.Entities.RefreshToken.Create(
            user.Id,
            TokenHashing.Sha256(refreshTokenRaw),
            _jwtTokenService.GetRefreshTokenExpiryUtc(),
            "system");
        user.AddRefreshToken(refreshToken);

        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _mediator.Send(
            new global::ChatApp.Application.Features.Auth.Commands.RequestEmailVerification.RequestEmailVerificationCommand(user.Email),
            cancellationToken);

        var response = new AuthResponseDto(
            user.Id,
            user.Email,
            user.Username,
            user.DisplayName,
            _jwtTokenService.GenerateAccessToken(user),
            refreshTokenRaw,
            _jwtTokenService.GetAccessTokenExpiryUtc(),
            refreshToken.ExpiresAtUtc);

        return Result.Success(response);
    }
}
