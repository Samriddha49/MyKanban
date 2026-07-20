package com.kanban.app.service;

import com.kanban.app.dto.response.ActivityLogResponse;
import com.kanban.app.entity.ActivityLog;
import com.kanban.app.entity.Board;
import com.kanban.app.entity.User;
import com.kanban.app.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final BoardService boardService;

    public void log(Board board, User actor, String action, String details) {
        ActivityLog entry = ActivityLog.builder()
                .board(board)
                .actor(actor)
                .action(action)
                .details(details)
                .build();
        activityLogRepository.save(entry);
    }

    public List<ActivityLogResponse> getForBoard(Long boardId, Long userId) {
        boardService.getEntityWithAccessCheck(boardId, userId);
        return activityLogRepository.findByBoardIdOrderByCreatedAtDesc(boardId).stream()
                .map(ActivityLogResponse::from)
                .toList();
    }
}
