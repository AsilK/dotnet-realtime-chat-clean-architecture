using ChatApp.Application.Common.Models;
using ChatApp.Application.Features.ChatRooms.Commands.CreateRoom;
using ChatApp.Application.Features.ChatRooms.Commands.DeleteRoom;
using ChatApp.Application.Features.ChatRooms.Commands.JoinRoom;
using ChatApp.Application.Features.ChatRooms.Commands.LeaveRoom;
using ChatApp.Application.Features.ChatRooms.Queries.GetRoomById;
using ChatApp.Application.Features.ChatRooms.Queries.GetRoomMembers;
using ChatApp.Application.Features.ChatRooms.Queries.GetUserRooms;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ChatRoomsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChatRoomsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public Task<Result<ChatRoomDto>> Create([FromBody] CreateRoomCommand command)
        => _mediator.Send(command);

    [HttpPost("{roomId:guid}/join")]
    public Task<Result> Join(Guid roomId)
        => _mediator.Send(new JoinRoomCommand(roomId));

    [HttpPost("{roomId:guid}/leave")]
    public Task<Result> Leave(Guid roomId)
        => _mediator.Send(new LeaveRoomCommand(roomId));

    [HttpDelete("{roomId:guid}")]
    public Task<Result> Delete(Guid roomId)
        => _mediator.Send(new DeleteRoomCommand(roomId));

    [HttpGet("{roomId:guid}")]
    public Task<Result<ChatRoomDto>> GetById(Guid roomId)
        => _mediator.Send(new GetRoomByIdQuery(roomId));

    [HttpGet]
    public Task<Result<PaginatedList<ChatRoomDto>>> GetMine([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        => _mediator.Send(new GetUserRoomsQuery(pageNumber, pageSize));

    [HttpGet("{roomId:guid}/members")]
    public Task<Result<IReadOnlyCollection<ChatRoomMemberDto>>> GetMembers(Guid roomId)
        => _mediator.Send(new GetRoomMembersQuery(roomId));
}
