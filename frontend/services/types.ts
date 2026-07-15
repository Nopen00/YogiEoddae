export interface Tag {
  id: number;
  category: string;
  name: string;
}

export interface Media {
  id: number;
  title: string;
  media_type: 'drama' | 'movie' | 'youtube' | 'etc';
  year: number | null;
  thumbnail_url: string;
  description: string;
  tags: Tag[];
  is_bookmarked: boolean;
  place_count: number | null;
  rating: number | null;
  like_count: number | null;
  created_at: string;
}

export interface Place {
  id: number;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  image_url: string;
  category: string;
  is_verified: boolean;
  kakao_place_url?: string;
  is_bookmarked: boolean;
  rating: number | null;
  like_count: number | null;
  tags: Tag[];
  created_at: string;
}

export interface Photo {
  id: number;
  image_url: string;
  description: string;
  likes: number;
  tags: Tag[];
  is_bookmarked?: boolean;
  created_at: string;
}

export interface MediaPlace {
  id: number;
  place: Place;
  day: number | null;
  scene_description: string;
  confidence_score: number;
  is_confirmed: boolean;
  created_at: string;
}

export interface DailyPlace {
  id: number;
  day_number: number;
  order: number;
  memo: string;
  place: Place;
}

export interface Schedule {
  id: number;
  title: string;
  media: Pick<Media, 'id' | 'title' | 'thumbnail_url' | 'media_type' | 'tags' | 'place_count'> | null;
  start_date: string | null;
  end_date: string | null;
  is_bookmarked: boolean;
  daily_places: DailyPlace[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
