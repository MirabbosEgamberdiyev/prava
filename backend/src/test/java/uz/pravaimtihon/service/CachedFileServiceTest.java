package uz.pravaimtihon.service;

import org.junit.jupiter.api.Test;
import uz.pravaimtihon.service.impl.CachedFileService;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class CachedFileServiceTest {

    private final CachedFileService cachedFileService = new CachedFileService("uploads");

    @Test
    void watermarksJpegImageCorrectly() throws Exception {
        // Create simple 200x200 JPEG in memory
        BufferedImage img = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 200, 200);
        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "jpeg", out);
        byte[] rawJpeg = out.toByteArray();

        byte[] watermarked = cachedFileService.applyWatermarkIfNeeded("questions", "sample.jpg", rawJpeg);

        assertNotNull(watermarked);
        assertTrue(watermarked.length > 0);

        // Verify readable as image
        BufferedImage result = ImageIO.read(new ByteArrayInputStream(watermarked));
        assertNotNull(result);
        assertEquals(200, result.getWidth());
        assertEquals(200, result.getHeight());
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
