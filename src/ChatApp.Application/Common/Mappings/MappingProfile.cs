using AutoMapper;
using ChatApp.Application.Common.Models;
using ChatApp.Domain.Entities;

namespace ChatApp.Application.Common.Mappings;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForCtorParam(nameof(UserDto.Role), opt => opt.MapFrom(src => src.Role.ToString()));

        CreateMap<ChatRoom, ChatRoomDto>()
            .ForCtorParam(nameof(ChatRoomDto.Type), opt => opt.MapFrom(src => src.Type.ToString()))
            .ForCtorParam(nameof(ChatRoomDto.MemberCount), opt => opt.MapFrom(src => src.Members.Count));

        CreateMap<ChatRoomMember, ChatRoomMemberDto>()
            .ForCtorParam(nameof(ChatRoomMemberDto.Role), opt => opt.MapFrom(src => src.Role.ToString()));

        CreateMap<Message, MessageDto>()
            .ForCtorParam(nameof(MessageDto.Type), opt => opt.MapFrom(src => src.Type.ToString()))
            .ForCtorParam(nameof(MessageDto.CreatedAtUtc), opt => opt.MapFrom(src => src.CreatedAtUtc));
    }
}
