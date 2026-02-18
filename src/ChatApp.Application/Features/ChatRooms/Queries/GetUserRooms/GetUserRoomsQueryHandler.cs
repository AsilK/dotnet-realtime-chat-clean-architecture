using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.ChatRooms.Queries.GetUserRooms;

public sealed class GetUserRoomsQueryHandler : IRequestHandler<GetUserRoomsQuery, Result<PaginatedList<ChatRoomDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public GetUserRoomsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<Result<PaginatedList<ChatRoomDto>>> Handle(GetUserRoomsQuery request, CancellationToken cancellationToken)
    {
        var rooms = await _unitOfWork.ChatRooms.GetUserRoomsAsync(_currentUser.UserId, request.PageNumber, request.PageSize, cancellationToken);
        var mapped = rooms.Items.Select(_mapper.Map<ChatRoomDto>).ToArray();

        return Result.Success(new PaginatedList<ChatRoomDto>(mapped, rooms.PageNumber, rooms.PageSize, rooms.TotalCount));
    }
}
