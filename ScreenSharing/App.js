/* eslint-disable react-native/no-inline-styles */
import React, {
  Component,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {View, Text, Button, Modal} from 'react-native';
import {OTSession, OTPublisher, OTSubscriber} from 'opentok-react-native';

// Simple app-level context to mimic provider-wrapped trees
const AppContext = React.createContext({
  showExtra: true,
  toggleExtra: () => {},
  items: [],
});

function AppProvider({children}) {
  const [showExtra, setShowExtra] = useState(true);
  const [items, setItems] = useState([{id: 'a'}, {id: 'b'}]);

  // Periodically mutate a list to stress the view tree during capture
  useEffect(() => {
    const intervalId = setInterval(() => {
      setItems(prev => {
        if (prev.length > 5) {
          return prev.slice(0, 2);
        }
        const nextId = String(Date.now());
        return [...prev, {id: nextId}];
      });
    }, 1200);
    return () => clearInterval(intervalId);
  }, []);

  const value = useMemo(
    () => ({
      showExtra,
      toggleExtra: () => setShowExtra(s => !s),
      items,
    }),
    [showExtra, items],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function HeaderControls({onToggleScreen}) {
  const {showExtra, toggleExtra} = useContext(AppContext);
  return (
    <View style={{flexDirection: 'row', marginBottom: 12}}>
      <Button
        title={showExtra ? 'Hide Extra UI' : 'Show Extra UI'}
        onPress={toggleExtra}
      />
      <View style={{width: 12}} />
      <Button title="Toggle screen sharing" onPress={onToggleScreen} />
    </View>
  );
}

function ExtraContent() {
  const {showExtra, items} = useContext(AppContext);
  if (!showExtra) {
    return null;
  }
  return (
    <View style={{marginTop: 8}}>
      <Text>Dynamic UI below (changes during capture)</Text>
      {items.map((item, idx) => (
        <View
          key={item.id}
          style={{
            height: 24,
            marginVertical: 2,
            backgroundColor: idx % 2 === 0 ? '#e6e6e6' : '#d1d1d1',
          }}
        />
      ))}
    </View>
  );
}

function OverlayFlipper() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setVisible(v => !v), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View style={{backgroundColor: 'white', padding: 12, borderRadius: 6}}>
          <Text>Transient overlay while capturing</Text>
        </View>
      </View>
    </Modal>
  );
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {shareScreen: false};
    this.apiKey = '';
    this.sessionId =
      '';
    this.token =
      '';

    this.toggleScreenShare = () => {
      this.setState({shareScreen: !this.state.shareScreen});
    };
  }

  render() {
    return (
      <AppProvider>
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            paddingHorizontal: 100,
            paddingVertical: 50,
          }}>
          <Text>Screen-sharing sample</Text>
          <HeaderControls onToggleScreen={this.toggleScreenShare} />
          <OTSession
            apiKey={this.apiKey}
            sessionId={this.sessionId}
            token={this.token}
            eventHandlers={this.sessionEventHandlers}>
            {this.state.shareScreen ? (
              <OTPublisher
                style={{width: 0, height: 0}}
                properties={{videoSource: 'screen'}}
              />
            ) : (
              <View>
                <OTPublisher
                  style={{width: 200, height: 200}}
                  properties={{videoSource: 'camera'}}
                />
              </View>
            )}
            <OTSubscriber
              style={
                this.state.shareScreen
                  ? {width: 0, height: 0}
                  : {width: 200, height: 200}
              }
            />
          </OTSession>
          <ExtraContent />
          <OverlayFlipper />
        </View>
      </AppProvider>
    );
  }
}

export default App;
