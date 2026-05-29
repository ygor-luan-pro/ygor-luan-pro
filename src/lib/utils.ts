export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(typeof date === "string" ? new Date(date) : date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function groupLessonsByModule<T extends { module_number: number }>(
  lessons: T[],
): Map<number, T[]> {
  return lessons.reduce<Map<number, T[]>>((acc, lesson) => {
    const arr = acc.get(lesson.module_number) ?? [];
    arr.push(lesson);
    acc.set(lesson.module_number, arr);
    return acc;
  }, new Map());
}

export type AdjacentLessons<T> = {
  prev: T | null;
  next: T | null;
  position: number;
  total: number;
};

export function findAdjacentLessons<T extends { id: string }>(
  lessons: T[],
  currentId: string,
): AdjacentLessons<T> {
  const idx = lessons.findIndex((l) => l.id === currentId);
  if (idx === -1) return { prev: null, next: null, position: 0, total: lessons.length };
  return {
    prev: lessons[idx - 1] ?? null,
    next: lessons[idx + 1] ?? null,
    position: idx + 1,
    total: lessons.length,
  };
}
