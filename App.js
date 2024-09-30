// App.js
import React, { useEffect } from 'react';
import { PermissionsAndroid } from 'react-native'; // Import PermissionsAndroid
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import TabNavigator from './src/navigation/TabNavigator';

const App = () => {
    // Function to request permissions
    const requestPermissions = async () => {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, // Add this line
            ];

            const granted = await PermissionsAndroid.requestMultiple(permissions);

            if (
                granted[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.CALL_PHONE] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED // Check for READ_PHONE_STATE
            ) {
                console.log("All permissions granted");
            } else {
                console.log("Permissions denied");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    // Request permissions on app startup
    useEffect(() => {
        requestPermissions();
    }, []);

    return (
        <NavigationContainer>
            <TabNavigator />
        </NavigationContainer>
    );
};

export default App;
