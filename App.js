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
    const [dialogVisible, setDialogVisible] = useState(true);
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
            const response = await axios.get(`http://13.127.211.81:8085/group/getGroupCodeByMobileNumber?mobileNumber=${phoneNumber}`);
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
            const response = await axios.get(`http://13.127.211.81:8085/caller/getGroupCodeCheck?groupCode=${inputValue}`);
            console.log("Response for the group code:", response.data);

            if (response.data.success) {
                await AsyncStorage.setItem('groupCodeEntered', 'true');
                // Start the overlay service after setting the group code
                startOverlayService();
            }
            handleInput();
        } catch (error) {
            console.log("Error", error);
        }
    };

    const startOverlayService = async () => {
        try {
            const groupCode = await AsyncStorage.getItem('GroupCode');

            if (groupCode) {
                MyCallModule.startOverlayService({ group_code: groupCode });
                console.log("Overlay service started with group code:", groupCode);
            } else {
                console.warn("Group code not found");
            }
        } catch (error) {
            console.error("Failed to start overlay service:", error);
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
                <Dialog.Button label="Cancel" onPress={() => setDialogVisible(false)} />
                <Dialog.Button label="OK" onPress={groupCode} />
            </Dialog.Container>
        </NavigationContainer>
    );
};

export default App;
