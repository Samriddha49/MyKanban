package com.kanban.app.service;

import com.kanban.app.dto.request.CommentRequest;
import com.kanban.app.entity.Card;
import com.kanban.app.entity.Comment;
import com.kanban.app.entity.User;
import com.kanban.app.exception.ForbiddenException;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.CommentRepository;
import com.kanban.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CardService cardService;
    private final ActivityLogService activityLogService;

    @Transactional
    public Comment add(Long cardId, Long userId, CommentRequest request) {
        Card card = cardService.getEntityWithAccessCheck(cardId, userId);
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = Comment.builder()
                .card(card)
                .author(author)
                .content(request.getContent())
                .build();
        comment = commentRepository.save(comment);

        activityLogService.log(card.getList().getBoard(), author, "COMMENT_ADDED",
                "Commented on \"" + card.getTitle() + "\"");
        return comment;
    }

    public List<Comment> listByCard(Long cardId, Long userId) {
        cardService.getEntityWithAccessCheck(cardId, userId);
        return commentRepository.findByCardIdOrderByCreatedAtAsc(cardId);
    }

    @Transactional
    public Comment update(Long commentId, Long userId, CommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        cardService.getEntityWithAccessCheck(comment.getCard().getId(), userId);

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own comments");
        }
        comment.setContent(request.getContent());
        return commentRepository.save(comment);
    }

    @Transactional
    public void delete(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        cardService.getEntityWithAccessCheck(comment.getCard().getId(), userId);

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
    }
}
