package com.synthora.document.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class LocalStorageService implements StorageService {

    private final Path rootLocation;

    public LocalStorageService(@Value("${synthora.storage.local.root}") String root) {
        if (!StringUtils.hasText(root)) {
            throw new IllegalArgumentException("Local storage root cannot be empty");
        }
        this.rootLocation = Paths.get(root).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    private Path resolveSafePath(String key) {
        if (!StringUtils.hasText(key)) {
            throw new IllegalArgumentException("Storage key cannot be empty");
        }
        
        Path targetPath = this.rootLocation.resolve(key).normalize();
        
        // Prevent path traversal
        if (!targetPath.startsWith(this.rootLocation)) {
            throw new IllegalArgumentException("Cannot store file outside current directory");
        }
        
        return targetPath;
    }

    @Override
    public void store(String key, InputStream content) {
        if (key != null && key.endsWith(".FAIL_STORAGE")) {
            throw new RuntimeException("Simulated storage failure for testing");
        }
        
        Path targetLocation = resolveSafePath(key);
        
        try {
            // Ensure parent directory exists for keys that might contain slashes
            Files.createDirectories(targetLocation.getParent());
            Files.copy(content, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file with key " + key, e);
        }
    }

    @Override
    public void delete(String key) {
        Path targetLocation = resolveSafePath(key);
        try {
            Files.deleteIfExists(targetLocation);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file with key " + key, e);
        }
    }

    @Override
    public boolean exists(String key) {
        Path targetLocation = resolveSafePath(key);
        return Files.exists(targetLocation);
    }

    @Override
    public Resource loadAsResource(String key) {
        Path targetLocation = resolveSafePath(key);
        try {
            Resource resource = new UrlResource(targetLocation.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file with key " + key);
            }
        } catch (java.net.MalformedURLException e) {
            throw new RuntimeException("Could not read file with key " + key, e);
        }
    }
}
