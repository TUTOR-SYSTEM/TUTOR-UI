import { describe, expect, it } from "vitest";

import { MAX_FILES_PER_UPLOAD, canUploadFiles, pickUploadFiles } from "@/lib/upload-policy";

describe("canUploadFiles", () => {
  it("allows only ADMIN and TUTOR", () => {
    expect(canUploadFiles("ADMIN")).toBe(true);
    expect(canUploadFiles("TUTOR")).toBe(true);
    expect(canUploadFiles("STUDENT")).toBe(false);
    expect(canUploadFiles("PARENT")).toBe(false);
    expect(canUploadFiles(null)).toBe(false);
  });
});

describe("pickUploadFiles", () => {
  it("caps the selection at MAX_FILES_PER_UPLOAD", () => {
    const files = Array.from({ length: 8 }, (_, i) => new File(["x"], `f${i}.txt`));
    const picked = pickUploadFiles(files);
    expect(MAX_FILES_PER_UPLOAD).toBe(5);
    expect(picked).toHaveLength(5);
    expect(picked[0].name).toBe("f0.txt");
  });

  it("returns an empty list for missing input", () => {
    expect(pickUploadFiles(null)).toEqual([]);
  });
});
