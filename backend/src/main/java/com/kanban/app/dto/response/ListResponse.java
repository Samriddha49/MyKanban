package com.kanban.app.dto.response;

import com.kanban.app.entity.BoardList;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class ListResponse {
    private Long id;
    private String name;
    private Integer position;
    private Long boardId;
    private List<CardResponse> cards;

    public static ListResponse from(BoardList list, List<CardResponse> cards) {
        return ListResponse.builder()
                .id(list.getId())
                .name(list.getName())
                .position(list.getPosition())
                .boardId(list.getBoard().getId())
                .cards(cards)
                .build();
    }
}
