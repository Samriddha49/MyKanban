package com.kanban.app.service;

import com.kanban.app.dto.request.AttachmentRequest;
import com.kanban.app.entity.Attachment;
import com.kanban.app.entity.Card;
import com.kanban.app.entity.User;
import com.kanban.app.exception.ForbiddenException;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.AttachmentRepository;
import com.kanban.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final CardService cardService;

    public Attachment add(Long cardId, Long userId, AttachmentRequest request) {
        Card card = cardService.getEntityWithAccessCheck(cardId, userId);
        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Attachment attachment = Attachment.builder()
                .card(card)
                .fileName(request.getFileName())
                .url(request.getUrl())
                .uploadedBy(uploader)
                .build();
        return attachmentRepository.save(attachment);
    }

    public List<Attachment> listByCard(Long cardId, Long userId) {
        cardService.getEntityWithAccessCheck(cardId, userId);
        return attachmentRepository.findByCardId(cardId);
    }

    public void delete(Long attachmentId, Long userId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        cardService.getEntityWithAccessCheck(attachment.getCard().getId(), userId);

        if (!attachment.getUploadedBy().getId().equals(userId)) {
            throw new ForbiddenException("You can only delete attachments you uploaded");
        }
        attachmentRepository.delete(attachment);
    }
}
