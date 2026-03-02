using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Commands.MarkMessageAsRead;

public sealed record MarkMessageAsReadCommand(Guid MessageId, Guid? RoomId = null) : IRequest<Result<Guid>>;
