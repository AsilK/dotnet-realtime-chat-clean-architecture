using ChatApp.Application.Common.Models;
using ChatApp.Application.Features.Messages.Commands.DeleteMessage;
using ChatApp.Application.Features.Messages.Commands.EditMessage;
using ChatApp.Application.Features.Messages.Commands.SendMessage;
using ChatApp.Application.Features.Messages.Queries.GetRoomMessages;
using ChatApp.Application.Features.Messages.Queries.SearchMessages;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class MessagesController : ControllerBase
{
    private readonly IMediator _mediator;

    public MessagesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public Task<Result<MessageDto>> Send([FromBody] SendMessageCommand command)
        => _mediator.Send(command);

    [HttpPut("{messageId:guid}")]
    public Task<Result<MessageDto>> Edit(Guid messageId, [FromBody] string content)
        => _mediator.Send(new EditMessageCommand(messageId, content));

    [HttpDelete("{messageId:guid}")]
    public Task<Result> Delete(Guid messageId)
        => _mediator.Send(new DeleteMessageCommand(messageId));

    [HttpGet("room/{roomId:guid}")]
    public Task<Result<PaginatedList<MessageDto>>> GetRoomMessages(Guid roomId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
        => _mediator.Send(new GetRoomMessagesQuery(roomId, pageNumber, pageSize));

    [HttpGet("room/{roomId:guid}/search")]
    public Task<Result<PaginatedList<MessageDto>>> Search(Guid roomId, [FromQuery] string term, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
        => _mediator.Send(new SearchMessagesQuery(roomId, term, pageNumber, pageSize));
}
