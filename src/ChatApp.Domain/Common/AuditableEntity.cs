namespace ChatApp.Domain.Common;

public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; private set; }
    public string? CreatedBy { get; private set; }
    public string? UpdatedBy { get; private set; }

    public void SetCreatedAudit(string? createdBy, DateTime createdAtUtc)
    {
        CreatedBy = createdBy;
        CreatedAtUtc = createdAtUtc;
    }

    public void SetUpdatedAudit(string? updatedBy, DateTime updatedAtUtc)
    {
        UpdatedBy = updatedBy;
        UpdatedAtUtc = updatedAtUtc;
    }
}
