using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Messages.Commands.SendMessage;

public sealed class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, Result<MessageDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public SendMessageCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<Result<MessageDto>> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        var isMember = await _unitOfWork.ChatRooms.IsMemberAsync(request.ChatRoomId, _currentUser.UserId, cancellationToken);
        if (!isMember)
        {
            return Result.Failure<MessageDto>("You are not a member of this room.");
        }

        var message = Message.Create(request.ChatRoomId, _currentUser.UserId, request.Content, request.Type);
        if (request.ReplyToMessageId.HasValue)
        {
            message.SetReplyTo(request.ReplyToMessageId.Value);
        }

        await _unitOfWork.Messages.AddAsync(message, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(_mapper.Map<MessageDto>(message));
    }
}
