package com.kanban.app.service;

import com.kanban.app.dto.request.CardRequest;
import com.kanban.app.dto.request.MoveCardRequest;
import com.kanban.app.entity.*;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.CardRepository;
import com.kanban.app.repository.LabelRepository;
import com.kanban.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final LabelRepository labelRepository;
    private final BoardListService boardListService;
    private final ActivityLogService activityLogService;

    @Transactional
    public Card create(Long listId, Long userId, CardRequest request) {
        BoardList list = boardListService.getEntityWithAccessCheck(listId, userId);
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        int nextPosition = cardRepository.findByListIdAndArchivedFalseOrderByPositionAsc(listId).size();

        Card card = Card.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .list(list)
                .position(nextPosition)
                .createdBy(creator)
                .archived(false)
                .build();
        card = cardRepository.save(card);

        activityLogService.log(list.getBoard(), creator, "CARD_CREATED",
                "Created card \"" + card.getTitle() + "\"");
        return card;
    }

    public Card getEntityWithAccessCheck(Long cardId, Long userId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        boardListService.getEntityWithAccessCheck(card.getList().getId(), userId);
        return card;
    }

    public List<Card> listByList(Long listId, Long userId) {
        boardListService.getEntityWithAccessCheck(listId, userId);
        return cardRepository.findByListIdAndArchivedFalseOrderByPositionAsc(listId);
    }

    @Transactional
    public Card update(Long cardId, Long userId, CardRequest request) {
        Card card = getEntityWithAccessCheck(cardId, userId);
        card.setTitle(request.getTitle());
        card.setDescription(request.getDescription());
        card.setDueDate(request.getDueDate());
        card = cardRepository.save(card);

        activityLogService.log(card.getList().getBoard(), currentUser(userId), "CARD_UPDATED",
                "Updated card \"" + card.getTitle() + "\"");
        return card;
    }

    /**
     * Handles drag-and-drop: moves a card to a (possibly new) list and re-indexes
     * positions of both the source and target list so ordering stays contiguous.
     */
    @Transactional
    public Card move(Long cardId, Long userId, MoveCardRequest request) {
        Card card = getEntityWithAccessCheck(cardId, userId);
        BoardList sourceList = card.getList();
        BoardList targetList = boardListService.getEntityWithAccessCheck(request.getTargetListId(), userId);

        List<Card> sourceCards = cardRepository.findByListIdAndArchivedFalseOrderByPositionAsc(sourceList.getId());
        sourceCards.remove(card);

        if (sourceList.getId().equals(targetList.getId())) {
            int target = Math.max(0, Math.min(request.getNewPosition(), sourceCards.size()));
            sourceCards.add(target, card);
            reindex(sourceCards);
        } else {
            reindex(sourceCards);
            List<Card> targetCards = cardRepository.findByListIdAndArchivedFalseOrderByPositionAsc(targetList.getId());
            int target = Math.max(0, Math.min(request.getNewPosition(), targetCards.size()));
            card.setList(targetList);
            targetCards.add(target, card);
            reindex(targetCards);
        }

        activityLogService.log(targetList.getBoard(), currentUser(userId), "CARD_MOVED",
                "Moved card \"" + card.getTitle() + "\" to list \"" + targetList.getName() + "\"");

        return cardRepository.save(card);
    }

    private void reindex(List<Card> cards) {
        for (int i = 0; i < cards.size(); i++) {
            cards.get(i).setPosition(i);
        }
        cardRepository.saveAll(cards);
    }

    @Transactional
    public void archive(Long cardId, Long userId) {
        Card card = getEntityWithAccessCheck(cardId, userId);
        card.setArchived(true);
        cardRepository.save(card);
        activityLogService.log(card.getList().getBoard(), currentUser(userId), "CARD_ARCHIVED",
                "Archived card \"" + card.getTitle() + "\"");
    }

    @Transactional
    public Card addLabel(Long cardId, Long labelId, Long userId) {
        Card card = getEntityWithAccessCheck(cardId, userId);
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found"));
        card.getLabels().add(label);
        return cardRepository.save(card);
    }

    @Transactional
    public Card removeLabel(Long cardId, Long labelId, Long userId) {
        Card card = getEntityWithAccessCheck(cardId, userId);
        card.getLabels().removeIf(l -> l.getId().equals(labelId));
        return cardRepository.save(card);
    }

    @Transactional
    public Card assignMember(Long cardId, Long memberUserId, Long userId) {
        Card card = getEntityWithAccessCheck(cardId, userId);
        User member = userRepository.findById(memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        card.getAssignees().add(member);
        return cardRepository.save(card);
    }

    @Transactional
    public Card unassignMember(Long cardId, Long memberUserId, Long userId) {
        Card card = getEntityWithAccessCheck(cardId, userId);
        card.getAssignees().removeIf(u -> u.getId().equals(memberUserId));
        return cardRepository.save(card);
    }

    public List<Card> search(Long boardId, Long userId, String query) {
        // access check happens implicitly via board membership required elsewhere;
        // repeated here defensively through BoardService in the controller layer.
        return cardRepository.searchByBoardIdAndTitle(boardId, query);
    }

    public List<Card> filter(Long boardId, Long labelId, Long assigneeId) {
        return cardRepository.filterByBoard(boardId, labelId, assigneeId);
    }

    private User currentUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
