package com.clotherp.backend.modules.customer;

import com.clotherp.backend.common.BusinessException;
import com.clotherp.backend.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    @Override
    public Customer createCustomer(Customer customer) {
        if (customerRepository.findByPhone(customer.getPhone()).isPresent()) {
            throw new BusinessException("Customer with this phone number already exists.");
        }
        return customerRepository.save(customer);
    }

    @Override
    public Customer updateCustomer(UUID id, Customer details) {
        Customer existing = getCustomerById(id);
        existing.setFullName(details.getFullName());
        existing.setEmail(details.getEmail());
        if (!existing.getPhone().equals(details.getPhone())
                && customerRepository.findByPhone(details.getPhone()).isPresent()) {
            throw new BusinessException("Customer with this phone number already exists.");
        }
        existing.setPhone(details.getPhone());
        existing.setLoyaltyPoints(details.getLoyaltyPoints());
        return customerRepository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public Customer getCustomerById(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Customer> searchCustomers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return customerRepository.findAll();
        }
        return customerRepository.findByFullNameContainingIgnoreCaseOrPhoneContaining(query, query);
    }
}