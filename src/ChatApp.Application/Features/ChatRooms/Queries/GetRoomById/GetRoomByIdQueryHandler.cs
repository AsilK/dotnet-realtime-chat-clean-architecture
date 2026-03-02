using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Queries.GetRoomById;

public sealed class GetRoomByIdQueryHandler : IRequestHandler<GetRoomByIdQuery, Result<ChatRoomDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetRoomByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<ChatRoomDto>> Handle(GetRoomByIdQuery request, CancellationToken cancellationToken)
    {
        var room = await _unitOfWork.ChatRooms.GetByIdReadOnlyAsync(request.RoomId, cancellationToken);
        return room is null
            ? Result.Failure<ChatRoomDto>("Room not found.")
            : Result.Success(_mapper.Map<ChatRoomDto>(room));
    }
}
