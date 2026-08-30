package com.synthora.identity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    long countByRoleAndStatusAndDeletedAtIsNull(UserRole role, UserStatus status);

    java.util.List<User> findByRoleAndStatusAndDeletedAtIsNull(UserRole role, UserStatus status);

    java.util.List<User> findByRole(UserRole role);
}

