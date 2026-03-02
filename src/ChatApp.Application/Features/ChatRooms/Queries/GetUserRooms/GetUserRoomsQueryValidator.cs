using FluentValidation;

namespace ChatApp.Application.Features.ChatRooms.Queries.GetUserRooms;

public sealed class GetUserRoomsQueryValidator : AbstractValidator<GetUserRoomsQuery>
{
    public GetUserRoomsQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
