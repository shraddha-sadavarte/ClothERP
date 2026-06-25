package com.clotherp.backend.modules.pos;

import com.clotherp.backend.modules.sales.SalesOrderDTO;

import java.util.List;

public interface POSService {
    List<ProductSearchDTO> searchProducts(String search);
    SalesOrderDTO processCheckout(POSCheckoutRequest request);
    List<CustomerSearchDTO> searchCustomers(String search);
    POSSessionDTO getCurrentSession();
}