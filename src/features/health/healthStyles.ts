import { StyleSheet } from 'react-native';
import { staticColors } from '../../design/tokens/colors';
import { fontSize, lineHeight } from '../../design/tokens/typography';
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
    backgroundColor: staticColors.scrim,
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
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formBody: {
    gap: 18,
    paddingBottom: 24,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.surface,
  },

  metricPickerSheet: {
    height: '94%',
    maxHeight: '94%',
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 18,
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
    fontWeight: '700',
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
    paddingVertical: 18,
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
    fontWeight: '500',
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
    paddingBottom: 20,
  },
  healthTabCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.overlay,
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  healthSectionEyebrow: {
    letterSpacing: 1.5,
    paddingBottom: 14,
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
    paddingVertical: 18,
    lineHeight: lineHeight.headingSm,
  },
  healthMonthLabel: {
    marginTop: 18,
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
    paddingTop: 28,
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
    gap: 5,
  },
  healthTimelineDate: {
    maxWidth: 104,
    textAlign: 'right',
  },
  healthSectionHeader: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 14,
  },
  healthSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  healthMedicationRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  healthMedicationIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthMedicationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  healthMedicationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  healthMedicationStatusButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
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

headerTitle: {
  fontSize: fontSize.headingLg,
  lineHeight: lineHeight.headingLg,
  fontWeight: '700',
},

headerButton: {
  width: 40,
  height: 40,
  borderRadius: radius.overlay,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
profileButton: {
  width: 40,
  height: 40,
  borderRadius: radius.overlay,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

  profileInitial: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
    fontWeight: '700',
  },

  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------

  membersScroll: {
    paddingRight: 12,
    paddingVertical: 2,
  },

memberItem: {
  width: 72,
  alignItems: 'center',
  gap: 6,
},
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberInitial: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },

  memberName: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: '600',
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
    width: 66,
    height: 66,
    borderRadius: radius.tile,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarText: {
    fontSize: fontSize.headingLg,
    lineHeight: lineHeight.headingLg,
    fontWeight: '600',
  },

  profileContent: {
    flex: 1,
    marginLeft: 12,
  },

profileName: {
  fontSize: fontSize.headingSm,
  lineHeight: lineHeight.headingSm,
  fontWeight: '700',
},
profileMeta: {
  fontSize: fontSize.bodySm,
  lineHeight: lineHeight.bodySm,
},
  // --------------------------------------------------------------------------
  // Prepare
  // --------------------------------------------------------------------------

  prepareVisit: {
  minHeight: 64,
  borderRadius: radius.tile,
  paddingHorizontal: 20,
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},

prepareText: {
  flex: 1,
  fontSize: fontSize.body,
  lineHeight: lineHeight.body,
  fontWeight: '700',
},

  // --------------------------------------------------------------------------
  // Quick actions
  // --------------------------------------------------------------------------

  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },

  quickAction: {
  flex: 1,
  minHeight: 60,
  borderRadius: radius.tile,
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
  quickActionText: {
  flex: 1,
  fontSize: fontSize.bodySm,
  lineHeight: lineHeight.bodySm,
  fontWeight: '600',
},

  // --------------------------------------------------------------------------
  // Tabs
  // --------------------------------------------------------------------------

  tabsScroll: {
    paddingRight: 12,
  },

  tabs: {
    minHeight: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },

  tab: {
    minHeight: 48,
    paddingHorizontal: 12,
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
    fontWeight: '600',
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

  statusBadge: {
    borderRadius: radius.tile,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  noRangeText: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: '600',
  },

  readingValue: {
    fontSize: fontSize.headingLg,
    lineHeight: lineHeight.headingLg,
    fontWeight: '700',
  },

  rangeText: {
    flex: 1,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  // --------------------------------------------------------------------------
  // Chart
  // --------------------------------------------------------------------------

  chartContainer: {
    width: '100%',
    height: 102,
    position: 'relative',
  },

  chartLabels: {
    position: 'absolute',
    left: 30,
    right: 10,
    bottom: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  chartRange: {
    position: 'absolute',
    right: 10,
    bottom: 22,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

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
    padding: 16,
    gap: 6,
  },

  sectionTitle: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },

  addReminder: {
    minHeight: 34,
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

  reminderRow: {
    minHeight: 68,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderContent: {
    flex: 1,
  },

  reminderTitle: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
    fontWeight: '600',
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
    padding: 16,
    gap: 12,
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
    fontWeight: '700',
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
    fontWeight: '600',
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
  backgroundColor: staticColors.scrim,
},

addHealthSheet: {
  width: '100%',
  maxHeight: '78%',
  borderTopLeftRadius: radius.overlay,
  borderTopRightRadius: radius.overlay,
  borderWidth: 1,
  paddingHorizontal: 24,
  paddingTop: 12,
  paddingBottom: 20,
},

addHealthGrabber: {
  width: 76,
  height: 7,
  borderRadius: radius.pill,
  alignSelf: 'center',
  marginBottom: 32,
},

addHealthTitle: {
  fontSize: fontSize.headingMd,
  lineHeight: lineHeight.headingMd,
  fontWeight: '700',
},

addHealthSubtitle: {
  fontSize: fontSize.body,
  lineHeight: lineHeight.body,
},

addHealthDivider: {
  height: 1,
  marginTop: 32,
},

addHealthRow: {
  minHeight: 82,
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  gap: 16,
},

addHealthIcon: {
  width: 36,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
},

addHealthRowContent: {
  flex: 1,
  minWidth: 0,
},

addHealthRowTitle: {
  fontSize: fontSize.body,
  lineHeight: lineHeight.body,
  fontWeight: '700',
},

addHealthRowDescription: {
  marginTop: 4,
  fontSize: fontSize.bodySm,
  lineHeight: lineHeight.bodySm,
},
});
