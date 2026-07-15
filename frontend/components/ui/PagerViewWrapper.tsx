import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';

type PageSelectedEvent = { nativeEvent: { position: number } };

interface Props {
  style?: any;
  initialPage?: number;
  onPageSelected?: (e: PageSelectedEvent) => void;
  children?: React.ReactNode;
}

export interface PagerViewHandle {
  setPage: (index: number) => void;
}

const PagerViewWrapper = forwardRef<PagerViewHandle, Props>(
  ({ style, initialPage = 0, onPageSelected, children }, ref) => {
    const [currentPage, setCurrentPage] = useState(initialPage);

    useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        setCurrentPage(index);
        onPageSelected?.({ nativeEvent: { position: index } });
      },
    }));

    const pages = React.Children.toArray(children);
    return <View style={style}>{pages[currentPage] ?? null}</View>;
  }
);

PagerViewWrapper.displayName = 'PagerViewWrapper';

export default PagerViewWrapper;
