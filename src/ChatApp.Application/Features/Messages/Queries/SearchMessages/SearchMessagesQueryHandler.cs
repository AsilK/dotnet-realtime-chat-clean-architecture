using AutoMapper;
using ChatApp.Application.Common.Interfaces;
using ChatApp.Application.Common.Models;
using MediatR;

namespace ChatApp.Application.Features.Messages.Queries.SearchMessages;

public sealed class SearchMessagesQueryHandler : IRequestHandler<SearchMessagesQuery, Result<PaginatedList<MessageDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SearchMessagesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<PaginatedList<MessageDto>>> Handle(SearchMessagesQuery request, CancellationToken cancellationToken)
    {
        var messages = await _unitOfWork.Messages.SearchMessagesAsync(request.RoomId, request.Term, request.PageNumber, request.PageSize, cancellationToken);
        var mapped = messages.Items.Select(_mapper.Map<MessageDto>).ToArray();

        return Result.Success(new PaginatedList<MessageDto>(mapped, messages.PageNumber, messages.PageSize, messages.TotalCount));
    }
}
