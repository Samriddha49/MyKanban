package com.kanban.app.dto.request;

import com.kanban.app.entity.MemberRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InviteMemberRequest {

    @NotBlank
    @Email
    private String email; // must already have a registered account

    @NotNull
    private MemberRole role;
}
