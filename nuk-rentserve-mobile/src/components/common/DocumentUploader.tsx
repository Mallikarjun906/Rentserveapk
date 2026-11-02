// Reusable Document & Identity Photo Uploader with Real File Selection, Validation & States

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS } from '../../constants/theme';
import { Badge } from './Badge';

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
  file?: any;
}

export type UploadState = 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error';

interface DocumentUploaderProps {
  label: string;
  description?: string;
  acceptTypes?: 'image' | 'document' | 'all';
  file: UploadFile | null;
  onFileSelect: (file: UploadFile | null) => void;
  uploadState?: UploadState;
  errorMessage?: string;
  allowCamera?: boolean;
  required?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  label,
  description = 'PDF, JPG, PNG (Max 5MB)',
  acceptTypes = 'all',
  file,
  onFileSelect,
  uploadState = file ? 'selected' : 'idle',
  errorMessage,
  allowCamera = true,
  required = false,
}) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePickDocument = async () => {
    try {
      const typeList =
        acceptTypes === 'image'
          ? ['image/jpeg', 'image/png', 'image/webp']
          : ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

      const result = await DocumentPicker.getDocumentAsync({
        type: typeList,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.size && asset.size > MAX_FILE_SIZE) {
          Alert.alert(
            'File Limit Exceeded',
            `Selected file (${formatFileSize(asset.size)}) exceeds the 5 MB limit. Please select a smaller file.`
          );
          return;
        }

        const isPdf =
          asset.name?.toLowerCase().endsWith('.pdf') ||
          asset.mimeType === 'application/pdf';

        const mime =
          asset.mimeType ||
          (isPdf
            ? 'application/pdf'
            : asset.name?.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg');

        onFileSelect({
          uri: asset.uri,
          name: asset.name || `document-${Date.now()}.${isPdf ? 'pdf' : 'jpg'}`,
          type: mime,
          size: asset.size,
          file: (asset as any).file,
        });
      }
    } catch (err: any) {
      Alert.alert('File Selection Failed', err.message || 'Could not select document.');
    }
  };

  const handlePickPhoto = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera permissions to capture document/photo.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Photo Library Permission Required',
            'Please enable gallery permissions to select document/photo.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            'File Limit Exceeded',
            `Selected photo (${formatFileSize(asset.fileSize)}) exceeds the 5 MB limit.`
          );
          return;
        }

        const ext = asset.mimeType?.includes('png') ? 'png' : 'jpg';
        const filename =
          asset.fileName || `photo-${Date.now()}.${ext}`;

        onFileSelect({
          uri: asset.uri,
          name: filename,
          type: asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg'),
          size: asset.fileSize,
          file: (asset as any).file,
        });
      }
    } catch (err: any) {
      Alert.alert('Photo Selection Failed', err.message || 'Could not choose photo.');
    }
  };

  const getBadgeProps = () => {
    if (uploadState === 'uploading') {
      return { tone: 'sun' as const, label: 'Uploading…' };
    }
    if (uploadState === 'uploaded') {
      return { tone: 'ok' as const, label: 'Uploaded ✓' };
    }
    if (uploadState === 'error') {
      return { tone: 'bad' as const, label: 'Upload Failed' };
    }
    if (file) {
      return { tone: 'ok' as const, label: 'Selected' };
    }
    return { tone: 'mute' as const, label: required ? 'Required' : 'Not Attached' };
  };

  const isImage =
    file &&
    (file.type.startsWith('image/') ||
      file.name.match(/\.(jpg|jpeg|png|webp)$/i));

  const isPdf =
    file &&
    (file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf'));

  const badge = getBadgeProps();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        <Badge tone={badge.tone} label={badge.label} />
      </View>

      <View style={[styles.card, file ? styles.cardActive : null]}>
        {/* Preview Thumbnail / Icon */}
        <View style={styles.iconBox}>
          {isImage ? (
            <Image source={{ uri: file.uri }} style={styles.thumbnail} />
          ) : isPdf ? (
            <Text style={styles.pdfIcon}>📄</Text>
          ) : (
            <Text style={styles.emptyIcon}>📎</Text>
          )}
        </View>

        {/* File Information */}
        <View style={styles.infoCol}>
          <Text
            style={[styles.fileName, !file && styles.noFileText]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {file ? file.name : 'No document selected'}
          </Text>

          <Text style={styles.fileMeta}>
            {file && file.size
              ? `${formatFileSize(file.size)} · ${isPdf ? 'PDF Document' : 'Image'}`
              : description}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {acceptTypes !== 'image' && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handlePickDocument}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>📎 File / PDF</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handlePickPhoto(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>🖼️ Gallery</Text>
            </TouchableOpacity>

            {allowCamera && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handlePickPhoto(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>📷 Camera</Text>
              </TouchableOpacity>
            )}

            {file ? (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onFileSelect(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>✕ Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {uploadState === 'uploading' && (
          <ActivityIndicator size="small" color={COLORS.brand} style={styles.spinner} />
        )}
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  requiredStar: {
    color: COLORS.crimson,
    fontWeight: '900',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  cardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 44,
    height: 44,
    resizeMode: 'cover',
  },
  pdfIcon: {
    fontSize: 22,
  },
  emptyIcon: {
    fontSize: 20,
  },
  infoCol: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  noFileText: {
    color: COLORS.mute,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  fileMeta: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  removeBtn: {
    backgroundColor: COLORS.crimsonTint,
    borderWidth: 1,
    borderColor: COLORS.crimson,
    borderRadius: RADIUS.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.crimson,
  },
  spinner: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.crimson,
    marginTop: 4,
    fontWeight: '600',
  },
});
