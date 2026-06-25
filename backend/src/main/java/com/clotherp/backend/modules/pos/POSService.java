package com.clotherp.backend.modules.pos;

import com.clotherp.backend.modules.sales.SalesOrderDTO;

import java.util.List;
import java.util.UUID;

public interface POSService {
    List<ProductSearchDTO> searchProducts(String search, UUID branchId);
    SalesOrderDTO processCheckout(POSCheckoutRequest request);
    List<CustomerSearchDTO> searchCustomers(String search);
    POSSessionDTO getCurrentSession();
}