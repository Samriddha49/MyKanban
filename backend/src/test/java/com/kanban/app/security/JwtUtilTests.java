package com.kanban.app.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class JwtUtilTests {

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void generatesAndValidatesToken() {
        String token = jwtUtil.generateToken(1L, "test@example.com");
        assertNotNull(token);
        assertEquals("test@example.com", jwtUtil.extractEmail(token));
        assertEquals(1L, jwtUtil.extractUserId(token));
        assertTrue(jwtUtil.isTokenValid(token, "test@example.com"));
    }
}
