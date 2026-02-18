using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Commands.EditMessage;

public sealed record EditMessageCommand(Guid MessageId, string Content) : IRequest<Result<MessageDto>>;
