using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Queries.GetRoomMessages;

public sealed class GetRoomMessagesQueryHandler : IRequestHandler<GetRoomMessagesQuery, Result<PaginatedList<MessageDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetRoomMessagesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<PaginatedList<MessageDto>>> Handle(GetRoomMessagesQuery request, CancellationToken cancellationToken)
    {
        var messages = await _unitOfWork.Messages.GetRoomMessagesAsync(request.RoomId, request.PageNumber, request.PageSize, cancellationToken);
        var mapped = messages.Items.Select(_mapper.Map<MessageDto>).ToArray();

        return Result.Success(new PaginatedList<MessageDto>(mapped, messages.PageNumber, messages.PageSize, messages.TotalCount));
    }
}
