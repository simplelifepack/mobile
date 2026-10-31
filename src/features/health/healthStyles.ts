import { StyleSheet } from 'react-native';


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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalPanel: {
    maxHeight: '85%',
    padding: 20,
    gap: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  sheetGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8A97AE',
  },

  healthAddOption: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  healthAddIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  formGrabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 4,
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
    borderRadius: 14,
  },

  metricPickerSheet: {
    height: '94%',
    maxHeight: '94%',
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  metricPickerGrabber: {
    width: 76,
    height: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 36,
  },
  metricPickerTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  metricPickerSubtitle: {
    fontSize: 14,
    lineHeight: 23,
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
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricPickerCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  metricPickerText: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  metricPickerMetricName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '500',
  },
  metricPickerMetricDetail: {
    fontSize: 13,
    lineHeight: 19,
  },
  metricPickerFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },
  metricPickerButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
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
  metricPickerDoneText: {
    color: '#17151D',
  },

  healthTabContent: {
    paddingHorizontal: 2,
    paddingBottom: 20,
  },
  healthTabCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
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
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthEmptyText: {
    paddingVertical: 18,
    lineHeight: 22,
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
    borderRadius: 6,
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
    borderRadius: 14,
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
    borderRadius: 12,
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
    borderRadius: 14,
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
    borderRadius: 12,
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
    borderRadius: 16,
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
    borderRadius: 14,
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
    borderRadius: 12,
    fontSize: 14,
  },

  formSectionLabel: {
    fontSize: 11,
    lineHeight: 16,
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
    borderRadius: 10,
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
  fontSize: 22,
  lineHeight: 27,
  fontWeight: '700',
},

headerButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
profileButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

  profileInitial: {
    fontSize: 13,
    lineHeight: 17,
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
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberInitial: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '700',
  },

  memberName: {
    fontSize: 12,
    lineHeight: 17,
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
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
  },

  profileContent: {
    flex: 1,
    marginLeft: 12,
  },

profileName: {
  fontSize: 18,
  lineHeight: 23,
  fontWeight: '700',
},
profileMeta: {
  fontSize: 13,
  lineHeight: 19,
},
  // --------------------------------------------------------------------------
  // Prepare
  // --------------------------------------------------------------------------

  prepareVisit: {
  minHeight: 64,
  borderRadius: 18,
  paddingHorizontal: 20,
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},

prepareText: {
  flex: 1,
  fontSize: 14,
  lineHeight: 18,
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
  borderRadius: 17,
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
  quickActionText: {
  flex: 1,
  fontSize: 13,
  lineHeight: 17,
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
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },

  tabCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --------------------------------------------------------------------------
  // Results header
  // --------------------------------------------------------------------------

  resultsHeader: {
  minHeight: 34,
},

resultsCount: {
  flex: 1,
  fontSize: 12,
  lineHeight: 18,
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
    fontSize: 13,
    lineHeight: 19,
  },

  statusBadge: {
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  noRangeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },

  readingValue: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
  },

  rangeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
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
    fontSize: 11,
    lineHeight: 15,
  },

  removeReading: {
    fontSize: 12,
    lineHeight: 18,
  },

  sourceRow: {
    flex: 1,
    minWidth: 0,
  },

  sourceText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  // --------------------------------------------------------------------------
  // Reminders
  // --------------------------------------------------------------------------

  remindersCard: {
    padding: 16,
    gap: 6,
  },

  sectionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },

  addReminder: {
    minHeight: 34,
    borderRadius: 10,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderContent: {
    flex: 1,
  },

  reminderTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },

  reminderAction: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  medicalSummary: {
    marginTop: 2,
  },

  medicalPercentage: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '700',
  },

  medicalDescription: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  howButton: {
    minWidth: 58,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  readinessTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  readinessFill: {
    height: '100%',
    borderRadius: 4,
  },

  stillNeeded: {
    fontSize: 12,
    lineHeight: 18,
  },

  medicalRow: {
    minHeight: 42,
  },

  medicalValue: {
    fontSize: 12,
    lineHeight: 18,
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
  backgroundColor: 'rgba(0, 0, 0, 0.62)',
},

addHealthSheet: {
  width: '100%',
  maxHeight: '78%',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  borderWidth: 1,
  paddingHorizontal: 24,
  paddingTop: 12,
  paddingBottom: 20,
},

addHealthGrabber: {
  width: 76,
  height: 7,
  borderRadius: 4,
  alignSelf: 'center',
  marginBottom: 32,
},

addHealthTitle: {
  fontSize: 19,
  lineHeight: 24,
  fontWeight: '700',
},

addHealthSubtitle: {
  fontSize: 14,
  lineHeight: 18,
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
  fontSize: 14,
  lineHeight: 20,
  fontWeight: '700',
},

addHealthRowDescription: {
  marginTop: 4,
  fontSize: 13,
  lineHeight: 19,
},
});
