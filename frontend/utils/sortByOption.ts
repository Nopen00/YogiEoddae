// utils/sortByOption.ts
import type { SortOption } from '@/components/modals/SortAlert';

export function sortByOption<T extends { rating: number | null; like_count: number | null }>(
  list: T[],
  option: SortOption,
  getName: (item: T) => string,
  getPlaceCount?: (item: T) => number | null
): T[] {
  if (option === '관련도 높은 순') return list;
  const sorted = [...list];
  switch (option) {
    case '이름순':
      sorted.sort((a, b) => getName(a).localeCompare(getName(b), 'ko'));
      break;
    case '별점 높은 순':
      sorted.sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity));
      break;
    case '하트 많은 순':
      sorted.sort((a, b) => (b.like_count ?? -Infinity) - (a.like_count ?? -Infinity));
      break;
    case '장소 많은 순':
      if (getPlaceCount) sorted.sort((a, b) => (getPlaceCount(b) ?? -Infinity) - (getPlaceCount(a) ?? -Infinity));
      break;
    case '장소 적은 순':
      if (getPlaceCount) sorted.sort((a, b) => (getPlaceCount(a) ?? Infinity) - (getPlaceCount(b) ?? Infinity));
      break;
  }
  return sorted;
}
