package com.kemkendra.seller;

import com.kemkendra.identity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, UUID> {
    Optional<SellerProfile> findByUser(User user);
    
    List<SellerProfile> findByUserIn(List<User> users);
}