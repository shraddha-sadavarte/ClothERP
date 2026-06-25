package com.clotherp.backend.modules.product;

import com.clotherp.backend.common.BusinessException;
import com.clotherp.backend.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor

public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public ProductDTO createProduct(ProductDTO request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new BusinessException("Product with SKU '" + request.getSku() + "' already exists.");
        }
        Product product = toEntity(request);
        // ensure branchId is set
        if (product.getBranchId() == null) {
            throw new BusinessException("Branch ID is required for product creation.");
        }
        return toDTO(productRepository.save(product));
    }

    @Override
    public ProductDTO updateProduct(UUID id, ProductDTO request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCost(request.getCost());
        product.setCategory(request.getCategory());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setMaterial(request.getMaterial());
        // branchId cannot be changed via update
        return toDTO(productRepository.save(product));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(UUID id) {
        return productRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Product with SKU: " + sku));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProducts(Pageable pageable, UUID branchId) {
        if (branchId == null) {
            return getAllProducts(pageable);
        }
        return productRepository.findByBranchId(branchId, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(String search, Pageable pageable, UUID branchId) {
        if (branchId == null) {
            // if no branch, search all products (but we should restrict)
            return productRepository.findAll(pageable).map(this::toDTO);
        }
        return productRepository.searchByBranchAndKeyword(branchId, search, pageable).map(this::toDTO);
    }

    @Override
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
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
                .branchId(p.getBranchId())
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
                .branchId(dto.getBranchId())
                .build();
    }
}