import React, { useEffect, useState } from 'react';
import { PermissionsAndroid, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Dialog from 'react-native-dialog';
import TabNavigator from './src/navigation/TabNavigator';

const { MyCallModule } = NativeModules;

const App = () => {
    const [dialogVisible, setDialogVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const handleInput = async () => {
        console.log("Input Value:", inputValue);
        setDialogVisible(false); // Close dialog
        await AsyncStorage.setItem('userInput', inputValue); // Example of saving input
    };

    const requestPermissions = async () => {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                PermissionsAndroid.PERMISSIONS.READ_SMS,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
            ];

            const granted = await PermissionsAndroid.requestMultiple(permissions);

            if (granted[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.CALL_PHONE] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("All permissions granted");
                fetchUserPhoneNumber();
                checkOverlayPermission();
            } else {
                console.log("Permissions denied");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const fetchUserPhoneNumber = async () => {
        try {
            const phoneNumber = await MyCallModule.getUserPhoneNumber();
            console.log("User's phone number:", phoneNumber);
            await AsyncStorage.setItem('phonenumber', phoneNumber);
        } catch (error) {
            console.error("Error fetching phone number:", error);
        }
    };

    const MyNumber = async () => {
        try {
            const phoneNumber = await AsyncStorage.getItem('phonenumber');
            console.log(phoneNumber);
            const response = await axios.get(`https://www.annulartech.net/group/getGroupCodeByMobileNumber?mobileNumber=${phoneNumber}`);
            const groupCode = response.data.data.groupCode;
            console.log("Response from phone number post API:", response.data);
        } catch (err) {
            console.log("Error posting your phone number", err);
        }
    };

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

    const groupCode = async () => {
        try {
            await AsyncStorage.setItem("GroupCode", inputValue);
    
            // Make API request to check group code
            const response = await axios.get(`https://www.annulartech.net/caller/getGroupCodeCheck?groupCode=${inputValue}`);
            console.log("Response for the group code:", response.data);
    
            if (response.data.message === "fail") {
                // Show an alert indicating the group code was not found
                Alert.alert('Error', `Group code not found: ${inputValue}`);
    
                // Do NOT close the dialog box; keep it open for the user to retry
            } else {
                // Show an alert for success
                Alert.alert(`Success ${inputValue}`, 'You are now in a group!');
    
                // Store that the group code was successfully entered
                await AsyncStorage.setItem('groupCodeEntered', 'true');    
                // Close the dialog box (or handle input, as you're referring to it)
                handleInput();
            }
        } catch (error) {
            console.log("Error", error);
    
            // Handle unexpected errors with an alert
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        }
    };

    const fetchAndStoreGroupCode = async () => {
        try {
            const groupCode = await AsyncStorage.getItem('GroupCode');
            if (groupCode) {
                MyCallModule.getGroupCode(groupCode); // Call the Kotlin method to store the group code
                console.log("Group code stored:", groupCode);
            } else {
                console.warn("Group code not found");
            }
        } catch (error) {
            console.error("Failed to fetch and store group code:", error);
        }
    };
    

    useEffect(() => {
        const checkIfGroupCodeEntered = async () => {
            const groupCodeEntered = await AsyncStorage.getItem('groupCodeEntered');
            if (groupCodeEntered !== 'true') {
                setDialogVisible(true); // Show dialog if the group code wasn't entered
            }
        };
        requestPermissions();
        MyNumber();
        checkIfGroupCodeEntered();
        fetchAndStoreGroupCode();
    }, []);

    return (
        <NavigationContainer>
            <TabNavigator />
            <Dialog.Container visible={dialogVisible}>
                <Dialog.Title>Enter Your Input</Dialog.Title>
                <Dialog.Input 
                    label="Input"
                    value={inputValue}
                    onChangeText={setInputValue}
                />
                <Dialog.Button label="OK" onPress={groupCode} />
            </Dialog.Container>
        </NavigationContainer>
    );
};

export default App;
