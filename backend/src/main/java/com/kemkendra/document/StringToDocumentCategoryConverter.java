package com.kemkendra.document;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToDocumentCategoryConverter implements Converter<String, DocumentCategory> {

    @Override
    public DocumentCategory convert(String source) {
        return DocumentCategory.fromString(source);
    }
}
