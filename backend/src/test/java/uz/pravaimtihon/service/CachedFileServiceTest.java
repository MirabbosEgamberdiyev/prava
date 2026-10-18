package uz.pravaimtihon.service;

import org.junit.jupiter.api.Test;
import uz.pravaimtihon.service.impl.CachedFileService;

import static org.junit.jupiter.api.Assertions.*;

class CachedFileServiceTest {

    private final CachedFileService cachedFileService = new CachedFileService("uploads");

    @Test
    void servesRawImageBytesWithoutWatermark() throws Exception {
        byte[] dummyData = "clean-raw-image-bytes".getBytes();

        byte[] result = cachedFileService.applyWatermarkIfNeeded("questions", "sample.jpg", dummyData);

        assertNotNull(result);
        assertArrayEquals(dummyData, result);
    }

    @Test
    void skipsWatermarkForNonImageOrOtherFolders() {
        byte[] dummyData = "test-document-content".getBytes();

        // Documents folder should not be watermarked
        byte[] docResult = cachedFileService.applyWatermarkIfNeeded("documents", "doc.pdf", dummyData);
        assertArrayEquals(dummyData, docResult);

        // Non-image file in questions folder
        byte[] txtResult = cachedFileService.applyWatermarkIfNeeded("questions", "readme.txt", dummyData);
        assertArrayEquals(dummyData, txtResult);
    }
}
