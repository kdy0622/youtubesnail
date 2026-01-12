
export interface ThumbnailStrategy {
  title: string;
  subtitle: string;
  badge: string;
  image_prompt: string;
}

export interface HistoryItem extends ThumbnailStrategy {
  id: string;
  timestamp: number;
  input: string;
}
