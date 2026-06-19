package com.clotherp.backend.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

// com/clotherp/common/ApiResponse.java
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T>
 {
    private boolean success;
    private int statusCode;
    private String message;
    private T data;
    private List<String> errors;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
            .success(true).statusCode(200)
            .message("Success").data(data)
            .timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder()
            .success(true).statusCode(200)
            .message(message).data(data)
            .timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
            .success(false).statusCode(code)
            .message(message)
            .timestamp(LocalDateTime.now()).build();
    }
 }