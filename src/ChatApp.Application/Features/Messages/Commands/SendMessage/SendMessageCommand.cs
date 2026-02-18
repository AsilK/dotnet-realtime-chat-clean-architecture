using ChatApp.Application.Common.Models;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Messages.Commands.SendMessage;

public sealed record SendMessageCommand(
    Guid ChatRoomId,
    string Content,
    MessageType Type,
    Guid? ReplyToMessageId = null) : IRequest<Result<MessageDto>>;
