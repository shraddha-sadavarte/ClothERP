package com.clotherp.backend.modules.product;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public ProductDTO createProduct(ProductDTO request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new IllegalArgumentException("Product with SKU '" + request.getSku() + "' already exists.");
        }
        Product product = toEntity(request);
        return toDTO(productRepository.save(product));
    }

    @Override
    public ProductDTO updateProduct(UUID id, ProductDTO request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        product.setCategory(request.getCategory());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setMaterial(request.getMaterial());
        return toDTO(productRepository.save(product));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(UUID id) {
        return productRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .map(this::toDTO)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with SKU: " + sku));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toDTO);
    }

    @Override
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        product.setDeleted(true);
        productRepository.save(product);
    }

    // ── Mapper helpers ──────────────────────────────────────────────────────────

    private ProductDTO toDTO(Product p) {
        return ProductDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .description(p.getDescription())
                .price(p.getPrice())
                .cost(p.getCost())
                .category(p.getCategory())
                .size(p.getSize())
                .color(p.getColor())
                .material(p.getMaterial())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private Product toEntity(ProductDTO dto) {
        return Product.builder()
                .name(dto.getName())
                .sku(dto.getSku())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .cost(dto.getCost())
                .category(dto.getCategory())
                .size(dto.getSize())
                .color(dto.getColor())
                .material(dto.getMaterial())
                .build();
    }
}
