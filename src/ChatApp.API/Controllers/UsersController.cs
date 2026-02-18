using ChatApp.Application.Common.Models;
using ChatApp.Application.Features.Users.Commands.BlockUser;
using ChatApp.Application.Features.Users.Commands.ChangePassword;
using ChatApp.Application.Features.Users.Commands.UnblockUser;
using ChatApp.Application.Features.Users.Commands.UpdateOnlineStatus;
using ChatApp.Application.Features.Users.Commands.UpdateProfile;
using ChatApp.Application.Features.Users.Queries.GetUserById;
using ChatApp.Application.Features.Users.Queries.SearchUsers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{userId:guid}")]
    public Task<Result<UserDto>> GetById(Guid userId)
        => _mediator.Send(new GetUserByIdQuery(userId));

    [HttpGet("search")]
    public Task<Result<PaginatedList<UserDto>>> Search([FromQuery] string? term, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        => _mediator.Send(new SearchUsersQuery(term, pageNumber, pageSize));

    [HttpPut("me/profile")]
    public Task<Result<UserDto>> UpdateProfile([FromBody] UpdateProfileCommand command)
        => _mediator.Send(command);

    [HttpPut("me/password")]
    public Task<Result> ChangePassword([FromBody] ChangePasswordCommand command)
        => _mediator.Send(command);

    [HttpPost("me/status")]
    public Task<Result> UpdateStatus([FromBody] UpdateOnlineStatusCommand command)
        => _mediator.Send(command);

    [HttpPost("block/{targetUserId:guid}")]
    public Task<Result> Block(Guid targetUserId)
        => _mediator.Send(new BlockUserCommand(targetUserId));

    [HttpDelete("block/{targetUserId:guid}")]
    public Task<Result> Unblock(Guid targetUserId)
        => _mediator.Send(new UnblockUserCommand(targetUserId));
}
