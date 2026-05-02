//components\make_component\BackButton.tsx
import { Colors } from '@/constants/Colors';

import { Spacing } from '@/constants/Spacing';

import { ArrowLeft } from 'lucide-react-native';

import React from 'react';

import { StyleSheet, TouchableOpacity } from 'react-native';



interface BackButtonProps {

  onPress?: () => void; 

  color?: string;       

}



/**

 * 공통 뒤로가기 버튼 컴포넌트 (Named Export로 수정됨)

 */

// 🚀 선언부 앞에 export를 추가하여 Named Export로 변경합니다.

export const BackButton = ({ onPress, color = Colors.light.black }: BackButtonProps) => {

  return (

    <TouchableOpacity 

      onPress={onPress} 

      style={styles.button} 

      activeOpacity={0.7} 

    >

      <ArrowLeft 

        size={24} 

        color={color} 

        strokeWidth={2.5} 

      />

    </TouchableOpacity>

  );

};



const styles = StyleSheet.create({

  button: {

    width: 40, 

    height: 40, 

    justifyContent: 'center', 

    alignItems: 'center', 

    marginRight: Spacing.h.small, 

  },

});

