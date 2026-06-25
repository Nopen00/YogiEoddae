// constants/labels.ts

export const CITY_SHORT: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구',
  '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전',
  '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기',
  '강원특별자치도': '강원', '강원도': '강원', '충청북도': '충북',
  '충청남도': '충남', '전라북도': '전북', '전북특별자치도': '전북',
  '전라남도': '전남', '경상북도': '경북', '경상남도': '경남',
  '제주특별자치도': '제주',
};

export const CATEGORY_LABEL: Record<string, string> = {
  '12': '관광지', '14': '문화시설', '15': '축제/행사',
  '25': '여행코스', '28': '레포츠', '32': '숙박', '38': '쇼핑', '39': '음식점',
};

export const MEDIA_TYPE_LABEL: Record<string, string> = {
  drama: '드라마',
  movie: '영화',
  youtube: '유튜브',
  etc: '기타',
};

export const shortAddress = (address: string): string => {
  const parts = address.split(' ');
  if (parts[0] && CITY_SHORT[parts[0]]) parts[0] = CITY_SHORT[parts[0]];
  return parts.slice(0, 2).join(' ');
};
