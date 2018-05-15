import Expo from "expo";
import ExpoClient from "./ExpoClient";
import React from "react";
import { Button, Text, View } from "react-native";
import moment from 'moment';
// import Toast from "react-native-root-toast";

// let PUSH_ENDPOINT = "https://your-server.com/users/push-token";

async function getPushTokenAsync() {
  const { status: existingStatus } = await Expo.Permissions.getAsync(
    Expo.Permissions.NOTIFICATIONS
  );
  let finalStatus = existingStatus;

  // only ask if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  if (existingStatus !== "granted") {
    // Android remote notification permissions are granted during the app
    // install, so this will only ask on iOS
    const { status } = await Expo.Permissions.askAsync(
      Expo.Permissions.NOTIFICATIONS
    );
    finalStatus = status;
  }

  // Stop here if the user did not grant permissions
  if (finalStatus !== "granted") {
    return;
  }

  // Get the token that uniquely identifies this device
  let token = await Expo.Notifications.getExpoPushTokenAsync();

  return token;

  // POST the token to your backend server from where you can retrieve it to send push notifications.

  // return fetch(PUSH_ENDPOINT, {
  //   method: "POST",
  //   headers: {
  //     Accept: "application/json",
  //     "Content-Type": "application/json"
  //   },
  //   body: JSON.stringify({
  //     token: {
  //       value: token
  //     },
  //     user: {
  //       username: "Brent"
  //     }
  //   })
  // });
}

async function sendPushNotificationAsync() {
  let token = await getPushTokenAsync();
  let messages = [];
  messages.push({
    to: token,
    sound: "default",
    body: "This was sent by tapping a button in the app",
    data: { sentTime: Date.now() }
  });

  let esc = new ExpoClient();
  let chunks = esc.chunkPushNotifications(messages);
  for (let chunk of chunks) {
    try {
      let receipts = await esc.sendPushNotificationsAsync(chunk);
      console.log(receipts);
    } catch (error) {
      console.error(error);
    }
  }
}

export default class App extends React.Component {
  state = {
    notif: null
  };

  componentDidMount() {
    this._notificationSubscription = Expo.Notifications.addListener(
      this._handleNotification
    );
  }

  _handleNotification = notif => {
    console.log("Received a notification:", notif);
    // Add a Toast on screen.
    // let toast = Toast.show("This is a message", {
    //   duration: Toast.durations.LONG,
    //   position: Toast.positions.TOP,
    //   shadow: true,
    //   animation: true,
    //   hideOnPress: true,
    //   delay: 0
    // });
    this.setState({
      notif,
      receivedTime: Date.now()
    });
  };

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {(this.state.notif && (
          <View
            style={{
              backgroundColor: "#ffcc00",
              borderRadius: 6,
              borderWidth: 3,
              borderColor: "#444444",
              marginHorizontal: 50,
              marginTop: 60,
              marginBottom: 20,
              padding: 12,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Text style={{ color: "#666666", fontSize: 22, }}>
              {JSON.stringify(this.state.notif)}
            </Text>
            <Text style={{ color: "#999999", fontSize: 13 }}>
              Sent: {moment(this.state.notif.data.sentTime).format()}
            </Text>
            <Text style={{ color: "#999999", fontSize: 13 }}>
              Received: {moment(this.state.receivedTime).format()}
            </Text>
          </View>
        )) ||
          null}
        <Button
          title="Send a Push Notification to Myself"
          onPress={() => {
            sendPushNotificationAsync();
          }}
        />
      </View>
    );
  }
}
