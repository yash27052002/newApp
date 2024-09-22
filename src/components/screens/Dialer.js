import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, useColorScheme, TouchableOpacity, FlatList, PermissionsAndroid, Modal } from 'react-native';
import { NativeModules } from 'react-native';

const { MyCallModule } = NativeModules;

const NumPad = ({ setPhoneNumber }) => {
    const handleNumPress = (num) => {
        setPhoneNumber(prev => prev + num);
    };

    return (
        <View style={styles.numPadContainer}>
            <FlatList
                data={[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"]}
                keyExtractor={(item) => item.toString()}
                numColumns={3}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.numPadButton}
                        onPress={() => handleNumPress(item.toString())}
                    >
                        <Text style={styles.numPadText}>{item}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const Dialer = ({ onClose }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const theme = useColorScheme();
    const isDarkTheme = theme === 'dark';

    const requestPermissions = async () => {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                PermissionsAndroid.PERMISSIONS.CALL_PHONE
            ];

            const granted = await PermissionsAndroid.requestMultiple(permissions);

            if (granted[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] === PermissionsAndroid.RESULTS.GRANTED &&
                granted[PermissionsAndroid.PERMISSIONS.CALL_PHONE] === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("All permissions granted");
            } else {
                console.log("Permissions denied");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    useEffect(() => {
        requestPermissions(); // Request permissions when component mounts
    }, []);

    const handleDial = async () => {
        if (!phoneNumber) {
            console.log("No phone number entered");
            return;
        }

        try {
            await MyCallModule.makeCall(phoneNumber); // Call your native module
            console.log(`Dialing: ${phoneNumber}`);
            setTimeout(() => {
                setModalVisible(true);
            }, 2000);
            
        } catch (error) {
            console.error("Error making call", error);
        }
    };

    return (
        <View style={[{ flex: 1, justifyContent: 'center', padding: 20 }, isDarkTheme ? { backgroundColor: 'black' } : { backgroundColor: 'white' }]}>
            <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                
            />
            <NumPad setPhoneNumber={setPhoneNumber} />
            <TouchableOpacity style={styles.dialButton} onPress={handleDial}>
                <Text style={styles.dialButtonText}>Call</Text>
            </TouchableOpacity>

            {/* Modal for Call Confirmation */}
            <Modal
                transparent={true}
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent , isDarkTheme ? { backgroundColor: 'black' } : { backgroundColor: 'white' }]}>
                        <Text style={styles.modalText}>Call placed to: {phoneNumber}</Text>

                        <TextInput  placeholder=' Add Notes'/>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.saveButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    numPadContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    numPadButton: { width: '33.33%', height: 60, justifyContent: 'center', alignItems: 'center' },
    numPadText: { fontSize: 24, fontWeight: 'bold' },
    dialButton: { backgroundColor: '#D1E9F6', paddingVertical: 20, paddingHorizontal: 20, borderRadius: 30, alignSelf: 'center', marginTop: 20 },
    dialButtonText: { color: 'black', fontSize: 12, fontWeight: 'bold' },
    input: { height: 40, marginLeft: 100, padding: 4, fontSize: 20, marginBottom: 20, paddingHorizontal: 10 },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 18,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    closeButton: {
        backgroundColor: '#D1E9F6',
        padding: 10,
        borderRadius: 5,
        marginLeft: 10,
        flex: 1,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#D1E9F6',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: 'bold',
    },
});

export default Dialer;
