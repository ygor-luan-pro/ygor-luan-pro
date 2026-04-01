import { LessonsService } from './lessons.service';
import { ProgressService } from './progress.service';

export class CertificateService {
  static async isEligible(userId: string): Promise<boolean> {
    const stats = await ProgressService.getStudentStats(userId);
    return stats.total_lessons > 0 && stats.completed_count === stats.total_lessons;
  }

  static async getCompletionDate(userId: string): Promise<string | null> {
    const [lessons, progressList] = await Promise.all([
      LessonsService.getAll(),
      ProgressService.getUserProgress(userId),
    ]);

    const publishedIds = new Set(lessons.map((l) => l.id));

    return progressList
      .filter((p) => p.completed && p.completed_at !== null && publishedIds.has(p.lesson_id))
      .reduce<string | null>(
        (latest, p) => (!latest || p.completed_at! > latest ? p.completed_at : latest),
        null,
      );
  }
}
