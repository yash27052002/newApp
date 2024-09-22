import { View, Text, useColorScheme, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet , Image} from 'react-native';
import React, { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import DialerScreen from '../../screens/DialerScreen';


const { MyCallModule } = NativeModules;

const CallLogItem = () => {
    const theme = useColorScheme();
    const isDarkTheme = theme === 'dark';

    const [callLogs, setCallLogs] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [note, setNote] = useState('');
    const [isDialerVisible, setIsDialerVisible] = useState(false);

    // Fetch call logs
    const fetchCallLogs = async () => {
        try {
            const logsJson = await MyCallModule.getCallLogs();
            const logsArray = JSON.parse(logsJson);
            console.log(logsArray); // Debug: Check fetched logs
            setCallLogs(logsArray);
        } catch (error) {
            console.error("Error fetching call logs", error);
        }
    };

    useEffect(() => {
        fetchCallLogs(); // Call logs when component mounts
    }, []);
    

    const handleCall = async (number) => {
        try{
            await MyCallModule.makeCall(number); // Call your native module
            console.log(`Dialing: ${number}`);
        }catch{
            console.log("error")
        }
    }

    const ModalOpen = (log) => {
        setSelectedLog(log);
        setModalVisible(true);
    };

    const toggleDialer = () => {
        setIsDialerVisible(!isDialerVisible);
    };

    const renderItem = ({ item }) => (
        <View style={styles.callLogItem}>
            <TouchableOpacity style={styles.touchable} onPress={()=> handleCall(item.number)}>
            <View style={styles.iconContainer}>
                {item.callType === 'incoming' && (
                    <Image source={require('../../assets/images/incoming.png')} style={styles.icon} />
                )}
                {item.callType === 'outgoing' && (
                    <Image source={require('../../assets/images/outgoing.png')} style={styles.icon} />
                )}
                {item.callType === 'missed' && (
                    <Image source={require('../../assets/images/declined.png')} style={styles.icon} />
                )}
                {item.callType === 'declined' && (
                    <Image source={require('../../assets/images/declined.png')} style={styles.icon} />
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={[isDarkTheme ? styles.textDark : styles.textLight]}>
                    {item.name}
                </Text>
                <Text style={[isDarkTheme ? styles.textDark : styles.textLight]}>
                    {item.number}
                </Text>
                <Text style={[isDarkTheme ? styles.textDark : styles.textLight]}>
                    {new Date(item.date).toLocaleTimeString()} {/* Format the date/time as needed */}
                </Text>
            </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => ModalOpen(item)}>
                <Text style={styles.plus}>+</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            <FlatList
                data={callLogs}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()} // Use index if no unique ID
            />

           

            {/* Modal for adding notes */}
            <Modal
                transparent={true}
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent ,isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
                        <Text style={styles.modalTitle}>Add Notes for {selectedLog?.name}</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder='Add Notes'
                            value={note}
                            onChangeText={setNote}
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={() => {
                                    // Handle save logic here
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Dialer Screen */}
            {isDialerVisible && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <DialerScreen onClose={toggleDialer} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    darkBackground: {
        backgroundColor: 'black',
    },
    lightBackground: {
        backgroundColor: 'white',
    },
    textContainer: {
        flex: 1, // Allow the text container to take remaining space
        marginLeft: 10, // Optional: adjust spacing from icon
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Makes the touchable take the full width available
    },
    callLogItem: {
        padding: 10,
        borderBottomWidth: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        
    },
    textDark: {
        color: 'white',
    },
    textLight: {
        color: 'black',
    },
    plus: {
        fontSize: 24,
        color: 'grey',
    },
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
    modalTitle: {
        fontSize: 18,
        marginBottom: 10,
    },
    textInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        width: '100%',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    saveButton: {
        backgroundColor: '#D1E9F6',
        padding: 10,
        borderRadius: 5,
    },
    closeButton: {
        backgroundColor: '#D1E9F6',
        padding: 10,
        borderRadius: 5,
    },
   
   
   
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    icon: {
        width: 20, // Adjust width
        height: 20, // Adjust height
 
    },
    
});

export default CallLogItem;
