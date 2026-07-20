package com.kanban.app.dto.response;

import com.kanban.app.entity.Card;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class CardResponse {
    private Long id;
    private String title;
    private String description;
    private Integer position;
    private Long listId;
    private LocalDate dueDate;
    private List<LabelResponse> labels;
    private List<UserSummaryResponse> assignees;
    private Long createdById;

    public static CardResponse from(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .title(card.getTitle())
                .description(card.getDescription())
                .position(card.getPosition())
                .listId(card.getList().getId())
                .dueDate(card.getDueDate())
                .labels(card.getLabels().stream().map(LabelResponse::from).toList())
                .assignees(card.getAssignees().stream().map(UserSummaryResponse::from).toList())
                .createdById(card.getCreatedBy().getId())
                .build();
    }
}
