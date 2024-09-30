import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ContactDetails from './../components/screens/ContactDetails';
import ContactItem from '../components/screens/ContactItem';
import OverlayComponent from './../components/screens/OverlayComponent'; // Adjust the path accordingly

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="ContactList">
            <Stack.Screen 
                name="ContactList" 
                component={ContactItem} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="ContactDetails" 
                component={ContactDetails} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="Overlay" 
                component={OverlayComponent} 
                options={{ headerShown: false }} 
            />
        </Stack.Navigator>
    );
};

export default StackNavigator;
