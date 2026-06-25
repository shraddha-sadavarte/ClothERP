// backend/src/main/java/com/clotherp/backend/modules/product/ProductImportController.java
package com.clotherp.backend.modules.product;

import com.clotherp.backend.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductImportController {

    private final ProductImportService productImportService;

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importProducts(
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Validate file is not empty
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Please select a file to upload"));
            }
            
            // Validate file type
            String fileName = file.getOriginalFilename();
            if (fileName == null || !(fileName.endsWith(".xlsx") || fileName.endsWith(".xls"))) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Please upload an Excel file (.xlsx or .xls)"));
            }
            
            // Validate file size (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "File size exceeds 5MB limit"));
            }
            
            // Import products from Excel
            ProductImportService.ImportResult result = productImportService.importProductsFromExcel(file);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("successCount", result.getSuccessCount());
            responseData.put("errors", result.getErrors());
            
            if (result.hasErrors()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.<Map<String, Object>>error(
                        HttpStatus.BAD_REQUEST.value(),
                        String.format("Imported %d products with %d errors", 
                            result.getSuccessCount(), 
                            result.getErrors().size())
                    ));
            }
            
            return ResponseEntity.ok(
                ApiResponse.ok(
                    responseData,
                    String.format("Successfully imported %d products", result.getSuccessCount())
                )
            );
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
        }
    }
}