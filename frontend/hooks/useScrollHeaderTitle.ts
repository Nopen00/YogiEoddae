import { useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// 상세화면 스크롤 시 헤더에 축약된 타이틀을 띄우기 위해, 본문 타이틀이 화면 밖으로
// 나가는 스크롤 위치(containerY + titleBottom)를 계산해 그 지점을 지나면 visible을 true로 바꾼다.
export function useScrollHeaderTitle() {
  const [visible, setVisible] = useState(false);
  const containerY = useRef(0);
  const titleBottom = useRef(0);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    containerY.current = e.nativeEvent.layout.y;
  };

  const onTitleLayout = (e: LayoutChangeEvent) => {
    titleBottom.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const threshold = containerY.current + titleBottom.current;
    setVisible(e.nativeEvent.contentOffset.y > threshold);
  };

  return { visible, onContainerLayout, onTitleLayout, onScroll };
}
