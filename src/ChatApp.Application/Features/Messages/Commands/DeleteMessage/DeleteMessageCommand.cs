using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Commands.DeleteMessage;

public sealed record DeleteMessageCommand(Guid MessageId) : IRequest<Result>;
