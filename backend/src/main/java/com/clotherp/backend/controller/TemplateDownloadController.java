package com.clotherp.backend.controller;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/api/v1/templates")
public class TemplateDownloadController {

    @GetMapping("/product-import")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER')")
    public ResponseEntity<ByteArrayResource> downloadProductTemplate() {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            Sheet sheet = workbook.createSheet("Products");
            
            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            
            // Create headers
            String[] columns = {"Name", "SKU", "Category", "Size", "Color", "Price (₹)", "Cost (₹)", "Material", "Description"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }
            
            // Add sample data
            Object[][] sampleData = {
                {"Pure Silk Banarasi Saree", "SAR-BAN-001", "Sarees", "Free Size", "Royal Blue", 4500.00, 2800.00, "Silk", "Handwoven Banarasi silk saree with gold zari border"},
                {"Men's Cotton Formal Shirt", "SHT-CTN-001", "Shirts", "L", "White", 899.00, 450.00, "Cotton", "Full sleeve formal shirt 100% cotton"},
                {"Women's Anarkali Kurti", "KRT-ANK-001", "Kurtis", "M", "Pink", 1299.00, 700.00, "Cotton", "Floral print anarkali kurti with dupatta"},
                {"Slim Fit Denim Jeans", "JNS-DEN-001", "Jeans", "32", "Dark Blue", 1599.00, 900.00, "Denim", "Slim fit stretchable denim jeans for men"},
            };
            
            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                Object[] rowData = sampleData[i];
                for (int j = 0; j < rowData.length; j++) {
                    Cell cell = row.createCell(j);
                    if (rowData[j] instanceof String) {
                        cell.setCellValue((String) rowData[j]);
                    } else if (rowData[j] instanceof Double) {
                        cell.setCellValue((Double) rowData[j]);
                    }
                }
            }
            
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            workbook.dispose();
            
            ByteArrayResource resource = new ByteArrayResource(out.toByteArray());
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=product-import-template.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(out.size())
                .body(resource);
                
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}