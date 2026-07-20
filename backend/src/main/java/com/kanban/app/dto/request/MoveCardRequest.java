package com.kanban.app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Used when a card is dragged to a new list and/or position.
 * targetListId: the list the card is being dropped into (can be same as current list)
 * newPosition: the zero-based index within the target list's ordered cards
 */
@Data
public class MoveCardRequest {

    @NotNull
    private Long targetListId;

    @NotNull
    private Integer newPosition;
}
