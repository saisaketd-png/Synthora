package com.synthora.document.storage;

import java.io.InputStream;
import org.springframework.core.io.Resource;

public interface StorageService {
    void store(String key, InputStream content);
    void delete(String key);
    boolean exists(String key);
    Resource loadAsResource(String key);
}
