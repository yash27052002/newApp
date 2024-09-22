import { View, Text, useColorScheme } from 'react-native'
import React from 'react'

export default function GroupItem() {

    const theme = useColorScheme();
  const isDarkTheme = theme === 'dark';
  return (
    <View
    style={[
      {
        flex: 1,
        justifyContent: 'center',
        alignItem: 'center',
      },
      isDarkTheme
        ? { backgroundColor: 'black' }
        : { backgroundColor: 'white' },
    ]}>
    <Text style={[isDarkTheme ? { color: 'white' } : { color: 'black' }]}>
    contacts item
    </Text>
</View>
  )
}