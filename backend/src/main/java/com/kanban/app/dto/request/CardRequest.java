package com.kanban.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CardRequest {

    @NotBlank
    private String title;

    private String description;

    private LocalDate dueDate;

    private Long listId; // required on create, optional on update
}
