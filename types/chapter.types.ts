/** Chương (chapter) trong khung chương trình — backed by `/chapter` on the API. */

/** Row chương BE trả về (bảng `chapters`). */
export type ChapterItem = {
  id: string;
  curriculumId: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

/** `GET /chapter` — danh sách có phân trang. */
export type ChaptersApiPayload = {
  chapters: ChapterItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** Body `POST /chapter/:curriculumId`. */
export type CreateChapterPayload = {
  title: string;
  description?: string;
  order?: number;
};

/** Body `PUT /chapter/:id`. */
export type UpdateChapterPayload = Partial<CreateChapterPayload>;
