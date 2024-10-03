// App.js
import React, { useEffect } from 'react';
import { PermissionsAndroid, Alert } from 'react-native'; // Import PermissionsAndroid
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import TabNavigator from './src/navigation/TabNavigator';
import { NativeModules } from 'react-native';

const { MyCallModule } = NativeModules; // Import your custom module

const App = () => {
    // Function to request permissions
    const requestPermissions = async () => {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
            ];

            const granted = await PermissionsAndroid.requestMultiple(permissions);

            if (
                granted[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.CALL_PHONE] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED
            ) {
                console.log("All permissions granted");
                // Optionally check for overlay permission
                checkOverlayPermission();
            } else {
                console.log("Permissions denied");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    // Function to check and open overlay permission settings
    const checkOverlayPermission = async () => {
        const hasOverlayPermission = await MyCallModule.canDrawOverlays();
        if (!hasOverlayPermission) {
            Alert.alert(
                "Overlay Permission Required",
                "Please grant overlay permission for the app to function properly.",
                [
                    { text: "Open Settings", onPress: () => MyCallModule.openOverlaySettings() },
                    { text: "Cancel", style: "cancel" }
                ]
            );
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
