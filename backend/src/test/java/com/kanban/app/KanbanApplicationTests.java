package com.kanban.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class KanbanApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the Spring application context (security, JPA, controllers) wires up correctly.
    }
}
