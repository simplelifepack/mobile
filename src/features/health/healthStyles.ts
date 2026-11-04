import { sizes } from '../../design/tokens/sizes';
import { StyleSheet } from 'react-native';
import { fontSize, lineHeight, fontWeights} from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';


export const styles = StyleSheet.create({

  // --------------------------------------------------------------------------
  // Main container
  // --------------------------------------------------------------------------

  container: {
    paddingHorizontal: 12,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalPanel: {
    maxHeight: '85%',
    padding: 20,
    gap: 12,
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
  },

  sheetGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
  },

  healthAddOption: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  healthAddIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  healthAddCopy: {
    flex: 1,
    minWidth: 0,
  },

  formDismiss: {
    flex: 1,
  },

  formSheet: {
    maxHeight: '94%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
  },

  formGrabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: radius.pill,
  },

  formClose: {
    minWidth: sizes.minimumTouchTarget,
    minHeight: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formBody: {
    gap: 16,
    paddingBottom: 24,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.surface,
  },

  metricPickerSheet: {
    height: '94%',
    maxHeight: '94%',
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopLeftRadius: radius.pill,
    borderTopRightRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  metricPickerGrabber: {
    width: 76,
    height: 8,
    borderRadius: radius.control,
    alignSelf: 'center',
    marginBottom: 36,
  },
  metricPickerTitle: {
    fontSize: fontSize.headingMd,
    lineHeight: lineHeight.headingMd,
    fontWeight: fontWeights.bold,
    marginBottom: 16,
  },
  metricPickerSubtitle: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    marginBottom: 12,
  },
  metricPickerList: {
    flex: 1,
    minHeight: 0,
  },
  metricPickerListContent: {
    paddingBottom: 12,
  },
  metricPickerRow: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 24,
  },
  metricPickerCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.overlay,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricPickerCircleInner: {
    width: 12,
    height: 12,
    borderRadius: radius.control,
  },
  metricPickerText: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  metricPickerMetricName: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: fontWeights.medium,
  },
  metricPickerMetricDetail: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },
  metricPickerFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },
  metricPickerButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  metricPickerResetButton: {
    backgroundColor: 'transparent',
  },
  metricPickerDoneButton: {
    borderColor: 'transparent',
  },

  healthTabContent: {
    paddingHorizontal: 2,
    paddingBottom: 8,
  },
  healthTabCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.overlay,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  healthSectionEyebrow: {
    letterSpacing: 1.5,
    paddingBottom: 8,
  },
  healthReminderRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  healthReminderCopy: {
    flex: 1,
    gap: 6,
  },
  healthSmallAction: {
    width: 52,
    height: 52,
    borderRadius: radius.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthEmptyText: {
    paddingVertical: 16,
    lineHeight: lineHeight.headingSm,
  },
  healthMonthLabel: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 8,
    letterSpacing: 2,
  },
  healthTimelineRow: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthTimelineRail: {
    width: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  healthTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: radius.control,
    zIndex: 1,
  },
  healthTimelineLine: {
    width: 1,
    flex: 1,
    marginTop: 4,
  },
  healthTimelineIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthTimelineCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  healthTimelineDate: {
    maxWidth: 104,
    textAlign: 'right',
  },
  healthSectionHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 8,
  },
  healthSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  healthAddButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthMedicationStatusButton: {
    minHeight: sizes.minimumTouchTarget,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    justifyContent: 'center',
    gap: 8,
  },
  healthUploadButton: {
    minHeight: 64,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: radius.tile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthRecordRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  healthRecordIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthRecordCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },

  formInput: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: radius.surface,
    fontSize: fontSize.body,
  },

  formSectionLabel: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  medicationNameField: {
    flex: 1.6,
    minWidth: 0,
  },

  medicationDoseField: {
    flex: 0.8,
    minWidth: 0,
  },

  readingValueField: {
    flex: 1.25,
    minWidth: 0,
  },

  readingUnitField: {
    flex: 1,
    minWidth: 0,
  },

  formContent: {
    gap: 12,
    paddingBottom: 20,
  },

  metricChoice: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  metricText: {
    flex: 1,
    minWidth: 0,
  },

  // --------------------------------------------------------------------------
  // Header
  // --------------------------------------------------------------------------

  header: {
    minHeight: 44,
  },

headerButton: {
  width: sizes.minimumTouchTarget,
  height: sizes.minimumTouchTarget,
  borderRadius: radius.overlay,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------

  membersScroll: {
    paddingRight: 12,
    paddingVertical: 2,
  },

memberItem: {
  width: 60,
  alignItems: 'center',
  gap: 4,
},
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberInitial: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: fontWeights.bold,
  },

  memberName: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: fontWeights.semibold,
  },

  // --------------------------------------------------------------------------
  // Profile
  // --------------------------------------------------------------------------

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },

  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.tile,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarText: {
    fontSize: fontSize.headingSm,
    lineHeight: lineHeight.headingSm,
    fontWeight: fontWeights.semibold,
  },

  profileContent: {
    flex: 1,
    marginLeft: 12,
  },

profileName: {
  fontSize: fontSize.headingSm,
  lineHeight: lineHeight.headingSm,
  fontWeight: fontWeights.bold,
},
profileMeta: {
  fontSize: fontSize.bodySm,
  lineHeight: lineHeight.bodySm,
},
  // --------------------------------------------------------------------------
  // Prepare
  // --------------------------------------------------------------------------

  prepareVisit: {
  minHeight: 48,
  borderRadius: radius.tile,
  paddingHorizontal: 16,
  paddingVertical: 8,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},

prepareText: {
  flex: 1,
  fontSize: fontSize.body,
  lineHeight: lineHeight.body,
  fontWeight: fontWeights.bold,
},

  // --------------------------------------------------------------------------
  // Quick actions
  // --------------------------------------------------------------------------

  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },

  quickAction: {
  flex: 1,
  minHeight: 44,
  borderRadius: radius.tile,
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: 8,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
  quickActionText: {
  flex: 1,
  fontSize: fontSize.bodySm,
  lineHeight: lineHeight.bodySm,
  fontWeight: fontWeights.semibold,
},

  // --------------------------------------------------------------------------
  // Tabs
  // --------------------------------------------------------------------------

  tabs: {
    minHeight: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },

  tab: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  tabText: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: fontWeights.semibold,
  },

  // --------------------------------------------------------------------------
  // Results header
  // --------------------------------------------------------------------------

  resultsHeader: {
  minHeight: 34,
},

resultsCount: {
  flex: 1,
  fontSize: fontSize.caption,
  lineHeight: lineHeight.caption,
},

  // --------------------------------------------------------------------------
  // Reading cards
  // --------------------------------------------------------------------------

  readingCard: {
    padding: 12,
    gap: 8,
  },

  readingTitle: {
    flex: 1,
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  noRangeText: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: fontWeights.semibold,
  },

  readingValue: {
    fontSize: fontSize.headingLg,
    lineHeight: lineHeight.headingLg,
    fontWeight: fontWeights.bold,
  },

  rangeText: {
    flex: 1,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  // --------------------------------------------------------------------------
  // Chart
  // --------------------------------------------------------------------------

  removeReading: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  sourceRow: {
    flex: 1,
    minWidth: 0,
  },

  sourceText: {
    flexShrink: 1,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  // --------------------------------------------------------------------------
  // Reminders
  // --------------------------------------------------------------------------

  remindersCard: {
    padding: 12,
    gap: 4,
  },

  sectionTitle: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: fontWeights.bold,
  },

  addReminder: {
    minHeight: 32,
    borderRadius: radius.surface,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  divider: {
    width: '100%',
    height: 1,
    marginVertical: 4,
  },

  reminderAction: {
    width: 36,
    height: 36,
    borderRadius: radius.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.surface,
    borderWidth: 2,
  },

  // --------------------------------------------------------------------------
  // Medical readiness
  // --------------------------------------------------------------------------

  medicalCard: {
    padding: 12,
    gap: 8,
  },

  editButton: {
    minHeight: 34,
    borderRadius: radius.surface,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  medicalSummary: {
    marginTop: 2,
  },

  medicalPercentage: {
    fontSize: fontSize.headingXl,
    lineHeight: lineHeight.headingXl,
    fontWeight: fontWeights.bold,
  },

  medicalDescription: {
    flex: 1,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  howButton: {
    minWidth: 58,
    height: 40,
    borderRadius: radius.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  readinessTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },

  readinessFill: {
    height: '100%',
    borderRadius: radius.pill,
  },

  stillNeeded: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  medicalRow: {
    minHeight: 42,
  },

  medicalValue: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: fontWeights.semibold,
  },

  // --------------------------------------------------------------------------
  // Empty
  // --------------------------------------------------------------------------

  emptyCard: {
    paddingVertical: 24,
    gap: 8,
  },
  // --------------------------------------------------------------------------
// Add to Health bottom sheet
// --------------------------------------------------------------------------

addHealthOverlay: {
  flex: 1,
  justifyContent: 'flex-end',
},

addHealthBackdrop: {
  ...StyleSheet.absoluteFill,
},

addHealthSheet: {
  width: '100%',
  maxHeight: '78%',
  borderTopLeftRadius: radius.overlay,
  borderTopRightRadius: radius.overlay,
  borderWidth: 1,
  paddingHorizontal: 16,
  paddingTop: 8,
},

addHealthGrabber: {
  width: sizes.sheetHandle.width,
  height: sizes.sheetHandle.height,
  borderRadius: radius.pill,
  alignSelf: 'center',
  marginBottom: 8,
},

addHealthTitle: {
  fontSize: fontSize.body,
  lineHeight: lineHeight.body,
  fontWeight: fontWeights.semibold,
},

addHealthSubtitle: {
  fontSize: fontSize.bodySm,
  lineHeight: lineHeight.bodySm,
},

addHealthList: {
  marginTop: 8,
},
});
