package uz.pravaimtihon.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.exception.FileStorageException;

import java.awt.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Slf4j
public class CachedFileService {

    private final Path uploadDir;

    public CachedFileService(@Value("${app.storage.local.upload-dir:uploads}") String uploadDirStr) {
        this.uploadDir = Paths.get(uploadDirStr).toAbsolutePath().normalize();
    }

    private Path resolveFilePath(String folder, String filename) {
        Path filePath = uploadDir.resolve(folder).resolve(filename).normalize();
        if (!filePath.startsWith(uploadDir)) {
            throw new FileStorageException("Invalid file path");
        }

        if (!Files.exists(filePath)) {
            if ("questions".equals(folder)) {
                Path fallback = uploadDir.resolve("general").resolve(filename).normalize();
                if (fallback.startsWith(uploadDir) && Files.exists(fallback)) {
                    return fallback;
                }
            } else if ("general".equals(folder)) {
                Path fallback = uploadDir.resolve("questions").resolve(filename).normalize();
                if (fallback.startsWith(uploadDir) && Files.exists(fallback)) {
                    return fallback;
                }
            }
        }
        return filePath;
    }

    /**
     * ✅ Get file with caching
     * Cache key: folder + filename
     * TTL: 1 hour (configured in application.yaml)
     */
    @Cacheable(value = "fileCache", key = "#folder + ':' + #filename")
    public byte[] getCachedFile(String folder, String filename) {
        try {
            Path filePath = resolveFilePath(folder, filename);

            if (!Files.exists(filePath)) {
                log.warn("File not found: {}/{}", folder, filename);
                throw new FileStorageException("File not found: " + filename);
            }

            byte[] fileData = Files.readAllBytes(filePath);
            fileData = applyWatermarkIfNeeded(folder, filename, fileData);
            log.debug("✅ File loaded and watermarked (will be cached): {}/{}", folder, filename);

            return fileData;

        } catch (IOException e) {
            log.error("Error reading file: {}/{}", folder, filename, e);
            throw new FileStorageException("Failed to read file: " + e.getMessage());
        }
    }

    /**
     * Server tomonda savol rasmlari ustiga yarim shaffof watermark muhrlaydi.
     * "Prava Online • pravaonline.uz"
     */
    public byte[] applyWatermarkIfNeeded(String folder, String filename, byte[] rawBytes) {
        if (!"questions".equals(folder) && !"general".equals(folder)) {
            return rawBytes;
        }

        String lower = filename.toLowerCase();
        if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
            return rawBytes;
        }

        try {
            ByteArrayInputStream in = new ByteArrayInputStream(rawBytes);
            BufferedImage original = ImageIO.read(in);
            if (original == null) {
                return rawBytes;
            }

            int width = original.getWidth();
            int height = original.getHeight();

            boolean isPng = lower.endsWith(".png");
            BufferedImage watermarked = new BufferedImage(
                    width, height, isPng ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB
            );

            Graphics2D g2d = watermarked.createGraphics();
            g2d.drawImage(original, 0, 0, null);

            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            String watermarkText = "Prava Online \u2022 pravaonline.uz";

            int fontSize = Math.max(14, Math.min(width, height) / 22);
            Font font = new Font(Font.SANS_SERIF, Font.BOLD, fontSize);
            g2d.setFont(font);

            FontMetrics fm = g2d.getFontMetrics();
            int textWidth = fm.stringWidth(watermarkText);
            int textHeight = fm.getHeight();

            // 1. Semi-transparent diagonal watermarks in grid pattern
            Graphics2D rotG2d = (Graphics2D) g2d.create();
            rotG2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.18f));
            rotG2d.rotate(Math.toRadians(-25), width / 2.0, height / 2.0);

            int stepX = textWidth + 80;
            int stepY = textHeight + 90;
            int diag = (int) Math.sqrt(width * width + height * height);

            for (int x = -diag; x < diag * 2; x += stepX) {
                for (int y = -diag; y < diag * 2; y += stepY) {
                    rotG2d.setColor(Color.BLACK);
                    rotG2d.drawString(watermarkText, x + 1, y + 1);
                    rotG2d.setColor(Color.WHITE);
                    rotG2d.drawString(watermarkText, x, y);
                }
            }
            rotG2d.dispose();

            // 2. Clear bottom-right badge watermark
            g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.45f));
            int badgeX = width - textWidth - 16;
            int badgeY = height - 14;
            if (badgeX > 10 && badgeY > 20) {
                g2d.setColor(new Color(0, 0, 0, 160));
                g2d.drawString(watermarkText, badgeX + 1, badgeY + 1);
                g2d.setColor(new Color(255, 255, 255, 230));
                g2d.drawString(watermarkText, badgeX, badgeY);
            }

            g2d.dispose();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            String formatName = isPng ? "png" : "jpeg";
            ImageIO.write(watermarked, formatName, out);
            return out.toByteArray();

        } catch (Exception e) {
            log.warn("Watermark failed for {}/{}, serving original: {}", folder, filename, e.getMessage());
            return rawBytes;
        }
    }

    /**
     * ✅ Get content type
     */
    @Cacheable(value = "contentTypeCache", key = "#folder + ':' + #filename")
    public String getContentType(String folder, String filename) {
        try {
            Path filePath = resolveFilePath(folder, filename);

            if (!Files.exists(filePath)) {
                return "application/octet-stream";
            }

            String contentType = Files.probeContentType(filePath);
            return contentType != null ? contentType : "application/octet-stream";

        } catch (Exception e) {
            log.error("Error detecting content type: {}/{}", folder, filename, e);
            return "application/octet-stream";
        }
    }

    /**
     * ✅ Check if file exists (cached)
     */
    @Cacheable(value = "fileExistsCache", key = "#folder + ':' + #filename")
    public boolean fileExists(String folder, String filename) {
        try {
            Path filePath = resolveFilePath(folder, filename);
            return Files.exists(filePath);

        } catch (Exception e) {
            log.error("Error checking file existence: {}/{}", folder, filename, e);
            return false;
        }
    }
}