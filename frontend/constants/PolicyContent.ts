// constants/PolicyContent.ts
// 실제 약관/개인정보 처리방침 본문은 백엔드 정적 페이지(backend/templates/legal/)에서 호스팅됨.
// 화면에서는 아래 URL로 하이퍼링크만 연결한다. 문구 수정은 백엔드 템플릿에서.
import { BASE_URL } from '@/services/api';

export const TERMS_OF_SERVICE_URL = `${BASE_URL}/terms/`;
export const PRIVACY_POLICY_URL = `${BASE_URL}/privacy/`;
