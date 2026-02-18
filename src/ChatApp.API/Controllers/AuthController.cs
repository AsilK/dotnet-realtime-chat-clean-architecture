using ChatApp.Application.Common.Models;
using ChatApp.Application.Features.Auth.Commands.Login;
using ChatApp.Application.Features.Auth.Commands.Logout;
using ChatApp.Application.Features.Auth.Commands.RefreshToken;
using ChatApp.Application.Features.Auth.Commands.Register;
using ChatApp.Application.Features.Auth.Queries.GetCurrentUser;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ChatApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public Task<Result<AuthResponseDto>> Register([FromBody] RegisterCommand command)
        => _mediator.Send(command);

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public Task<Result<AuthResponseDto>> Login([FromBody] LoginCommand command)
        => _mediator.Send(command);

    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public Task<Result<AuthResponseDto>> Refresh([FromBody] RefreshTokenCommand command)
        => _mediator.Send(command);

    [HttpPost("logout")]
    [Authorize]
    public Task<Result> Logout([FromBody] LogoutCommand command)
        => _mediator.Send(command);

    [HttpGet("me")]
    [Authorize]
    public Task<Result<UserDto>> Me()
        => _mediator.Send(new GetCurrentUserQuery());
}
