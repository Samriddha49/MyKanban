package com.kanban.app.repository;

import com.kanban.app.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findByListIdAndArchivedFalseOrderByPositionAsc(Long listId);

    @Query("SELECT c FROM Card c WHERE c.list.board.id = :boardId AND c.archived = false " +
           "AND LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Card> searchByBoardIdAndTitle(@Param("boardId") Long boardId, @Param("query") String query);

    @Query("SELECT DISTINCT c FROM Card c LEFT JOIN c.labels l LEFT JOIN c.assignees a " +
           "WHERE c.list.board.id = :boardId AND c.archived = false " +
           "AND (:labelId IS NULL OR l.id = :labelId) " +
           "AND (:assigneeId IS NULL OR a.id = :assigneeId)")
    List<Card> filterByBoard(@Param("boardId") Long boardId,
                              @Param("labelId") Long labelId,
                              @Param("assigneeId") Long assigneeId);
}
