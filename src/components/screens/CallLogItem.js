import { View, Text, useColorScheme, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons'; // Ensure correct import
import AsyncStorage from '@react-native-async-storage/async-storage';

const { MyCallModule } = NativeModules;

const CallLogItem = () => {
    const theme = useColorScheme();
    const isDarkTheme = theme === 'dark';

    const [callLogs, setCallLogs] = useState([]);
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [floatingButtonsVisible, setFloatingButtonsVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [contactName, setContactName] = useState('');
    const [additionalNote, setAdditionalNote] = useState('');



    // Fetch call logs
    const fetchCallLogs = async () => {
        try {
            const logsJson = await MyCallModule.getCallLogs();
            const logsArray = JSON.parse(logsJson);
            setCallLogs(logsArray);
        } catch (error) {
            console.error("Error fetching call logs", error);
        }
    };

    // const MyNumber = async () =>{
    //     try {
    //         const phoneNumber = await AsyncStorage.getItem('phonenumber')
    //         console.log(phoneNumber)
    //         const response = await axios.get(`http://13.127.211.81:8085/group/getGroupCodeByMobileNumber?mobileNumber=${phoneNumber}`)
    //         console.log("respons from phone number post api", response.data)
    //     } catch(err){
    //         console.log("error posting your phone numeber", err)
    //     }
    // };

    useEffect(() => {
        fetchCallLogs(); // Initial fetch
        const intervalId = setInterval(() => {
            fetchCallLogs();
        }, 5000); // Fetch logs every 5 seconds

        return () => clearInterval(intervalId);
    }, []);

    const handleCall = async (number) => {
        try {
            await MyCallModule.makeCall(number);
            console.log(`Dialing: ${number}`);
        } catch {
            console.log("Error making the call");
        }
    };
    const handleLogPress = (log) => {
        if (selectedLog && selectedLog.number === log.number) {
            // If the same log is pressed again, toggle the floating buttons
            setFloatingButtonsVisible(prev => !prev);
        } else {
            // Set selected log and show the floating buttons
            setSelectedLog(log);
            setFloatingButtonsVisible(true);
        }
    };

    const handleSaveNotes = async (number) => {
        if (!additionalNote || !selectedLog) {
            console.log("Additional note or selected log is missing");
            return;
        }
    
        try {
            console.log(number)
            const senderNumber= await AsyncStorage.getItem('phonenumber');
            console.log(senderNumber)
            const groupCode = await AsyncStorage.getItem("GroupCode");
            console.log("group code", groupCode)
            const response = await axios.post(`https://www.annulartech.net/notes/saveNotes`, {
                senderNumber: String(senderNumber),
                receiverNumber: String(number),
                groupCode: String(groupCode),
                notes: String(additionalNote) // Use the actual note input
            }, {
                headers: {
                    'Content-Type': 'application/json' // Ensure the content type is set
                }
            });
    
            console.log("Note saved successfully:", response.data);
            console.log(number);

            setAdditionalNote(''); // Clear input
            setNoteModalVisible(false); // Close notes modal
            setFloatingButtonsVisible(false); // Hide floating buttons
            setSelectedLog(null); // Reset selected log
        } catch (err) {
            console.error("Error saving note:", err);
        }
    };
    

    

    // useEffect(() => {
    //     const checkOverlayPermission = async () => {
    //       const canDraw = await MyCallModule.canDrawOverlays();
    //       if (!canDraw) {
    //         MyCallModule.requestOverlayPermission();
    //       } else {
    //         // Delay starting the overlay service by 6 seconds (6000 milliseconds)
    //         MyCallModule.startOverlayService();
    //       }
    //     };
    
    //     checkOverlayPermission();
    //   }, []);
    
      const startService = () => {
        // Delay starting the overlay service by 6 seconds (6000 milliseconds)
        MyCallModule.startOverlayService();
      };

    const renderItem = ({ item }) => (
        <View style={styles.callLogItem}>
        
            <TouchableOpacity style={styles.touchable} >
                <View style={styles.iconContainer}>
                    {item.callType === 'incoming' && <Image source={require('../../assets/images/incoming.png')} style={styles.icon} />}
                    {item.callType === 'outgoing' && <Image source={require('../../assets/images/outgoing.png')} style={styles.icon} />}
                    {item.callType === 'missed' && <Image source={require('../../assets/images/declined.png')} style={styles.icon} />}
                    {item.callType === 'declined' && <Image source={require('../../assets/images/declined.png')} style={styles.icon} />}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[isDarkTheme ? styles.textDark : styles.textLight]}>{item.name}</Text>
                    <Text style={[isDarkTheme ? styles.textDark : styles.textLight]}>{item.number}</Text>
                    <Text style={[isDarkTheme ? styles.textDark : styles.textLight]}>{new Date(item.date).toLocaleTimeString()}</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleLogPress(item)}  style={styles.plusButton}>
                <Text style={styles.plus}>+</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            <FlatList
                data={callLogs}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
            />

            {/* Conditional Rendering of Floating Buttons */}
            {floatingButtonsVisible && selectedLog && (
                <>
                    <TouchableOpacity
                        style={styles.floatingButton}
                        onPress={() =>{ handleCall(selectedLog.number);setFloatingButtonsVisible(false);}}
                    >
                        <Image source={require('../../assets/images/phone.png')} style={styles.phoneIcon}/>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.notesButton}
                        onPress={() => {
                            setNoteModalVisible(true);
                            setFloatingButtonsVisible(false); // Hide floating buttons
                        }}
                    >
                        <Image source={require('../../assets/images/notes.png')} style={styles.notesIcon}/>
                        </TouchableOpacity>
                </>
            )}

            {/* Modal for Additional Notes */}
            <Modal
                transparent={true}
                animationType="slide"
                visible={noteModalVisible}
                onRequestClose={() => {
                    setNoteModalVisible(false);
                    setSelectedLog(null); // Reset selected log
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
                        <Text style={styles.modalTitle}>Add Notes for {selectedLog?.name}:{selectedLog?.number}</Text>

                        <TextInput
    style={styles.textInput}
    placeholder='Name'
    value={contactName}
    onChangeText={text => setContactName(text)} // Updated to directly set state
/>
<TextInput
    style={styles.textInput}
    placeholder='Notes'
    value={additionalNote}
    onChangeText={text => setAdditionalNote(text)} // Updated to directly set state
/>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={() => handleSaveNotes(selectedLog.number)}
                            >
                                <Text style={styles.buttonText}>Save Notes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    setNoteModalVisible(false);
                                    setSelectedLog(null); // Reset selected log
                                }}
                            >
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
        flex: 1,
        marginLeft: 10,
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    phoneIcon:{
        width:20,
        height:20
    },
    notesIcon:{
        width:20,
        height:20
    },
    callLogItem: {
        padding: 10,
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
        fontSize: 35, // Adjust size for better visibility
        color: 'grey', // Change color for contrast
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
        backgroundColor: 'grey',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
    },
    closeButton: {
        backgroundColor: 'grey',
        padding: 9,
        borderRadius: 5,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    icon: {
        width: 20,
        height: 20,
    },
    buttonText: {
        textAlign: 'center',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 500,
        right: 15,
        backgroundColor: '#C0EBA6',
        borderRadius: 50,
        padding: 15,
        elevation: 5,
    },
    notesButton: {
        position: 'absolute',
        bottom: 400,
        right: 15,
        backgroundColor: '#FADFA1',
        borderRadius: 50,
        padding: 15,
        elevation: 5,
    },
    plusButton: {
        backgroundColor: '#B5CFB7',
        borderRadius: 30, // Half of width/height for a perfect circle
        width: 50,
        height: 50,
        justifyContent: 'center', // Center vertically
        alignItems: 'center', // Center horizontally
    },
});

export default CallLogItem;
