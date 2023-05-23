# React Native Qibla Compass

React Native Qibla Compass is a JavaScript library that provides a simple and easy-to-use interface for determining the Qibla direction (the direction towards the Kaaba in Mecca) using device sensors and location data. It can be used in mobile applications to integrate Qibla direction functionality. Also, it provides necessary data if you want to make your custom Qibla Compass component in React Native

## Installation

You can install React Native Qibla Compass via NPM:

```npm install react-native-qibla-compass```

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
    initCompass,
  } = useQiblaCompass();

  // Rest of your code
}
```
or
```javascript
import QiblaCompass from "react-native-qibla-compass";

export default function App() {
  return <QiblaCompass />;
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
- `initCompass` (function): A function to initialize the Qibla Compass.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to create a pull request or open an issue in the repository.

## License

This project is licensed under the [MIT License](LICENSE)
