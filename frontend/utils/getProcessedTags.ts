import type { Tag } from '@/services/types';

export const getProcessedTags = (tags: Tag[] = []) => {
  const names = tags.map(t => t.name);
  const visibleTags = names.slice(0, 3);
  const extraCount = names.length - 3;
  return { visibleTags, extraCount };
};
