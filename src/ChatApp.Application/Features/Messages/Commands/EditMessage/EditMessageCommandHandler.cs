using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Commands.EditMessage;

public sealed class EditMessageCommandHandler : IRequestHandler<EditMessageCommand, Result<MessageDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTimeService _dateTimeService;
    private readonly IMapper _mapper;

    public EditMessageCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IDateTimeService dateTimeService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _dateTimeService = dateTimeService;
        _mapper = mapper;
    }

    public async Task<Result<MessageDto>> Handle(EditMessageCommand request, CancellationToken cancellationToken)
    {
        var message = await _unitOfWork.Messages.GetByIdAsync(request.MessageId, cancellationToken);
        if (message is null)
        {
            return Result.Failure<MessageDto>("Message not found.");
        }

        if (message.SenderId != _currentUser.UserId)
        {
            return Result.Failure<MessageDto>("Only sender can edit message.");
        }

        message.Edit(request.Content, _dateTimeService.UtcNow);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(_mapper.Map<MessageDto>(message));
    }
}
