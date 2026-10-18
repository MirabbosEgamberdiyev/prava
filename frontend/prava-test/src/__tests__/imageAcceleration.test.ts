import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getImageUrl,
  imageMemoryCache,
  preloadQuestionImage,
  preloadUpcomingImages,
} from "../utils/imageUtils";

describe("Image Acceleration & Preload System", () => {
  beforeEach(() => {
    imageMemoryCache.clear();
    vi.restoreAllMocks();
  });

  it("resolves direct URLs without modification", () => {
    expect(getImageUrl("https://example.com/test.png")).toBe("https://example.com/test.png");
    expect(getImageUrl("data:image/png;base64,...")).toBe("data:image/png;base64,...");
    expect(getImageUrl("blob:http://localhost/123")).toBe("blob:http://localhost/123");
  });

  it("handles null or empty paths safely", () => {
    expect(getImageUrl(null)).toBeUndefined();
    expect(getImageUrl("")).toBeUndefined();
    expect(getImageUrl("   ")).toBeUndefined();
  });

  it("resolves relative question image paths", () => {
    const url = getImageUrl("questions/q123.jpg");
    expect(url).toBeDefined();
    expect(url).toContain("/api/v1/files/questions/q123.jpg");
  });

  it("preloads question image and populates imageMemoryCache on load", () => {
    let mockImgOnload: (() => void) | null = null;
    let createdSrc = "";

    // Mock global Image constructor
    const originalImage = globalThis.Image;
    globalThis.Image = class MockImage {
      decoding = "async";
      set src(val: string) {
        createdSrc = val;
        // Simulate immediate async load
        if (mockImgOnload) mockImgOnload();
      }
      set onload(fn: () => void) {
        mockImgOnload = fn;
      }
    } as unknown as typeof Image;

    try {
      preloadQuestionImage("questions/sample.webp");
      expect(createdSrc).toContain("/api/v1/files/questions/sample.webp");
      expect(imageMemoryCache.has(createdSrc)).toBe(true);

      // Subsequent call should skip because it's already in memory cache
      createdSrc = "";
      preloadQuestionImage("questions/sample.webp");
      expect(createdSrc).toBe("");
    } finally {
      globalThis.Image = originalImage;
    }
  });

  it("preloads batch of upcoming question images for zero-delay navigation", () => {
    const paths = [
      "questions/1.jpg",
      "questions/2.jpg",
      "questions/3.jpg",
    ];

    const loadedSrcs: string[] = [];
    const originalImage = globalThis.Image;
    globalThis.Image = class MockImage {
      decoding = "async";
      set src(val: string) {
        loadedSrcs.push(val);
      }
      set onload(fn: () => void) {}
    } as unknown as typeof Image;

    try {
      preloadUpcomingImages(paths);
      expect(loadedSrcs.length).toBe(3);
      expect(loadedSrcs[0]).toContain("1.jpg");
      expect(loadedSrcs[1]).toContain("2.jpg");
      expect(loadedSrcs[2]).toContain("3.jpg");
    } finally {
      globalThis.Image = originalImage;
    }
  });
});
