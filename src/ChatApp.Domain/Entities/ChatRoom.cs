using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;
using ChatApp.Domain.Events;
using ChatApp.Domain.Exceptions;

namespace ChatApp.Domain.Entities;

public sealed class ChatRoom : AuditableEntity
{
    private readonly List<ChatRoomMember> _members = new();

    private ChatRoom()
    {
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? AvatarUrl { get; private set; }
    public RoomType Type { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public bool IsDeleted { get; private set; }

    public IReadOnlyCollection<ChatRoomMember> Members => _members.AsReadOnly();

    public static ChatRoom Create(string name, RoomType type, Guid createdByUserId, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(name) && type != RoomType.Direct)
        {
            throw new DomainException("Room name is required.");
        }

        var room = new ChatRoom
        {
            Id = Guid.NewGuid(),
            Name = type == RoomType.Direct ? "Direct" : name.Trim(),
            Type = type,
            CreatedByUserId = createdByUserId,
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            IsDeleted = false
        };

        room.AddMember(createdByUserId, MemberRole.Admin);
        return room;
    }

    public void UpdateSettings(string name, string? description, string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(name) && Type != RoomType.Direct)
        {
            throw new DomainException("Room name is required.");
        }

        Name = Type == RoomType.Direct ? Name : name.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim();
    }

    public void AddMember(Guid userId, MemberRole role = MemberRole.Member)
    {
        if (_members.Any(x => x.UserId == userId && !x.IsBanned))
        {
            throw new DomainException("User is already a member of this room.");
        }

        var member = ChatRoomMember.Create(Id, userId, role);
        _members.Add(member);
        AddDomainEvent(new UserJoinedRoomEvent(Id, userId));
    }

    public void RemoveMember(Guid userId)
    {
        var member = _members.FirstOrDefault(x => x.UserId == userId);
        if (member is null)
        {
            throw new DomainException("Member not found.");
        }

        _members.Remove(member);
        AddDomainEvent(new UserLeftRoomEvent(Id, userId));
    }

    public void BanMember(Guid userId)
    {
        var member = _members.FirstOrDefault(x => x.UserId == userId);
        if (member is null)
        {
            throw new DomainException("Member not found.");
        }

        member.Ban();
    }

    public void MarkDeleted()
    {
        IsDeleted = true;
    }
}
