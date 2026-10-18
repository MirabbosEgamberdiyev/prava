package uz.pravaimtihon.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import uz.pravaimtihon.service.BundleCryptoService;
import uz.pravaimtihon.service.OfflineBundleService;
import uz.pravaimtihon.service.impl.UserAppService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserAppControllerTest {

    private MockMvc mockMvc;

    @Mock private UserAppService userAppService;
    @Mock private OfflineBundleService offlineBundleService;
    @Mock private BundleCryptoService bundleCryptoService;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks
    private UserAppController controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getOfflineBundleRejectsBrowserRequestsWith403() throws Exception {
        // Request with Origin from web domain
        mockMvc.perform(get("/api/v1/app/offline-bundle")
                        .header("Origin", "https://web.pravaonline.uz"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        // Request with Sec-Fetch-Mode from browser
        mockMvc.perform(get("/api/v1/app/offline-bundle")
                        .header("Sec-Fetch-Mode", "cors"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        // Request with web client platform header
        mockMvc.perform(get("/api/v1/app/offline-bundle")
                        .header("X-Client-Platform", "web"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOfflineBundleServesEncryptedBinaryToDesktopOrMobile() throws Exception {
        OfflineBundleService.Bundle mockBundle = new OfflineBundleService.Bundle("v2-test", List.of(), List.of(), List.of());
        when(offlineBundleService.currentVersionFor(any())).thenReturn("v2-test");
        when(offlineBundleService.getBundleFor(any())).thenReturn(mockBundle);

        byte[] fakeJson = "{}".getBytes();
        byte[] fakeEncrypted = "PRAVSEEDfakeencrypteddata".getBytes();
        when(objectMapper.writeValueAsBytes(any())).thenReturn(fakeJson);
        when(bundleCryptoService.encryptBundle(fakeJson)).thenReturn(fakeEncrypted);

        mockMvc.perform(get("/api/v1/app/offline-bundle")
                        .header("X-Client-Platform", "desktop"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Encrypted-Algorithm", "AES-256-GCM"))
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
                .andExpect(content().bytes(fakeEncrypted));
    }
}
