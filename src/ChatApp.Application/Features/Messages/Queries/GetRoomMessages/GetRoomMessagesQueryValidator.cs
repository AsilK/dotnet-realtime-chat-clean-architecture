using FluentValidation;

namespace ChatApp.Application.Features.Messages.Queries.GetRoomMessages;

public sealed class GetRoomMessagesQueryValidator : AbstractValidator<GetRoomMessagesQuery>
{
    public GetRoomMessagesQueryValidator()
    {
        RuleFor(x => x.RoomId).NotEmpty();
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.BeforeMessageId).NotEqual(Guid.Empty).When(x => x.BeforeMessageId.HasValue);
    }
}
