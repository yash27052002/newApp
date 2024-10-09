// App.js
import React, { useEffect } from 'react';
import { PermissionsAndroid, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import TabNavigator from './src/navigation/TabNavigator';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Dialog from 'react-native-dialog';
import { useState } from 'react';

const { MyCallModule } = NativeModules;

const App = () => {

    const [dialogVisible, setDialogVisible] = useState(true);
    const [inputValue, setInputValue] = useState('');

    const handleInput = async () => {
        // Handle the input value here
        console.log("Input Value:", inputValue);
        setDialogVisible(false); // Close dialog
        await AsyncStorage.setItem('userInput', inputValue); // Example of saving input
    };
    // Function to request permissions
    const requestPermissions = async () => {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                PermissionsAndroid.PERMISSIONS.READ_SMS, // Added
                PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS
            ];

            const granted = await PermissionsAndroid.requestMultiple(permissions);

            if (
                granted[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.CALL_PHONE] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED
            ) {
                console.log("All permissions granted");
                // Fetch the user's phone number
                fetchUserPhoneNumber();
                // Optionally check for overlay permission
                checkOverlayPermission();
            } else {
                console.log("Permissions denied");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    // Function to fetch the user's phone number
    const fetchUserPhoneNumber = async () => {
        try {
            const phoneNumber = await MyCallModule.getUserPhoneNumber();
            console.log("User's phone number:", phoneNumber);
            await AsyncStorage.setItem('phonenumber',phoneNumber);
        } catch (error) {
            console.error("Error fetching phone number:", error);
        }
    };
    const MyNumber = async () =>{
        try {
            const phoneNumber = await AsyncStorage.getItem('phonenumber')
            console.log(phoneNumber)
            const response = await axios.get(`http://13.127.211.81:8085/group/getGroupCodeByMobileNumber?mobileNumber=${phoneNumber}`)
            const groupCode=response.data.data.groupCode;
            console.log("respons from phone number post api", response.data);
        } catch(err){
            console.log("error posting your phone numeber", err)
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
    const groupCode = async () =>{
        try{
            await AsyncStorage.setItem("GroupCode",inputValue);
            const response= await axios.get(`http://13.127.211.81:8085/caller/getGroupCodeCheck?groupCode=${inputValue}`);
            console.log("response for the group code ", response.data);
            handleInput();
        } catch(error){
            console.log("error", error )
        }
    };
    const incomingCallerNumber = async () =>{
        try{
            const incomingCallerNumber = await MyCallModule.getIncomingCallerNumber();
            console.log("incoming phone number:", incomingCallerNumber);


        }
        catch(error){
            console.log(error)
        }
    

    };

    // Request permissions on app startup
    useEffect(() => {
        requestPermissions();
        MyNumber();
        incomingCallerNumber();
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
