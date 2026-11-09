import { Alert, Platform } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmText: string = 'Confirm'
) {
  if (Platform.OS === 'web') {
    const isConfirmed =
      typeof globalThis !== 'undefined' && typeof (globalThis as any).confirm === 'function'
        ? (globalThis as any).confirm(`${title}\n\n${message}`)
        : true;
    if (isConfirmed) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmText,
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
