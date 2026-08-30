package com.kemkendra.admin.governance;

import com.kemkendra.identity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_suspensions")
public class AccountSuspension {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suspended_by_admin_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User suspendedByAdmin;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "suspended_at", nullable = false)
    private Instant suspendedAt;

    @Column(name = "reinstated_at")
    private Instant reinstatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reinstated_by_admin_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User reinstatedByAdmin;

    @Column(name = "reinstatement_notes", columnDefinition = "TEXT")
    private String reinstatementNotes;

    public AccountSuspension() {
    }

    public AccountSuspension(User user, User suspendedByAdmin, String reason, String internalNotes) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.suspendedByAdmin = suspendedByAdmin;
        this.reason = reason;
        this.internalNotes = internalNotes;
        this.suspendedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (suspendedAt == null) {
            suspendedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getSuspendedByAdmin() {
        return suspendedByAdmin;
    }

    public void setSuspendedByAdmin(User suspendedByAdmin) {
        this.suspendedByAdmin = suspendedByAdmin;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getInternalNotes() {
        return internalNotes;
    }

    public void setInternalNotes(String internalNotes) {
        this.internalNotes = internalNotes;
    }

    public Instant getSuspendedAt() {
        return suspendedAt;
    }

    public void setSuspendedAt(Instant suspendedAt) {
        this.suspendedAt = suspendedAt;
    }

    public Instant getReinstatedAt() {
        return reinstatedAt;
    }

    public void setReinstatedAt(Instant reinstatedAt) {
        this.reinstatedAt = reinstatedAt;
    }

    public User getReinstatedByAdmin() {
        return reinstatedByAdmin;
    }

    public void setReinstatedByAdmin(User reinstatedByAdmin) {
        this.reinstatedByAdmin = reinstatedByAdmin;
    }

    public String getReinstatementNotes() {
        return reinstatementNotes;
    }

    public void setReinstatementNotes(String reinstatementNotes) {
        this.reinstatementNotes = reinstatementNotes;
    }

    public boolean isActive() {
        return reinstatedAt == null;
    }
}
