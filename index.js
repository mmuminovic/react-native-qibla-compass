import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import PropTypes from 'prop-types';
import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    forwardRef,
    useImperativeHandle,
} from 'react';
import { Image, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

const DEFAULT_SIZE = 300;
const DEFAULT_UPDATE_INTERVAL = 100;
const DEFAULT_SMOOTHING = 0.15;
const DEFAULT_ALIGN_TOLERANCE = 5;
const DEFAULT_ALIGN_COLOR = '#2e8b57';

// Kaaba coordinates (Mecca), in degrees.
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8264;

// Convert a raw magnetometer reading into a 0..360 angle.
const computeAngle = (magnetometer) => {
    if (!magnetometer) {
        return 0;
    }
    const { x, y } = magnetometer;
    let angle = Math.atan2(y, x);
    if (angle < 0) {
        angle += 2 * Math.PI;
    }
    return Math.round(angle * (180 / Math.PI));
};

// Map the device angle to a compass heading (0 = North), wrapped into [0, 360).
const headingFromAngle = (angle) => (angle + 270) % 360;

// The cardinal/intercardinal name for a heading in degrees.
const cardinalDirection = (degree) => {
    if (degree >= 22.5 && degree < 67.5) {
        return 'NE';
    } else if (degree >= 67.5 && degree < 112.5) {
        return 'E';
    } else if (degree >= 112.5 && degree < 157.5) {
        return 'SE';
    } else if (degree >= 157.5 && degree < 202.5) {
        return 'S';
    } else if (degree >= 202.5 && degree < 247.5) {
        return 'SW';
    } else if (degree >= 247.5 && degree < 292.5) {
        return 'W';
    } else if (degree >= 292.5 && degree < 337.5) {
        return 'NW';
    }
    return 'N';
};

// Great-circle Qibla bearing (from true North) for a given location.
const calculateQibla = (latitude, longitude) => {
    const PI = Math.PI;
    const latk = (KAABA_LAT * PI) / 180.0;
    const longk = (KAABA_LNG * PI) / 180.0;
    const phi = (latitude * PI) / 180.0;
    const lambda = (longitude * PI) / 180.0;
    return (
        (180.0 / PI) *
        Math.atan2(
            Math.sin(longk - lambda),
            Math.cos(phi) * Math.tan(latk) -
                Math.sin(phi) * Math.cos(longk - lambda)
        )
    );
};

// Circular exponential smoothing so the needle eases instead of jumping. A factor
// of 0 (or >= 1) disables smoothing and follows the raw reading.
const smoothAngle = (previous, next, factor) => {
    if (previous === null || factor <= 0 || factor >= 1) {
        return next;
    }
    const diff = ((next - previous + 540) % 360) - 180;
    return (previous + factor * diff + 360) % 360;
};

// Fire a success haptic if expo-haptics is installed. It is an optional peer
// dependency, so this is a no-op when the host app doesn't provide it.
const triggerHaptic = () => {
    try {
        // eslint-disable-next-line import/no-extraneous-dependencies, global-require
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
        // expo-haptics not available — skip.
    }
};

export const useQiblaCompass = (options = {}) => {
    const {
        updateInterval = DEFAULT_UPDATE_INTERVAL,
        smoothingFactor = DEFAULT_SMOOTHING,
        alignTolerance = DEFAULT_ALIGN_TOLERANCE,
    } = options;

    const [magnetometer, setMagnetometer] = useState(0);
    const [qiblad, setQiblad] = useState(0);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const subscriptionRef = useRef(null);
    const smoothedRef = useRef(null);

    const unsubscribe = useCallback(() => {
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
    }, []);

    const subscribe = useCallback(() => {
        // Never stack listeners (e.g. across reinitCompass calls).
        unsubscribe();
        Magnetometer.setUpdateInterval(updateInterval);
        subscriptionRef.current = Magnetometer.addListener((data) => {
            const raw = computeAngle(data);
            const next = smoothAngle(smoothedRef.current, raw, smoothingFactor);
            smoothedRef.current = next;
            setMagnetometer(Math.round(next));
        });
    }, [unsubscribe, updateInterval, smoothingFactor]);

    const initCompass = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const isAvailable = await Magnetometer.isAvailableAsync();
        if (!isAvailable) {
            setError('Compass is not available on this device');
            setIsLoading(false);
            return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setError('Location permission not granted');
            setIsLoading(false);
            return;
        }

        try {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setQiblad(calculateQibla(latitude, longitude));
        } catch {
            setError('Could not determine your location');
        } finally {
            setIsLoading(false);
            subscribe();
        }
    }, [subscribe]);

    useEffect(() => {
        initCompass();
        return () => {
            unsubscribe();
        };
    }, [initCompass, unsubscribe]);

    const compassDegree = headingFromAngle(magnetometer);
    const compassDirection = cardinalDirection(compassDegree);
    const compassRotate = 360 - compassDegree;
    const kabaRotate = 360 - compassDegree + qiblad;

    const delta = ((kabaRotate % 360) + 360) % 360;
    const isFacingQibla =
        delta <= alignTolerance || delta >= 360 - alignTolerance;

    return {
        qiblad,
        compassDirection,
        compassDegree,
        compassRotate,
        kabaRotate,
        isFacingQibla,
        error,
        isLoading,
        reinitCompass: initCompass,
    };
};

const QiblaCompass = forwardRef(
    (
        {
            backgroundColor = 'transparent',
            color = '#000',
            textStyles = {},
            compassImage,
            kaabaImage,
            size = DEFAULT_SIZE,
            updateInterval = DEFAULT_UPDATE_INTERVAL,
            smoothingFactor = DEFAULT_SMOOTHING,
            alignTolerance = DEFAULT_ALIGN_TOLERANCE,
            alignColor = DEFAULT_ALIGN_COLOR,
            enableHaptics = false,
            onAligned,
        },
        ref
    ) => {
        const {
            qiblad,
            compassDirection,
            compassDegree,
            compassRotate,
            kabaRotate,
            isFacingQibla,
            error,
            isLoading,
            reinitCompass,
        } = useQiblaCompass({
            updateInterval,
            smoothingFactor,
            alignTolerance,
        });

        useImperativeHandle(ref, () => ({ reinitCompass }), [reinitCompass]);

        // Fire onAligned (and an optional haptic) once each time the device starts
        // facing the Qibla, not on every frame while aligned.
        const wasFacingRef = useRef(false);
        useEffect(() => {
            if (isFacingQibla && !wasFacingRef.current) {
                wasFacingRef.current = true;
                if (onAligned) {
                    onAligned();
                }
                if (enableHaptics) {
                    triggerHaptic();
                }
            } else if (!isFacingQibla) {
                wasFacingRef.current = false;
            }
        }, [isFacingQibla, enableHaptics, onAligned]);

        const compassSize = moderateScale(size, 0.25);
        const indicatorColor = isFacingQibla ? alignColor : color;

        if (isLoading) {
            return (
                <View style={[styles.container, { backgroundColor }]}>
                    <ActivityIndicator size={50} color={color} />
                </View>
            );
        }

        return (
            <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={
                    error
                        ? `Qibla compass error: ${error}`
                        : `Qibla compass. Heading ${compassDegree} degrees ${compassDirection}. ` +
                          `Qibla at ${Math.round(qiblad)} degrees.` +
                          (isFacingQibla ? ' Facing the Qibla.' : '')
                }
                style={[styles.container, { backgroundColor }]}
            >
                {error && (
                    <Text
                        style={{
                            color: '#f00',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            paddingHorizontal: 20,
                            fontSize: moderateScale(16, 0.25),
                            ...textStyles,
                        }}
                    >
                        Error: {error}
                    </Text>
                )}
                <View style={styles.direction}>
                    <Text
                        style={[styles.directionText, { color, ...textStyles }]}
                    >
                        {compassDirection}
                    </Text>
                    <Text
                        style={[styles.directionText, { color, ...textStyles }]}
                    >
                        {compassDegree}°
                    </Text>
                </View>
                <View
                    style={{
                        width: '100%',
                        height: compassSize,
                        position: 'relative',
                    }}
                >
                    <Image
                        source={compassImage || require('./assets/compass.png')}
                        style={[
                            styles.image,
                            {
                                width: compassSize,
                                height: compassSize,
                                transform: [{ rotate: `${compassRotate}deg` }],
                                zIndex: 100,
                            },
                        ]}
                    />
                    <View
                        style={{
                            width: compassSize,
                            height: compassSize,
                            position: 'absolute',
                            alignSelf: 'center',
                            transform: [{ rotate: `${kabaRotate}deg` }],
                            flexDirection: 'row',
                            justifyContent: 'center',
                            zIndex: 999,
                            elevation: 999,
                        }}
                    >
                        <Image
                            source={kaabaImage || require('./assets/kaaba.png')}
                            style={{
                                resizeMode: 'center',
                                height: 100,
                                width: 40,
                                zIndex: 1000,
                            }}
                        />
                    </View>
                </View>
                <View style={styles.qiblaDirection}>
                    <Image
                        source={kaabaImage || require('./assets/kaaba.png')}
                        style={{
                            width: moderateScale(35, 0.25),
                            height: moderateScale(35, 0.25),
                        }}
                    />
                    <Text
                        style={[
                            styles.directionText,
                            { color: indicatorColor, ...textStyles },
                        ]}
                    >
                        {qiblad.toFixed(2)}°
                    </Text>
                </View>
            </View>
        );
    }
);

QiblaCompass.propTypes = {
    backgroundColor: PropTypes.string,
    color: PropTypes.string,
    textStyles: PropTypes.object,
    compassImage: PropTypes.any,
    kaabaImage: PropTypes.any,
    size: PropTypes.number,
    updateInterval: PropTypes.number,
    smoothingFactor: PropTypes.number,
    alignTolerance: PropTypes.number,
    alignColor: PropTypes.string,
    enableHaptics: PropTypes.bool,
    onAligned: PropTypes.func,
};

const styles = StyleSheet.create({
    image: {
        resizeMode: 'contain',
        alignSelf: 'center',
        position: 'absolute',
        top: 0,
    },
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    direction: {
        textAlign: 'center',
        zIndex: 300,
    },
    directionText: {
        textAlign: 'center',
        fontSize: 30,
    },
    qiblaDirection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default QiblaCompass;
