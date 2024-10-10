To build a React Native app using **React Native CLI**, you will have more control over the native code and can work directly with both Android and iOS projects. Here’s a detailed step-by-step guide to setting up and building a React Native app using the React Native CLI.

### Prerequisites

#### 1. Install Node.js and npm
You'll need Node.js (which includes npm) for React Native development.

- Download and install Node.js from [nodejs.org](https://nodejs.org/).
- Confirm installation by running:

  ```bash
  node -v
  npm -v
  ```

#### 2. Install Java Development Kit (JDK)
To run your React Native project on Android, you will need Java Development Kit (JDK). You can install JDK via [AdoptOpenJDK](https://adoptopenjdk.net/).

- Download the latest OpenJDK (LTS) and install it.

#### 3. Install Android Studio (for Android Development)
To run your app on an Android device or emulator, you need to install Android Studio.

- Download Android Studio from [here](https://developer.android.com/studio).
- During installation, make sure to install the **Android SDK**, **Android SDK Platform**, and **Android Virtual Device (AVD)**.

Configure the environment variables for Android SDK:

- Add the following lines to your `.bash_profile`, `.zshrc`, or `.bashrc`:

  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/tools/bin
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

- Run `source ~/.bash_profile` (or `source ~/.zshrc` if you're using zsh) to apply the changes.

#### 4. Install Xcode (for iOS Development on macOS only)
To build for iOS, you'll need **Xcode**.

- Download Xcode from the Mac App Store.
- Open Xcode and go to **Preferences > Locations**, and set the Command Line Tools to the latest version.

Make sure you have Xcode's command-line tools installed:

```bash
xcode-select --install
```

#### 5. Install React Native CLI
Now that the prerequisites are ready, you can install the **React Native CLI** globally:

```bash
npm install -g react-native-cli
```

### Step 1: Create a New React Native Project

Once everything is installed, you can create a new React Native project with the CLI. In your terminal, run the following command:

```bash
npx react-native init MyFirstApp
```

This will create a new React Native project folder called `MyFirstApp`.

### Step 2: Navigating to the Project Directory

After the project is created, navigate to your project directory:

```bash
cd MyFirstApp
```

### Step 3: Running the App on an Android Device or Emulator

#### 1. Start Android Emulator
You can launch an Android emulator using **Android Studio**. Follow these steps:

- Open Android Studio.
- Go to the **AVD Manager** (found in the top toolbar).
- Select or create a virtual device and click "Play" to launch the emulator.

Alternatively, you can start the emulator from the terminal:

```bash
emulator -list-avds
emulator @<your_avd_name>
```

#### 2. Running the App on Android
Make sure the emulator is running, then in your project directory, run the following command:

```bash
npx react-native run-android
```

This will start the React Native packager and build the Android app, deploying it to the emulator.

If you have a physical Android device, connect it via USB, enable **Developer Mode**, and ensure **USB Debugging** is enabled. Then, the command above will deploy the app to the device.

### Step 4: Running the App on an iOS Device or Simulator (macOS only)

#### 1. Start the iOS Simulator
You can open the iOS simulator by running this command:

```bash
npx react-native run-ios
```

This will automatically open Xcode’s iOS Simulator and build the app for iOS.

Alternatively, you can manually open the simulator:
- Open Xcode, then go to **Xcode > Open Developer Tool > Simulator**.

If you want to run the app on a real iOS device, you need to register your device and set up a provisioning profile in Xcode. This requires an Apple Developer account.

### Step 5: Modifying the App

Now that you have your app running on either an Android device, emulator, or iOS simulator, you can start modifying the code.

1. Open your project in a code editor like **Visual Studio Code**.
2. Edit the `App.js` file to update the app:

```javascript
import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Welcome to My First React Native App!</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: 'blue',
  },
});

export default App;
```

3. Save the file, and the app will automatically reload if you have live reload enabled.

### Step 6: Debugging

React Native provides several ways to debug your app:

1. **Using Chrome DevTools**: Press `Cmd+D` (iOS simulator) or `Ctrl+M` (Android emulator) and select **Debug**. This will open Chrome DevTools for JavaScript debugging.

2. **React Native Debugger**: You can use standalone tools like [React Native Debugger](https://github.com/jhen0409/react-native-debugger), which combines Redux DevTools with React DevTools in one app.

3. **React Native CLI Logs**: You can view logs directly from the command line:
   - For Android:

     ```bash
     npx react-native log-android
     ```

   - For iOS:

     ```bash
     npx react-native log-ios
     ```

### Step 7: Adding Packages and Libraries

React Native has a rich ecosystem of third-party libraries. You can install these using `npm` or `yarn`. Some examples include:

#### 1. Navigation
Install `react-navigation` for handling navigation in your app:

```bash
npm install @react-navigation/native
```

You will also need additional dependencies like React Navigation's stack navigator:

```bash
npm install @react-navigation/stack
```

#### 2. Linking Native Code
If you want to use native modules that require linking (like certain React Native libraries), you can link the native code using:

```bash
npx react-native link <package-name>
```

For most cases, React Native's autolinking feature will handle this automatically.

### Step 8: Building for Production

#### Android
To build a production-ready APK or AAB for Android:

1. In the root of your project, run:

   ```bash
   cd android
   ./gradlew assembleRelease
   ```

This will generate an APK file in the `android/app/build/outputs/apk/release` directory.

#### iOS (macOS only)
For iOS, open the project in Xcode and create a production build:

1. Open the `ios` folder in Xcode:

   ```bash
   open ios/MyFirstApp.xcworkspace
   ```

2. Select your device or simulator.
3. Go to **Product > Archive** to create a build ready for submission to the App Store.

### Conclusion

Using **React Native CLI** gives you full control over your project, allowing you to configure native code and handle advanced features. It’s great for projects that require native integrations, custom configurations, or when you need to eject from Expo.

By setting up your environment, creating a project, and running it on Android/iOS, you're ready to start building apps. React Native offers a powerful way to build cross-platform mobile applications with a single codebase.

Let me know if you need help with specific parts of the process or more detailed instructions!
