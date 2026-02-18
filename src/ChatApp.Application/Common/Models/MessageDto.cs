namespace ChatApp.Application.Common.Models;

public sealed record MessageDto(
    Guid Id,
    Guid ChatRoomId,
    Guid SenderId,
    string Content,
    string Type,
    Guid? ReplyToMessageId,
    bool IsEdited,
    bool IsDeleted,
    DateTime CreatedAtUtc,
    DateTime? EditedAtUtc);
