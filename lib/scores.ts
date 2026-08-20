// ===== lib/scores.ts — puntuaciones guardadas en localStorage =====
// Portado de handleSaveScore en references/templates/app.jsx

export type SavedScoreEntry = {
  game: string;
  score: number;
  name: string;
};

export type StoredScore = SavedScoreEntry & { at: number };

export function saveScore(entry: SavedScoreEntry): void {
  try {
    const raw = localStorage.getItem("av_scores");
    const all: StoredScore[] = raw ? JSON.parse(raw) : [];
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem("av_scores", JSON.stringify(all));
  } catch {
    // localStorage deshabilitado (modo privado): la puntuación no persiste.
  }
}
