import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';

interface DefaultButtonProps {
  text: string;
  onPress: () => void;
  src?: string;
}

const DefaultButton = ({ text, onPress, src }: DefaultButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} className="w-full h-[48px] px-4 py-3 bg-highlight-darkest rounded-[12px] justify-center">
        {src && <Image source={{uri: src}} className="w-6 h-6" />}
        <Text className="text-n-light-lightest text-center font-inter-bold text-[12px]">{text}</Text>
    </TouchableOpacity>
  )
}

export default DefaultButton
