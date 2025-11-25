import { useCallback, useEffect, useState } from 'react';

export function usePushNotifications() {
    const [permission, setPermission] = useState('default');
    const [subscription, setSubscription] = useState(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            console.warn('Push notifications not supported');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, [isSupported]);

    const subscribe = useCallback(async () => {
        if (!isSupported || permission !== 'granted') {
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Check for existing subscription
            let sub = await registration.pushManager.getSubscription();

            if (!sub) {
                // Create new subscription
                // Note: In production, you'd need to provide your VAPID public key
                const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;

                if (!vapidPublicKey) {
                    console.warn('VAPID public key not configured');
                    return null;
                }

                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });
            }

            setSubscription(sub);
            return sub;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return null;
        }
    }, [isSupported, permission]);

    const unsubscribe = useCallback(async () => {
        if (subscription) {
            try {
                await subscription.unsubscribe();
                setSubscription(null);
                return true;
            } catch (error) {
                console.error('Error unsubscribing:', error);
                return false;
            }
        }
        return true;
    }, [subscription]);

    const showLocalNotification = useCallback((title, options = {}) => {
        if (permission !== 'granted') {
            return;
        }

        const defaultOptions = {
            icon: '/logo_wallace_victor.png',
            badge: '/logo_wallace_victor.png',
            vibrate: [100, 50, 100],
            ...options,
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, defaultOptions);
            });
        } else {
            new Notification(title, defaultOptions);
        }
    }, [permission]);

    return {
        isSupported,
        permission,
        subscription,
        requestPermission,
        subscribe,
        unsubscribe,
        showLocalNotification,
    };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default usePushNotifications;


