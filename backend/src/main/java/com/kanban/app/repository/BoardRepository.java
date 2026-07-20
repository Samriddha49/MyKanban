package com.kanban.app.repository;

import com.kanban.app.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {
    List<Board> findByWorkspaceIdAndArchivedFalse(Long workspaceId);
}
