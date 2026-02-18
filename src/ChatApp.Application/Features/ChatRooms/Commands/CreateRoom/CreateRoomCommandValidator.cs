using FluentValidation;

namespace ChatApp.Application.Features.ChatRooms.Commands.CreateRoom;

public sealed class CreateRoomCommandValidator : AbstractValidator<CreateRoomCommand>
{
    public CreateRoomCommandValidator()
    {
        RuleFor(x => x.RoomType).IsInEnum();
        RuleFor(x => x.Name).NotEmpty().When(x => x.RoomType != Domain.Enums.RoomType.Direct);
    }
}
