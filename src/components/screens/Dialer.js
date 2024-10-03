import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, useColorScheme, TouchableOpacity, FlatList, PermissionsAndroid, Modal } from 'react-native';
import { NativeModules } from 'react-native';

const { MyCallModule } = NativeModules;
const { MyOverlayService } = NativeModules;


const NumPad = ({ setPhoneNumber }) => {
    const theme = useColorScheme();
    const isDarkTheme = theme === 'dark';

    const handleNumPress = (num) => {
        setPhoneNumber(prev => prev + num);
    };

    return (
        <View>
            <FlatList
                data={[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"]}
                keyExtractor={(item) => item.toString()}
                numColumns={3}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.numPadButton, isDarkTheme ? styles.buttonDark : styles.buttonLight]}
                        onPress={() => handleNumPress(item.toString())}
                    >
                        <Text style={[styles.numPadText, isDarkTheme ? styles.textDark : styles.textLight]}>{item}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const FloatingOverlay = ({ isVisible, onClose }) => {
    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.overlayContainer}>
                <View style={styles.overlayContent}>
                    <Text style={styles.overlayText}>Call in Progress</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const Dialer = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(false);
    const theme = useColorScheme();
    const isDarkTheme = theme === 'dark';

    const requestPermissions = async () => {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,
            ];

            const granted = await PermissionsAndroid.requestMultiple(permissions);
            if (Object.values(granted).every(result => result === PermissionsAndroid.RESULTS.GRANTED)) {
                console.log("All permissions granted");
            } else {
                console.log("Some permissions denied");
            }
        } catch (err) {
            console.warn(err);
        }
    };

    useEffect(() => {
        requestPermissions();
    }, []);

    const startOverlay = () => {
        MyCallModule.startOverlayService();
    };

    const handleDial = async () => {
        if (!phoneNumber) {
            console.log("No phone number entered");
            return;
        }

        try {
            await MyCallModule.makeCall(phoneNumber);
            console.log(`Dialing: ${phoneNumber}`);
            setOverlayVisible(true); // Show overlay when the call is made
            startOverlay();
            setTimeout(() => {
                setModalVisible(true);
            }, 2000);
        } catch (error) {
            console.error("Error making call", error);
        }
    };

    const handleBackspace = () => {
        setPhoneNumber(prev => prev.slice(0, -1));
    };

    return (
        <View style={[styles.container, isDarkTheme ? styles.containerDark : styles.containerLight]}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, isDarkTheme ? styles.textDark : styles.textLight]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    showSoftInputOnFocus={false}
                    editable={true}
                    onFocus={() => {}}
                />
                <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
                    <Text style={[styles.backspaceText, isDarkTheme ? styles.textDark : styles.textLight]}>⌫</Text>
                </TouchableOpacity>
            </View>
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
                    <View style={[styles.modalContent, isDarkTheme ? styles.modalContentDark : styles.modalContentLight]}>
                        <Text style={styles.modalText}>Phone number: {phoneNumber}</Text>
                        <TextInput placeholder=' Add name' style={styles.noteInput} />
                        <TextInput placeholder=' Add email' style={styles.noteInput} />
                        <TextInput placeholder=' Add phone number' style={styles.noteInput} />
                        <TextInput placeholder=' Add Notes' style={styles.noteInput} />
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

            {/* Floating Overlay */}
            <FloatingOverlay isVisible={overlayVisible} onClose={() => setOverlayVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    containerLight: { backgroundColor: 'white' },
    containerDark: { backgroundColor: 'black' },
    numPadButton: { width: '33.33%', height: 60, justifyContent: 'center', alignItems: 'center' },
    numPadText: { fontSize: 24, fontWeight: 'bold' },
    textLight: { color: 'black' },
    textDark: { color: 'white' },
    dialButton: { backgroundColor: '#D1E9F6', paddingVertical: 20, paddingHorizontal: 20, borderRadius: 30, alignSelf: 'center', marginTop: 20 },
    dialButtonText: { color: 'black', fontSize: 12, fontWeight: 'bold' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    input: { 
        height: 40, 
        flex: 1, 
        padding: 4, 
        fontSize: 20, 
        paddingHorizontal: 15, 
        textAlign: 'center',
        letterSpacing: 2,
    },
    backspaceButton: { justifyContent: 'center', alignItems: 'center', padding: 10 },
    backspaceText: { fontSize: 20 },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalContentLight: { backgroundColor: 'white' },
    modalContentDark: { backgroundColor: 'black' },
    modalText: {
        fontSize: 18,
        marginBottom: 20,
    },
    noteInput: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, width: '100%', padding: 8 },
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
    overlayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlayContent: {
        width: '80%',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: 'white',
    },
    overlayText: {
        fontSize: 18,
        marginBottom: 20,
    },
    closeButtonText: {
        fontWeight: 'bold',
        color: 'black',
    },
});

export default Dialer;
