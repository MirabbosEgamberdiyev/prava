package uz.pravaimtihon.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;

/**
 * Server o'zi tayyorlagan (masalan, qayta kodlangan avatar) baytlarni mavjud saqlash servislariga
 * ({@code FileStorageManager}) MultipartFile sifatida uzatish uchun.
 */
public class InMemoryMultipartFile implements MultipartFile {

    private final String originalFilename;
    private final String contentType;
    private final byte[] content;

    public InMemoryMultipartFile(String originalFilename, String contentType, byte[] content) {
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.content = content != null ? content : new byte[0];
    }

    @Override
    public String getName() {
        return "file";
    }

    @Override
    public String getOriginalFilename() {
        return originalFilename;
    }

    @Override
    public String getContentType() {
        return contentType;
    }

    @Override
    public boolean isEmpty() {
        return content.length == 0;
    }

    @Override
    public long getSize() {
        return content.length;
    }

    @Override
    public byte[] getBytes() {
        return content.clone();
    }

    @Override
    public InputStream getInputStream() {
        return new ByteArrayInputStream(content);
    }

    @Override
    public void transferTo(File dest) throws IOException {
        Files.write(dest.toPath(), content);
    }
}
