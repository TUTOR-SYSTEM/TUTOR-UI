/** Bài học (lesson) trong khung chương trình — backed by `/curriculum/lessons` on the API. */

/** File đính kèm của bài học (`theoryUrls` / `exerciseUrls`), lấy từ `POST /upload`. */
export type LessonFile = { name: string; url: string; key: string };

/** Row bài học BE trả về (bảng `lessons`). */
export type LessonItem = {
  id: string;
  curriculumId: string;
  chapterId: string | null;
  title: string;
  description: string | null;
  theoryUrls: LessonFile[];
  exerciseUrls: LessonFile[];
  order: number;
  createdAt: string;
  updatedAt: string;
};

/** Body `POST /curriculum/lessons` (curriculumId/chapterId đi qua query string). */
export type CreateLessonPayload = {
  title: string;
  description?: string;
  theoryUrls?: LessonFile[];
  exerciseUrls?: LessonFile[];
  order?: number;
};

/** Body `PUT /curriculum/lessons/:id`. Chỉ gửi field cần đổi; body rỗng bị BE từ chối (400). */
export type UpdateLessonPayload = Partial<CreateLessonPayload>;
