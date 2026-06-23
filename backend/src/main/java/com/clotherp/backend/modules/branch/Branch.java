package com.clotherp.backend.modules.branch;

import com.clotherp.backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "branches")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Branch extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(columnDefinition = "text")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(name = "pin_code", length = 10)
    private String pinCode;

    @Column(length = 20)
    private String phone;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
