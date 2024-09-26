// src/navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native'; // Import useColorScheme
import CallLogsScreen from '../screens/CallLogsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import GroupsScreen from '../screens/GroupsScreen';
import DialerScreen from '../screens/DialerScreen';
import StackNavigator from './stackNavigator';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const theme = useColorScheme(); // Get the current color scheme
    const isDarkTheme = theme === 'dark'; // Determine if it's dark theme

    return (
        <Tab.Navigator 
            screenOptions={{
                tabBarActiveTintColor: '#E7CCCC',
                tabBarInactiveTintColor: '#A5B68D',
                tabBarLabelStyle: {
                    fontSize: 16,
                    fontWeight: 'bold', 
                },
                tabBarStyle: {
                    backgroundColor: isDarkTheme ? 'black' : 'white', // Set background color based on theme
                },
                headerStyle: {
                    backgroundColor: isDarkTheme ? 'black' : 'white', // Optional: Set header background color based on theme
                },
                headerTintColor: isDarkTheme ? 'white' : 'black', // Set header text color based on theme
            }}>
            <Tab.Screen name="Call Logs" component={CallLogsScreen} />
            <Tab.Screen name="Dialer" component={DialerScreen} />

            <Tab.Screen name="Contacts" component={StackNavigator} />


        </Tab.Navigator>
    );
};

export default TabNavigator;