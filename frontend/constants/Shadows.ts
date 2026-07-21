// constants/Shadows.ts
import { Colors } from './Colors';

export const Shadows = {
  card: {
    shadowColor: Colors.light.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  // 더보기 드롭다운 메뉴 전용 — 다른 UI 위로 확실히 떠 보여야 해서 card보다 elevation이 높다
  dropdown: {
    shadowColor: Colors.light.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 30,
  },
};
