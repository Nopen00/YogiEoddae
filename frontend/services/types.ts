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
  source_url?: string;
  description: string;
  tags: Tag[];
  is_bookmarked: boolean;
  is_submitted?: boolean;
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

// 아직 우리 DB에 등록되지 않은, 관광공사 API에서 실시간으로 받아온 근처 추천 장소.
// 탭하면 placeApi.register()로 정식 Place로 등록된 뒤에야 id가 생긴다.
export interface NearbyPlace {
  content_id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  image_url: string;
  category: string;
}

export interface Photo {
  id: number;
  image_url: string;
  description: string;
  likes: number;
  rating?: number | null;
  tags: Tag[];
  is_bookmarked?: boolean;
  travel_date: string;
  created_at: string;
  author?: string;
  authorAvatar?: string;
  isMine?: boolean;
  content?: string;
}

export interface PhotoSpotDetail {
  photo: Photo;
  place: Place;
  placePhotos: Photo[];
  relatedPhotos: Photo[];
}

export type ReviewTargetType = 'course' | 'place' | 'photospot';

export interface ReviewTarget {
  type: ReviewTargetType;
  id: number;
  title: string;
  subtitle?: string;
  category?: string;
  imageUrl?: string;
  tags: { id: number; name: string; category: string }[];
  placeCount?: number | null;
}

export interface Review {
  id: number;
  author: string;
  authorAvatar?: string | null;
  travelDate: string;
  writtenDate: string;
  rating: number;
  content: string;
  images: string[];
  hasPhoto: boolean;
  likeCount: number;
  isMine: boolean;
  isLiked: boolean;
  target?: ReviewTarget;
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

export interface MailItem {
  id: number;
  action: string;
  tokenAmount: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
