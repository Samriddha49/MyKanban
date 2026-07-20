package com.kanban.app.repository;

import com.kanban.app.entity.BoardList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardListRepository extends JpaRepository<BoardList, Long> {
    List<BoardList> findByBoardIdAndArchivedFalseOrderByPositionAsc(Long boardId);
}
