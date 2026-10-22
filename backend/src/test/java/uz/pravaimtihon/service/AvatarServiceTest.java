package uz.pravaimtihon.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.mapper.UserMapper;
import uz.pravaimtihon.dto.response.FileUploadResponse;
import uz.pravaimtihon.dto.response.UserResponse;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.exception.RateLimitExceededException;
import uz.pravaimtihon.exception.ValidationException;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.CustomUserDetails;
import uz.pravaimtihon.service.impl.AvatarService;
import uz.pravaimtihon.service.impl.CachedFileService;
import uz.pravaimtihon.service.impl.FileStorageManager;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.zip.CRC32;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Avatar upload / preset selection")
class AvatarServiceTest {

    private UserRepository users;
    private FileStorageManager storage;
    private CachedFileService cache;
    private AvatarService service;
    private User user;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        storage = mock(FileStorageManager.class);
        UserMapper mapper = mock(UserMapper.class);
        cache = mock(CachedFileService.class);
        service = new AvatarService(users, mapper, storage, cache);

        user = User.builder().firstName("Ali").phoneNumber("998901234567").role(Role.USER)
                .preferredLanguage(AcceptLanguage.UZL).build();
        user.setId(5L);
        user.setIsActive(true);
        user.setDeleted(false);
        CustomUserDetails details = CustomUserDetails.from(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));

        when(users.findById(5L)).thenReturn(Optional.of(user));
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any(User.class), any())).thenAnswer(inv ->
                UserResponse.builder().id(5L).profileImageUrl(((User) inv.getArgument(0)).getProfileImageUrl()).build());
        when(storage.uploadFile(any(MultipartFile.class), eq("profiles"))).thenAnswer(inv -> {
            MultipartFile f = inv.getArgument(0);
            return FileUploadResponse.builder().fileUrl("/api/v1/files/profiles/new" + f.getOriginalFilename().substring(6)).build();
        });
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private static byte[] image(String format, int w, int h) throws Exception {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.ORANGE);
        g.fillRect(0, 0, w, h);
        g.dispose();
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ImageIO.write(img, format, bos);
        return bos.toByteArray();
    }

    /** Faqat sarlavhasi 9000×9000 deb da'vo qiladigan PNG (dekompressiya bombasi namunasi). */
    private static byte[] hugePngHeader() {
        ByteBuffer ihdr = ByteBuffer.allocate(13).putInt(9000).putInt(9000).put((byte) 8).put((byte) 2)
                .put((byte) 0).put((byte) 0).put((byte) 0);
        CRC32 crc = new CRC32();
        crc.update("IHDR".getBytes(StandardCharsets.US_ASCII));
        crc.update(ihdr.array());
        return ByteBuffer.allocate(8 + 25)
                .put(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})
                .putInt(13).put("IHDR".getBytes(StandardCharsets.US_ASCII)).put(ihdr.array()).putInt((int) crc.getValue())
                .array();
    }

    @Test
    @DisplayName("JPEG upload: re-encoded to a square ≤1024 px image, stored under profiles, URL saved")
    void uploadJpeg() throws Exception {
        user.setProfileImageUrl("/api/v1/files/profiles/old.jpg");
        MockMultipartFile file = new MockMultipartFile("file", "IMG_1.HEIC.jpg", "image/jpeg", image("jpg", 1600, 1200));

        UserResponse res = service.uploadAvatar(file, AcceptLanguage.UZL);

        ArgumentCaptor<MultipartFile> stored = ArgumentCaptor.forClass(MultipartFile.class);
        verify(storage).uploadFile(stored.capture(), eq("profiles"));
        assertEquals("image/jpeg", stored.getValue().getContentType());
        assertEquals("avatar.jpg", stored.getValue().getOriginalFilename());
        BufferedImage out = ImageIO.read(new ByteArrayInputStream(stored.getValue().getBytes()));
        assertEquals(1024, out.getWidth());
        assertEquals(1024, out.getHeight());
        assertEquals("/api/v1/files/profiles/new.jpg", res.getProfileImageUrl());
        verify(storage).deleteFile("/api/v1/files/profiles/old.jpg");
        verify(cache).evict("profiles", "old.jpg");
    }

    @Test
    @DisplayName("Small PNG keeps its size (cropped square) and type; Google photo URL is never deleted")
    void uploadPngKeepsExternalPhoto() throws Exception {
        user.setProfileImageUrl("https://lh3.googleusercontent.com/a/photo");
        service.uploadAvatar(new MockMultipartFile("file", "a.png", "image/png", image("png", 300, 500)), AcceptLanguage.UZL);

        ArgumentCaptor<MultipartFile> stored = ArgumentCaptor.forClass(MultipartFile.class);
        verify(storage).uploadFile(stored.capture(), eq("profiles"));
        BufferedImage out = ImageIO.read(new ByteArrayInputStream(stored.getValue().getBytes()));
        assertEquals(300, out.getWidth());
        assertEquals(300, out.getHeight());
        verify(storage, never()).deleteFile(anyString());
    }

    @Test
    @DisplayName("Type is decided by magic bytes: HTML/SVG/GIF disguised as image/jpeg is rejected")
    void rejectsDisguisedFiles() {
        byte[] html = "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8);
        byte[] svg = "<svg xmlns='http://www.w3.org/2000/svg'><script/></svg>".getBytes(StandardCharsets.UTF_8);
        byte[] gif = "GIF89a\u0001\u0000\u0001\u0000\u0000\u0000".getBytes(StandardCharsets.ISO_8859_1);
        for (byte[] bytes : new byte[][]{html, svg, gif}) {
            ValidationException ex = assertThrows(ValidationException.class, () ->
                    service.uploadAvatar(new MockMultipartFile("file", "a.jpg", "image/jpeg", bytes), AcceptLanguage.UZL));
            assertEquals("validation.avatar.unsupported_type", ex.getMessage());
        }
        verify(storage, never()).uploadFile(any(), anyString());
    }

    @Test
    @DisplayName("Size limit 3 MB, empty file and decompression-bomb headers are rejected")
    void limits() {
        byte[] big = new byte[(int) AvatarService.MAX_AVATAR_BYTES + 1];
        assertEquals("validation.avatar.too_large", assertThrows(ValidationException.class, () ->
                service.uploadAvatar(new MockMultipartFile("file", "a.jpg", "image/jpeg", big), AcceptLanguage.UZL)).getMessage());
        assertEquals("validation.avatar.empty", assertThrows(ValidationException.class, () ->
                service.uploadAvatar(new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[0]), AcceptLanguage.UZL)).getMessage());
        assertEquals("validation.avatar.bad_dimensions", assertThrows(ValidationException.class, () ->
                service.uploadAvatar(new MockMultipartFile("file", "a.png", "image/png", hugePngHeader()), AcceptLanguage.UZL)).getMessage());
    }

    @Test
    @DisplayName("Uploads are rate limited per user")
    void rateLimit() throws Exception {
        byte[] jpg = image("jpg", 64, 64);
        for (int i = 0; i < 20; i++) {
            service.uploadAvatar(new MockMultipartFile("file", "a.jpg", "image/jpeg", jpg), AcceptLanguage.UZL);
        }
        assertThrows(RateLimitExceededException.class, () ->
                service.uploadAvatar(new MockMultipartFile("file", "a.jpg", "image/jpeg", jpg), AcceptLanguage.UZL));
    }

    @Test
    @DisplayName("Preset avatars can be chosen, removed; arbitrary URLs are refused")
    void presets() {
        assertEquals(8, AvatarService.PRESET_IDS.size());
        user.setProfileImageUrl("/api/v1/files/profiles/mine.jpg");

        service.applyProfileImage(user, AvatarService.presetUrl("sport-car"));
        assertEquals("/api/v1/public/avatars/sport-car.svg", user.getProfileImageUrl());
        verify(storage).deleteFile("/api/v1/files/profiles/mine.jpg");

        service.applyProfileImage(user, "/api/v1/public/avatars/sport-car.svg"); // same value — no-op
        assertThrows(ValidationException.class, () -> service.applyProfileImage(user, "https://evil.example/x.png"));
        assertThrows(ValidationException.class, () -> service.applyProfileImage(user, "/api/v1/files/profiles/someone-else.jpg"));
        assertThrows(ValidationException.class, () -> service.applyProfileImage(user, "/api/v1/public/avatars/../../secret.svg"));

        service.applyProfileImage(user, "  ");
        assertNull(user.getProfileImageUrl());
    }
}
