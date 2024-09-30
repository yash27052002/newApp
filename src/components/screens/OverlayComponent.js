import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeModules } from 'react-native';

const OverlayComponent = () => {
    const handleClose = () => {
        NativeModules.MyCallModule.stopOverlayService(); // Call native method to stop service
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>eknknkdnvknvkd</Text>
            <Button title="Close" onPress={handleClose} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent background
    },
    text: {
        fontSize: 20,
        marginBottom: 20,
    },
});

export default OverlayComponent;
