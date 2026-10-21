package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.mapper.UserMapper;
import uz.pravaimtihon.dto.response.FileUploadResponse;
import uz.pravaimtihon.dto.response.UserResponse;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.RateLimitExceededException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.exception.UnauthorizedException;
import uz.pravaimtihon.exception.ValidationException;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.SecurityUtils;
import uz.pravaimtihon.util.InMemoryMultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Foydalanuvchi avatari: rasm yuklash (kamera/galereya), tayyor avatarlardan tanlash va o'chirish.
 *
 * <p>Xavfsizlik: tur e'lon qilingan Content-Type bo'yicha emas, fayl boshidagi "sehrli baytlar" bo'yicha
 * aniqlanadi (JPEG/PNG/WebP); JPEG va PNG serverda qayta kodlanadi — EXIF (GPS joylashuv) va boshqa
 * metama'lumotlar o'chadi, rasm kvadratga kesiladi va 1024 px gacha kichraytiriladi. Fayl nomi UUID,
 * saqlash — mavjud {@code profiles} papkasi ({@code GET /api/v1/files/profiles/**} ochiq).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AvatarService {

    public static final long MAX_AVATAR_BYTES = 3L * 1024 * 1024;
    static final int MAX_DIMENSION = 1024;
    static final int MAX_SOURCE_DIMENSION = 8000;
    static final int MAX_UPLOADS_PER_HOUR = 20;
    static final String AVATAR_FOLDER = "profiles";
    static final String OWN_UPLOAD_PREFIX = "/api/v1/files/profiles/";

    /** Tayyor avatarlar (haydovchi/avtomobil mavzusi) — backend resurslaridan beriladi. */
    public static final List<String> PRESET_IDS = List.of(
            "driver", "steering-wheel", "sport-car", "traffic-light",
            "road-sign", "car-key", "racing-helmet", "route");
    public static final String PRESET_PREFIX = "/api/v1/public/avatars/";

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final FileStorageManager fileStorageManager;
    private final CachedFileService cachedFileService;

    private final Map<Long, Deque<Instant>> uploadTimes = new ConcurrentHashMap<>();

    enum ImageKind {
        JPEG("image/jpeg", ".jpg"),
        PNG("image/png", ".png"),
        WEBP("image/webp", ".webp");

        final String mime;
        final String extension;

        ImageKind(String mime, String extension) {
            this.mime = mime;
            this.extension = extension;
        }
    }

    public static String presetUrl(String id) {
        return PRESET_PREFIX + id + ".svg";
    }

    public static boolean isPresetUrl(String url) {
        if (url == null || !url.startsWith(PRESET_PREFIX) || !url.endsWith(".svg")) return false;
        String id = url.substring(PRESET_PREFIX.length(), url.length() - ".svg".length());
        return PRESET_IDS.contains(id);
    }

    // ------------------------------------------------------------------ upload

    @Transactional
    public UserResponse uploadAvatar(MultipartFile file, AcceptLanguage language) {
        User user = currentUser();
        if (file == null || file.isEmpty()) {
            throw new ValidationException("validation.avatar.empty");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new ValidationException("validation.avatar.too_large");
        }
        checkUploadRate(user.getId());

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ValidationException("validation.avatar.unreadable");
        }
        ImageKind kind = sniff(bytes);
        if (kind == null) {
            throw new ValidationException("validation.avatar.unsupported_type");
        }
        // WebP'ni standart ImageIO o'qiy olmaydi — sehrli baytlar va hajm tekshiruvidan keyin o'zgarishsiz saqlanadi
        byte[] stored = kind == ImageKind.WEBP ? bytes : normalize(bytes, kind);

        FileUploadResponse uploaded = fileStorageManager.uploadFile(
                new InMemoryMultipartFile("avatar" + kind.extension, kind.mime, stored), AVATAR_FOLDER);

        String previous = user.getProfileImageUrl();
        user.setProfileImageUrl(uploaded.getFileUrl());
        User saved = userRepository.save(user);
        deleteOwnUploadAfterCommit(previous, saved.getProfileImageUrl());
        log.info("User {} uploaded a new avatar ({}, {} bytes)", saved.getId(), kind, stored.length);
        return userMapper.toResponse(saved, effectiveLanguage(saved, language));
    }

    @Transactional
    public UserResponse removeAvatar(AcceptLanguage language) {
        User user = currentUser();
        applyProfileImage(user, null);
        User saved = userRepository.save(user);
        return userMapper.toResponse(saved, effectiveLanguage(saved, language));
    }

    /**
     * PATCH /me dagi {@code profileImageUrl}: bo'sh/null — avatarni o'chirish (bosh harflarga qaytish),
     * tayyor avatar URL — tanlash, hozirgi qiymatning o'zi — o'zgarishsiz. Boshqa har qanday URL rad etiladi
     * (aks holda istalgan tashqi manzil yoki boshqa foydalanuvchining fayli avatar qilib qo'yilardi).
     */
    public void applyProfileImage(User user, String requested) {
        String value = requested == null ? null : requested.strip();
        String previous = user.getProfileImageUrl();
        if (value == null || value.isEmpty()) {
            user.setProfileImageUrl(null);
        } else if (isPresetUrl(value)) {
            user.setProfileImageUrl(value);
        } else if (value.equals(previous)) {
            return;
        } else {
            throw new ValidationException("validation.avatar.invalid");
        }
        deleteOwnUploadAfterCommit(previous, user.getProfileImageUrl());
    }

    // ------------------------------------------------------------------ helpers

    private User currentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new UnauthorizedException("error.auth.required");
        }
        return userRepository.findById(userId)
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()) && Boolean.TRUE.equals(u.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));
    }

    private static AcceptLanguage effectiveLanguage(User user, AcceptLanguage fallback) {
        return user.getPreferredLanguage() != null ? user.getPreferredLanguage() : fallback;
    }

    private void checkUploadRate(Long userId) {
        Instant now = Instant.now();
        Deque<Instant> times = uploadTimes.computeIfAbsent(userId, k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && Duration.between(times.peekFirst(), now).toHours() >= 1) {
                times.pollFirst();
            }
            if (times.size() >= MAX_UPLOADS_PER_HOUR) {
                throw new RateLimitExceededException("Juda ko'p rasm yuklandi. Birozdan keyin qayta urinib ko'ring");
            }
            times.addLast(now);
        }
    }

    /** Eski yuklangan avatar fayli (faqat o'zimizniki) tranzaksiya muvaffaqiyatli tugagach o'chiriladi. */
    private void deleteOwnUploadAfterCommit(String previous, String current) {
        if (previous == null || !previous.startsWith(OWN_UPLOAD_PREFIX) || previous.equals(current)) return;
        Runnable delete = () -> {
            try {
                fileStorageManager.deleteFile(previous);
            } catch (Exception e) {
                log.warn("Old avatar could not be deleted: {}", e.getMessage());
            } finally {
                // Ochiq GET /api/v1/files/profiles/** kesh orqali beriladi — o'chirilgan rasm ko'rinib qolmasin
                cachedFileService.evict(AVATAR_FOLDER, previous.substring(OWN_UPLOAD_PREFIX.length()));
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    delete.run();
                }
            });
        } else {
            delete.run();
        }
    }

    static ImageKind sniff(byte[] b) {
        if (b == null || b.length < 12) return null;
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return ImageKind.JPEG;
        if ((b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) return ImageKind.PNG;
        if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return ImageKind.WEBP;
        return null;
    }

    /**
     * Rasmni o'qib (o'lchamlari avval tekshiriladi — "dekompressiya bombasi"dan himoya), markazdan kvadratga
     * kesadi, {@value #MAX_DIMENSION} px gacha kichraytiradi va metama'lumotsiz qayta kodlaydi.
     */
    static byte[] normalize(byte[] bytes, ImageKind kind) {
        BufferedImage source;
        int width;
        int height;
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = in == null ? null : ImageIO.getImageReaders(in);
            if (readers == null || !readers.hasNext()) {
                throw new ValidationException("validation.avatar.unreadable");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(in, true, true);
                width = reader.getWidth(0);
                height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > MAX_SOURCE_DIMENSION || height > MAX_SOURCE_DIMENSION) {
                    throw new ValidationException("validation.avatar.bad_dimensions");
                }
                source = reader.read(0);
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
            if (e instanceof ValidationException ve) throw ve;
            throw new ValidationException("validation.avatar.unreadable");
        }

        int side = Math.min(width, height);
        int x = (width - side) / 2;
        int y = (height - side) / 2;
        int target = Math.min(side, MAX_DIMENSION);
        boolean alpha = kind == ImageKind.PNG;
        BufferedImage out = new BufferedImage(target, target, alpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            if (!alpha) {
                g.setColor(Color.WHITE);
                g.fillRect(0, 0, target, target);
            }
            g.drawImage(source, 0, 0, target, target, x, y, x + side, y + side, null);
        } finally {
            g.dispose();
        }

        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            if (kind == ImageKind.JPEG) {
                writeJpeg(out, bos);
            } else if (!ImageIO.write(out, "png", bos)) {
                throw new ValidationException("validation.avatar.unreadable");
            }
            return bos.toByteArray();
        } catch (IOException e) {
            throw new ValidationException("validation.avatar.unreadable");
        }
    }

    private static void writeJpeg(BufferedImage image, ByteArrayOutputStream bos) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) throw new IOException("No JPEG writer");
        ImageWriter writer = writers.next();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(bos)) {
            writer.setOutput(ios);
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(0.88f);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
    }
}
