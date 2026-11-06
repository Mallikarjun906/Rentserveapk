// Professional Document & Photo Uploader Component with Real File Selection, Validation & Lucide Icons

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
import {
  Camera,
  Image as ImageIcon,
  FileText,
  Paperclip,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
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
  hint?: string;
  acceptTypes?: 'image' | 'document' | 'all';
  file: UploadFile | null;
  onFileSelect?: (file: UploadFile | null) => void;
  onFileChange?: (file: UploadFile | null) => void;
  uploadState?: UploadState;
  errorMessage?: string;
  allowCamera?: boolean;
  required?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  label,
  description,
  hint,
  acceptTypes = 'all',
  file,
  onFileSelect,
  onFileChange,
  uploadState = file ? 'selected' : 'idle',
  errorMessage,
  allowCamera = true,
  required = false,
}) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const resolvedDescription = description || hint || 'PDF, JPG, PNG (Max 5MB)';

  const emitFile = (f: UploadFile | null) => {
    onFileSelect?.(f);
    onFileChange?.(f);
  };

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

        emitFile({
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
        const filename = asset.fileName || `photo-${Date.now()}.${ext}`;

        emitFile({
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

  const isImage =
    file &&
    (file.type?.startsWith('image/') ||
      file.name?.match(/\.(jpg|jpeg|png|webp)$/i));

  const isPdf =
    file &&
    (file.type === 'application/pdf' ||
      file.name?.toLowerCase().endsWith('.pdf'));

  const getStatusBadge = () => {
    if (uploadState === 'uploading') {
      return <Badge tone="warn" label="Uploading…" />;
    }
    if (uploadState === 'uploaded') {
      return <Badge tone="ok" label="Verified Upload" />;
    }
    if (uploadState === 'error') {
      return <Badge tone="bad" label="Upload Failed" />;
    }
    if (file) {
      return <Badge tone="info" label="Ready to Upload" />;
    }
    return <Badge tone="mute" label={required ? 'Required' : 'Optional'} />;
  };

  return (
    <View style={styles.container}>
      {/* Label and Badge Row */}
      <View style={styles.topRow}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        {getStatusBadge()}
      </View>

      {/* Upload Box Card */}
      <View style={[styles.card, file ? styles.cardActive : null]}>
        {/* Thumbnail / Icon Box */}
        <View style={styles.previewBox}>
          {isImage ? (
            <Image source={{ uri: file.uri }} style={styles.thumbnail} />
          ) : isPdf ? (
            <View style={[styles.typeIconBox, { backgroundColor: '#FEE2E2' }]}>
              <FileText size={24} color={COLORS.bad} />
            </View>
          ) : (
            <View style={[styles.typeIconBox, { backgroundColor: COLORS.paper }]}>
              <UploadCloud size={24} color={COLORS.mute} />
            </View>
          )}
        </View>

        {/* File Information & Action Controls */}
        <View style={styles.contentCol}>
          <Text
            style={[styles.fileName, !file && styles.noFileText]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {file ? file.name : 'No file chosen'}
          </Text>

          <Text style={styles.fileMeta}>
            {file && file.size
              ? `${formatFileSize(file.size)} · ${isPdf ? 'PDF Document' : 'Image'}`
              : resolvedDescription}
          </Text>

          {/* Action Button Row */}
          <View style={styles.actionsRow}>
            {acceptTypes !== 'image' && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handlePickDocument}
                activeOpacity={0.7}
              >
                <Paperclip size={13} color={COLORS.ink} style={styles.btnIcon} />
                <Text style={styles.actionBtnText}>Document</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handlePickPhoto(false)}
              activeOpacity={0.7}
            >
              <ImageIcon size={13} color={COLORS.ink} style={styles.btnIcon} />
              <Text style={styles.actionBtnText}>Gallery</Text>
            </TouchableOpacity>

            {allowCamera && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handlePickPhoto(true)}
                activeOpacity={0.7}
              >
                <Camera size={13} color={COLORS.ink} style={styles.btnIcon} />
                <Text style={styles.actionBtnText}>Camera</Text>
              </TouchableOpacity>
            )}

            {file ? (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => emitFile(null)}
                activeOpacity={0.7}
              >
                <X size={13} color={COLORS.bad} style={styles.btnIcon} />
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {uploadState === 'uploading' && (
          <ActivityIndicator size="small" color={COLORS.brand} style={styles.spinner} />
        )}
      </View>

      {/* Error Banner */}
      {errorMessage ? (
        <View style={styles.errorRow}>
          <AlertCircle size={14} color={COLORS.bad} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: 0.1,
  },
  requiredStar: {
    color: COLORS.brand,
    fontWeight: '900',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  cardActive: {
    borderColor: COLORS.brand,
    backgroundColor: '#FFFDFD',
  },
  previewBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 48,
    height: 48,
    resizeMode: 'cover',
  },
  typeIconBox: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCol: {
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
  },
  fileMeta: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  btnIcon: {
    marginRight: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.bad,
  },
  spinner: {
    marginLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.bad,
    fontWeight: '600',
    flex: 1,
  },
});
