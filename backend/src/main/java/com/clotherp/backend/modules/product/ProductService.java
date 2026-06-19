package com.clotherp.backend.modules.product;

import com.clotherp.backend.common.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductService {
    ProductDTO createProduct(ProductDTO request);
    ProductDTO updateProduct(UUID id, ProductDTO request);
    ProductDTO getProductById(UUID id);
    ProductDTO getProductBySku(String sku);
    Page<ProductDTO> getAllProducts(Pageable pageable);
    void deleteProduct(UUID id);
}
