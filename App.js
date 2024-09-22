// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import TabNavigator from './src/navigation/TabNavigator';

const App = () => (
   
        <NavigationContainer>
            <TabNavigator />
        </NavigationContainer>
    
);

export default App;