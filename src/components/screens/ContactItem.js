import { View, Text, useColorScheme, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { MyCallModule } = NativeModules;

const ITEM_HEIGHT = 50;
const INITIAL_PAGE_SIZE = 50;

const ContactItem = () => {
    const theme = useColorScheme();
    const isDarkTheme = theme === 'dark';
    const navigation = useNavigation();

    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Load contacts from AsyncStorage or fetch if not available
    const loadContacts = async () => {
        try {
            setLoading(true);
            const storedContacts = await AsyncStorage.getItem('contacts');
            if (storedContacts) {
                setContacts(JSON.parse(storedContacts)); // Load cached contacts
            } else {
                fetchContacts(page); // Fetch from the module if not cached
            }
        } catch (error) {
            console.error("Error loading contacts", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch contacts from native module and store them
    const fetchContacts = async (page) => {
        try {
            setLoading(true);
            const contactsJson = await MyCallModule.getContacts(page, INITIAL_PAGE_SIZE);
            const contactsArray = JSON.parse(contactsJson);

            if (contactsArray.length > 0) {
                const newContacts = [...contacts, ...contactsArray];
                setContacts(newContacts);
                await AsyncStorage.setItem('contacts', JSON.stringify(newContacts)); // Cache contacts
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching contacts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts(); // Load contacts when component mounts
    }, []);

    useEffect(() => {
        if (searchQuery === '') {
            setFilteredContacts(contacts);
        } else {
            setFilteredContacts(
                contacts.filter(contact =>
                    contact.name.toLowerCase().startsWith(searchQuery.toLowerCase()) // Check only the first letter
                )
            );
        }
    }, [searchQuery, contacts]);

    const loadMoreContacts = () => {
        if (hasMore && !loading) {
            setPage(prevPage => prevPage + 1);
            fetchContacts(page + 1);
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

    const navDetails = (contact) => {
        navigation.navigate('ContactDetails', { contact });
    };

    const renderItem = useCallback(({ item }) => (
        <View style={styles.contactItem}>
            <TouchableOpacity onPress={() => navDetails(item)} style={styles.nameContainer}>
                <Text style={[isDarkTheme ? styles.contactTextDark : styles.contactTextLight]}>
                    {item.name}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => openModal(item)} style={styles.plusContainer}>
                <Text style={[styles.plus, isDarkTheme ? styles.contactTextDark : styles.contactTextLight]}>+</Text>
            </TouchableOpacity>
        </View>
    ), [isDarkTheme, navigation]);

    const keyExtractor = (item) => item.id;

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            <TextInput
                style={styles.searchBar}
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            
            {loading && contacts.length === 0 ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
    data={filteredContacts}
    keyExtractor={keyExtractor} // This line remains unchanged
    renderItem={renderItem}
    onEndReached={loadMoreContacts}
    onEndReachedThreshold={0.5}
    getItemLayout={(data, index) => (
        { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
    )}
/>

            )}

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
    searchBar: {
        width: '100%',
        padding: 10,
        marginBottom: 20,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
    },
    contactItem: {
        padding: 8,
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
    plusContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    plus: {
        fontSize: 34,
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
    nameContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 1,
    },
});

export default ContactItem;
