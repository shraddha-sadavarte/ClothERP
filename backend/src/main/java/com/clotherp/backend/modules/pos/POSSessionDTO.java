package com.clotherp.backend.modules.pos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class POSSessionDTO {
    private String sessionId;
    private LocalDateTime startedAt;
    private String status;
}