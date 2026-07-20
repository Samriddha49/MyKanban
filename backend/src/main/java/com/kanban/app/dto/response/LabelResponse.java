package com.kanban.app.dto.response;

import com.kanban.app.entity.Label;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class LabelResponse {
    private Long id;
    private String name;
    private String color;

    public static LabelResponse from(Label label) {
        return LabelResponse.builder()
                .id(label.getId())
                .name(label.getName())
                .color(label.getColor())
                .build();
    }
}
