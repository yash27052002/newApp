import { View, Text, useColorScheme, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { NativeModules } from 'react-native';

const { MyCallModule } = NativeModules;

const ITEM_HEIGHT = 50; // Adjust this based on your contact item height

const ContactItem = () => {
    const theme = useColorScheme();
    const isDarkTheme = theme === 'dark';

    const [contacts, setContacts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const contactsJson = await MyCallModule.getContacts(); // Remove page number
            const contactsArray = JSON.parse(contactsJson);
            if (contactsArray.length > 0) {
                setContacts(prevContacts => [...prevContacts, ...contactsArray]);
            } else {
                setHasMore(false); // No more contacts to load
            }
        } catch (error) {
            console.error("Error fetching contacts", error);
        } finally {
            setLoading(false);
        }
    };
    

    useEffect(() => {
        fetchContacts(page);
    }, [page]);

    const loadMoreContacts = () => {
        if (hasMore && !loading) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const openModal = (contact) => {
        setSelectedContact(contact);
        setModalVisible(true);
    };

    const saveNotes = () => {
        console.log(`Notes for ${selectedContact.name}: ${notes}`);
        setModalVisible(false);
        setNotes('');
    };

    const renderItem = useCallback(({ item }) => (
        <View style={styles.contactItem}>
            <Text style={[isDarkTheme ? styles.contactTextDark : styles.contactTextLight]}>
                {item.name}
            </Text>
            <TouchableOpacity onPress={() => openModal(item)}>
                <Text style={styles.plus}>+</Text>
            </TouchableOpacity>
        </View>
    ), [isDarkTheme]);

    const keyExtractor = (item) => item.id;

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            <FlatList
                data={contacts}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                onEndReached={loadMoreContacts}
                onEndReachedThreshold={0.5}
                getItemLayout={(data, index) => (
                    { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                )}
                ListFooterComponent={loading ? <ActivityIndicator size="large" color="#0000ff" /> : null}
            />

            <Modal
                transparent={true}
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
                        <TextInput
                            placeholder='Add Notes'
                            value={notes}
                            onChangeText={setNotes}
                            style={styles.notesInput}
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.saveButton} onPress={saveNotes}>
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
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    darkBackground: {
        backgroundColor: 'black',
    },
    lightBackground: {
        backgroundColor: 'white',
    },
    contactItem: {
        padding: 8,
        borderBottomWidth: 1,
        width: '100%',
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    contactTextDark: {
        color: 'white',
    },
    contactTextLight: {
        color: 'black',
    },
    plus: {
        fontSize: 30,
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
    notesInput: {
        width: '100%',
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
        padding: 10,
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
        flex: 1,
        marginRight: 5,
    },
    closeButton: {
        backgroundColor: '#D1E9F6',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginLeft: 5,
    },
    buttonText: {
        textAlign: 'center',
    },
});

export default ContactItem;
