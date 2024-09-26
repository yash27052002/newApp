import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, NativeModules } from 'react-native';

const { MyCallModule } = NativeModules;

const ContactDetails = ({ route }) => {
    const { contact } = route.params; // Get the contact from params

    const [letter, setLetter] = useState('');

    const handleCall = async (phoneNumber) => {
        console.log(phoneNumber);
        try {
            await MyCallModule.makeCall(phoneNumber);
            console.log("Calling", phoneNumber);
        } catch (error) {
            console.log("Error", error);
        }
    };

    useEffect(() => {
        const FirstLetter = () => {
            const letter = contact.name.charAt(0);
            setLetter(letter);
        };
        FirstLetter();
    }, [contact]);

    return (
        <View style={styles.container}>
            <View style={styles.dpContainer}>
                <Text style={styles.Dp}>{letter}</Text>
            </View>
            <Text style={styles.nameText}>{contact.name}</Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.callButton} onPress={() => handleCall(contact.phoneNumber)}>
                    <Image source={require('../../assets/images/phone.png')} style={styles.phoneIcon} />
                    <Text style={styles.buttonText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.messageButton}>
                    <Image source={require('../../assets/images/notes.png')} style={styles.phoneIcon} />
                    <Text style={styles.buttonText}>Notes</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.phoneNumberContainer} onPress={() => handleCall(contact.phoneNumber)}>
                <Image source={require('../../assets/images/phone.png')} style={styles.phoneIcon2} />
                <Text style={styles.phoneText}>{contact.phoneNumber}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dpContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#CB8589',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20, // Space below the DP
    },
    Dp: {
        fontSize: 20,
        color: 'white', // Change text color for visibility
    },
    nameText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    phoneText: {
        fontSize: 18,
        marginLeft: 10,
        letterSpacing: 1,
    },
    phoneNumberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C9DABF',
        width: 350,
        height: 50,
        borderRadius: 25,
        marginTop: 30,
        paddingHorizontal: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
        marginTop: 20,
    },
    callButton: {
        width: 80,
        height: 60,
        backgroundColor: '#B5CFB7',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
    },
    phoneIcon: {
        width: 30,
        height: 30,
    },
    phoneIcon2: {
        width: 30,
        height: 30,
    },
    messageButton: {
        width: 80,
        height: 60,
        backgroundColor: '#EFD595',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ContactDetails;
