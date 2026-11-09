// In-Screen Document Previewer & Verification Review Modal (Images & Multi-Page PDFs)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { FileText, Image as ImageIcon, AlertTriangle, Lock, Check, X } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Badge } from './Badge';
import { Button } from './Button';
import { Storage } from '../../utils/storage';

export interface DocumentItem {
  id?: string;
  docType: string;
  title: string;
  url: string;
  isPdf?: boolean;
  format?: 'pdf' | 'jpg' | 'jpeg' | 'png' | 'webp';
  status?: 'pending' | 'approved' | 'rejected';
}

interface DocumentViewerModalProps {
  visible: boolean;
  onClose: () => void;
  document?: DocumentItem | null;
  documents?: DocumentItem[];
  currentIndex?: number;
  onSelectIndex?: (index: number) => void;
  // Admin review callbacks
  canReview?: boolean;
  onApprove?: (docType?: string) => Promise<void> | void;
  onReject?: (reason: string, docType?: string) => Promise<void> | void;
  actionLoading?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  visible,
  onClose,
  document: singleDoc,
  documents = [],
  currentIndex = 0,
  onSelectIndex,
  canReview = false,
  onApprove,
  onReject,
  actionLoading = false,
}) => {
  const [activeIdx, setActiveIdx] = useState(currentIndex);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pdfPage, setPdfPage] = useState(1);

  // Consolidate document list
  const activeList: DocumentItem[] =
    documents.length > 0 ? documents : singleDoc ? [singleDoc] : [];
  const currentDoc: DocumentItem | undefined = activeList[activeIdx] || singleDoc;

  // Fetch token for authenticated document streaming
  useEffect(() => {
    let isMounted = true;
    Storage.getToken().then((token) => {
      if (isMounted) setAuthToken(token);
    });
    return () => {
      isMounted = false;
    };
  }, [visible]);

  useEffect(() => {
    setActiveIdx(currentIndex);
  }, [currentIndex]);

  // Reset state when switching documents
  useEffect(() => {
    setZoomLevel(1.0);
    setLoading(true);
    setLoadError(null);
    setPdfPage(1);
  }, [activeIdx, currentDoc?.url]);

  if (!visible || !currentDoc) return null;

  // Determine if document is PDF
  const isPdf =
    currentDoc.isPdf ||
    currentDoc.format === 'pdf' ||
    currentDoc.url.toLowerCase().includes('.pdf') ||
    currentDoc.url.toLowerCase().includes('drivinglicence') ||
    currentDoc.title.toLowerCase().includes('licence') ||
    currentDoc.title.toLowerCase().includes('pdf');

  // Build authenticated stream URL (appends token query param for seamless in-screen rendering)
  const separator = currentDoc.url.includes('?') ? '&' : '?';
  const authenticatedUrl = authToken
    ? `${currentDoc.url}${separator}token=${encodeURIComponent(authToken)}`
    : currentDoc.url;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.35, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.35, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      Alert.alert(
        'Reason Required',
        'Please provide a specific reason for rejection so the user can resubmit correct documents.'
      );
      return;
    }
    if (onReject) {
      onReject(rejectionReason.trim(), currentDoc.docType);
    }
    setRejectModalOpen(false);
    setRejectionReason('');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Top Navigation & Document Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <X size={15} color={COLORS.ink} />
              <Text style={styles.backBtnText}>Close</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentDoc.title}
            </Text>
            <View style={styles.metaRow}>
              <Badge
                tone={isPdf ? 'info' : 'ok'}
                label={isPdf ? 'Multi-page PDF Document' : 'Official Photo / ID'}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 6 }}>
                <Lock size={12} color={COLORS.ok} />
                <Text style={styles.secureText}>In-Screen Authenticated Preview</Text>
              </View>
            </View>
          </View>

          {/* Zoom Quick Controls in Header */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={handleZoomOut}
              accessibilityLabel="Zoom out"
            >
              <Text style={styles.zoomBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomLevelPill}
              onPress={handleResetZoom}
              accessibilityLabel="Reset zoom to 100%"
            >
              <Text style={styles.zoomLevelText}>{Math.round(zoomLevel * 100)}%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={handleZoomIn}
              accessibilityLabel="Zoom in"
            >
              <Text style={styles.zoomBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Multi-Document Switcher Pills (when multiple documents are attached) */}
        {activeList.length > 1 && (
          <View style={styles.docTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.docTabsScroll}
            >
              {activeList.map((item, idx) => (
                <TouchableOpacity
                  key={item.docType || idx}
                  style={[
                    styles.docTabPill,
                    activeIdx === idx && styles.docTabPillActive,
                    { flexDirection: 'row', alignItems: 'center' },
                  ]}
                  onPress={() => {
                    setActiveIdx(idx);
                    if (onSelectIndex) onSelectIndex(idx);
                  }}
                >
                  {item.isPdf ? (
                    <FileText size={13} color={activeIdx === idx ? COLORS.white : COLORS.mute} style={{ marginRight: 5 }} />
                  ) : (
                    <ImageIcon size={13} color={activeIdx === idx ? COLORS.white : COLORS.mute} style={{ marginRight: 5 }} />
                  )}
                  <Text
                    style={[
                      styles.docTabPillText,
                      activeIdx === idx && styles.docTabPillTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Document Rendering Body */}
        <View style={styles.body}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.brand} />
              <Text style={styles.loadingText}>
                Loading in-screen document preview securely…
              </Text>
            </View>
          )}

          {loadError ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={36} color={COLORS.bad} />
              <Text style={styles.errorTitle}>Could Not Load Document</Text>
              <Text style={styles.errorDesc}>{loadError}</Text>
              <Button
                title="Retry Preview"
                variant="primary"
                size="sm"
                onPress={() => {
                  setLoadError(null);
                  setLoading(true);
                }}
                style={{ marginTop: 12 }}
              />
            </View>
          ) : isPdf ? (
            /* PDF In-Screen Viewer */
            Platform.OS === 'web' ? (
              <View style={styles.webPdfContainer}>
                <iframe
                  src={`${authenticatedUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${Math.round(
                    zoomLevel * 100
                  )}`}
                  title={currentDoc.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#525659',
                  }}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setLoadError('Failed to load PDF document stream.');
                  }}
                />
              </View>
            ) : (
              /* Native PDF Viewer with WebView */
              <View style={styles.nativePdfContainer}>
                <WebView
                  source={{
                    uri: authenticatedUrl,
                    headers: authToken
                      ? { Authorization: `Bearer ${authToken}` }
                      : undefined,
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    transform: [{ scale: zoomLevel }],
                  }}
                  originWhitelist={['*']}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scalesPageToFit={true}
                  pinchGestureEnabled={true}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  onLoadStart={() => setLoading(true)}
                  onLoadEnd={() => setLoading(false)}
                  onError={(syntheticEvent) => {
                    setLoading(false);
                    const { nativeEvent } = syntheticEvent;
                    setLoadError(
                      nativeEvent.description ||
                        'Unable to render PDF stream. Please verify access rights.'
                    );
                  }}
                />
              </View>
            )
          ) : (
            /* Image In-Screen Viewer with Pinch-To-Zoom & Pan */
            <ScrollView
              style={styles.imageScroll}
              contentContainerStyle={styles.imageScrollContent}
              maximumZoomScale={4.0}
              minimumZoomScale={0.5}
              showsHorizontalScrollIndicator={true}
              showsVerticalScrollIndicator={true}
              centerContent={true}
            >
              <Image
                source={{
                  uri: authenticatedUrl,
                  headers: authToken
                    ? { Authorization: `Bearer ${authToken}` }
                    : undefined,
                }}
                style={[
                  styles.previewImage,
                  {
                    transform: [{ scale: zoomLevel }],
                  },
                ]}
                resizeMode="contain"
                onLoadStart={() => setLoading(true)}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setLoadError(
                    'Failed to render image. Verify backend session authorization.'
                  );
                }}
              />
            </ScrollView>
          )}
        </View>

        {/* Floating Zoom & Page Controls Bar */}
        <View style={[styles.floatingBar, SHADOWS.card]}>
          <View style={styles.floatingControls}>
            <TouchableOpacity style={styles.controlPill} onPress={handleZoomOut}>
              <Text style={styles.controlPillText}>− Zoom Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlPill} onPress={handleResetZoom}>
              <Text style={styles.controlPillText}>100% Fit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlPill} onPress={handleZoomIn}>
              <Text style={styles.controlPillText}>+ Zoom In</Text>
            </TouchableOpacity>
          </View>

          {activeList.length > 1 && (
            <View style={styles.pagerRow}>
              <TouchableOpacity
                disabled={activeIdx === 0}
                style={[styles.pagerBtn, activeIdx === 0 && styles.pagerBtnDisabled]}
                onPress={() => {
                  const next = Math.max(0, activeIdx - 1);
                  setActiveIdx(next);
                  if (onSelectIndex) onSelectIndex(next);
                }}
              >
                <Text style={styles.pagerBtnText}>← Prev Document</Text>
              </TouchableOpacity>

              <Text style={styles.pagerLabel}>
                {activeIdx + 1} of {activeList.length}
              </Text>

              <TouchableOpacity
                disabled={activeIdx >= activeList.length - 1}
                style={[
                  styles.pagerBtn,
                  activeIdx >= activeList.length - 1 && styles.pagerBtnDisabled,
                ]}
                onPress={() => {
                  const next = Math.min(activeList.length - 1, activeIdx + 1);
                  setActiveIdx(next);
                  if (onSelectIndex) onSelectIndex(next);
                }}
              >
                <Text style={styles.pagerBtnText}>Next Document →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Administrator Verification & Approval Actions Bar */}
        {canReview && (
          <View style={[styles.reviewBar, SHADOWS.pop]}>
            <View style={styles.reviewBarInner}>
              <View style={styles.reviewInfo}>
                <Text style={styles.reviewLabel}>ADMINISTRATOR DECISION DESK</Text>
                <Text style={styles.reviewSub}>
                  Record decision for {currentDoc.title}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.decisionBtn, styles.rejectBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                  onPress={() => setRejectModalOpen(true)}
                  disabled={actionLoading}
                >
                  <X size={15} color={COLORS.bad} />
                  <Text style={styles.rejectBtnText}>Reject Document</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.decisionBtn, styles.approveBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                  onPress={() => onApprove && onApprove(currentDoc.docType)}
                  disabled={actionLoading}
                >
                  <Check size={15} color={COLORS.white} />
                  <Text style={styles.approveBtnText}>Approve Document</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Rejection Reason Modal */}
        <Modal
          visible={rejectModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRejectModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.rejectCard, SHADOWS.pop]}>
              <Text style={styles.rejectCardTitle}>Specify Rejection Reason</Text>
              <Text style={styles.rejectCardSub}>
                Explain why this document was rejected so the user can resubmit a valid,
                legible copy:
              </Text>

              <TextInput
                style={styles.reasonInput}
                multiline
                numberOfLines={4}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="e.g. Document image is blurry / expired licence. Please upload a clear colour scan."
                placeholderTextColor={COLORS.muteLight}
              />

              <View style={styles.rejectActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="sm"
                  onPress={() => setRejectModalOpen(false)}
                />
                <Button
                  title="Confirm Rejection"
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  onPress={handleConfirmReject}
                  style={{ backgroundColor: COLORS.bad, borderColor: COLORS.bad }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1E1E24',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2A2A32',
    borderBottomWidth: 1,
    borderColor: '#3D3D48',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  secureText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A20',
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: '#383845',
  },
  zoomBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  zoomBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  zoomLevelPill: {
    paddingHorizontal: 6,
  },
  zoomLevelText: {
    color: '#F3F4F6',
    fontSize: 11,
    fontWeight: '700',
  },
  docTabsContainer: {
    backgroundColor: '#25252D',
    borderBottomWidth: 1,
    borderColor: '#33333F',
    paddingVertical: 8,
  },
  docTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  docTabPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: '#353542',
  },
  docTabPillActive: {
    backgroundColor: COLORS.brand,
  },
  docTabPillText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  docTabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  body: {
    flex: 1,
    backgroundColor: '#121216',
    position: 'relative',
    overflow: 'hidden',
  },
  webPdfContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nativePdfContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageScroll: {
    flex: 1,
  },
  imageScrollContent: {
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  previewImage: {
    width: Math.min(SCREEN_WIDTH - 32, 600),
    height: Math.min(SCREEN_HEIGHT * 0.7, 650),
    borderRadius: RADIUS.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 22, 0.85)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 8,
  },
  errorEmoji: {
    fontSize: 36,
  },
  errorTitle: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '800',
  },
  errorDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  floatingBar: {
    backgroundColor: '#25252D',
    borderTopWidth: 1,
    borderColor: '#383845',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  floatingControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  controlPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pagerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  pagerBtnDisabled: {
    opacity: 0.35,
  },
  pagerBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pagerLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  reviewBar: {
    backgroundColor: '#2A2A34',
    borderTopWidth: 2,
    borderColor: COLORS.brand,
    padding: 14,
  },
  reviewBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  reviewInfo: {
    flex: 1,
    minWidth: 200,
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.brand,
    letterSpacing: 0.5,
  },
  reviewSub: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  decisionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  rejectBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rejectCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 22,
    width: '100%',
    maxWidth: 480,
  },
  rejectCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
    marginBottom: 6,
  },
  rejectCardSub: {
    fontSize: 13,
    color: COLORS.mute,
    lineHeight: 18,
    marginBottom: 14,
  },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 13,
    color: COLORS.ink,
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 16,
  },
  rejectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
