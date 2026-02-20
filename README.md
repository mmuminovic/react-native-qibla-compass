# React Native Qibla Compass

React Native Qibla Compass is a JavaScript library that provides a simple and easy-to-use interface for determining the Qibla direction (the direction towards the Kaaba in Mecca) using device sensors and location data. It can be used in mobile applications to integrate Qibla direction functionality. Also, it provides necessary data if you want to make your custom Qibla Compass component in React Native.

Works with both **Expo** and **React Native CLI** projects.

## Installation

### Expo Projects

```bash
npx expo install react-native-qibla-compass expo-location expo-sensors
```

### React Native CLI Projects

1. If you haven't already, add Expo modules support to your project:

```bash
npx install-expo-modules@latest
```

2. Install the package and its peer dependencies:

```bash
npm install react-native-qibla-compass expo-location expo-sensors
```

3. For iOS, install native dependencies:

```bash
cd ios && pod install && cd ..
```

## Usage

```javascript
import { useQiblaCompass } from "react-native-qibla-compass";

export default function App() {
  const {
    qiblad,
    compassDirection,
    compassDegree,
    compassRotate,
    kabaRotate,
    error,
    isLoading,
    reinitCompass,
  } = useQiblaCompass();

  // Rest of your code
}
```

or

```javascript
import QiblaCompass from "react-native-qibla-compass";

export default function App() {
  return (
    <QiblaCompass
      color={"#123"} // optional
      backgroundColor={"#fff"} // optional
      textStyles={{ textAlign: "center", fontSize: 24 }} // optional
      kaabaImage={require('./assets/kaaba.png')} // optional
      compassImage={require('./assets/compass.png')} // optional
    />
  );
}
```

If you want to reinit qibla compass, you can do it on this way:

```javascript
import { useRef } from "react";
import QiblaCompass from "react-native-qibla-compass";

export default function App() {
  const qiblaCompassRef = useRef();

  const reinitCompass = () => {
    qiblaCompassRef.current.reinitCompass();
  };

  return <QiblaCompass ref={qiblaCompassRef} />;
}
```

## API

### `useQiblaCompass()`

The `useQiblaCompass` hook returns an object with the following properties:

- `qiblad` (number): The Qibla angle in degrees.
- `compassDirection` (string): The compass direction (e.g., "NE", "E", "SE").
- `compassDegree` (number): The compass angle in degrees.
- `compassRotate` (number): The compass rotation angle in degrees.
- `kabaRotate` (number): The Kaaba icon rotation angle in degrees.
- `error` (string): An error message, if any.
- `isLoading` (boolean): Indicates if the compass data is still loading.
- `reinitCompass` (function): A function to reinitialize the Qibla Compass.

### `<QiblaCompass />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | string | `'transparent'` | Background color of the compass container |
| `color` | string | `'#000'` | Text color |
| `textStyles` | object | `{}` | Additional text styles |
| `compassImage` | ImageSource | Built-in image | Custom compass image |
| `kaabaImage` | ImageSource | Built-in image | Custom Kaaba image |

## Permissions

This library requires location permissions. On iOS, add to your `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to calculate the Qibla direction</string>
```

On Android, add to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

> Expo projects using `expo-location` handle this automatically via `app.json` config.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to create a pull request or open an issue in the [Github repository](https://github.com/mmuminovic/react-native-qibla-compass).

## License

This project is licensed under the [ISC License](LICENCE).
