// src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './TabNavigator';

const AppNavigator = () => (
   <NavigationContainer>
       <TabNavigator />
   </NavigationContainer>
);

export default AppNavigator;