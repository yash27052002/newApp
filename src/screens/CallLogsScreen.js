import React, { useState } from 'react';
import { View, FlatList, Button } from 'react-native';
import CallLogItem from '../components/screens/CallLogItem';
import DialerScreen from './DialerScreen';

const CallLogsScreen = ({ navigation }) => {
    const [isDialerVisible, setIsDialerVisible] = useState(false);

    const toggleDialer = () => {
        setIsDialerVisible(!isDialerVisible);
    };

    return (
    //   <View style={{ flexGrow: 1 }}>
    //       <FlatList 
    //           data={[/* Your call log data here */]}
    //           renderItem={({ item }) => <CallLogItem log={item} />}
    //           keyExtractor={(item) => item.id.toString()}
    //       />
    //       <Button title="Open Dialer" onPress={toggleDialer} />

    //       {isDialerVisible && (
    //           <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
    //               <DialerScreen onClose={toggleDialer} />
    //           </View>
    //       )}
    //   </View>

    <CallLogItem/>
   );
};

export default CallLogsScreen;