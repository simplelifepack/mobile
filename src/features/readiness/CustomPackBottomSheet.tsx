import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  Check,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { Stack } from '../../components/primitives/Stack';

import { useAppTheme } from '../../design/theme/ThemeProvider';

import type {
  CustomPackDraft,
  CustomPackPayload,
  CustomPackageGenerationJob,
  PackageSearchResponse,
  PackageSummary,
  VerificationSource,
} from '../../api/types';


/* ============================================================================
   TYPES
============================================================================ */

type CustomPackBottomSheetProps = {
  visible: boolean;
  onClose: () => void;

  documentLabels: string[];

  onCreateGenerationJob: (
    packageType: string,
    documentLabels: string[],
  ) => Promise<CustomPackageGenerationJob>;

  onGetGenerationJob: (
    jobId: string,
  ) => Promise<CustomPackageGenerationJob>;

  onSearchOrGenerate: (
    packageType: string,
    documentLabels: string[],
  ) => Promise<PackageSearchResponse>;

  onSaveCustomPack: (
    payload: CustomPackPayload,
  ) => Promise<PackageSummary>;

  onPackSaved: (
    pack: PackageSummary,
  ) => void;
};

type Step =
  | 'lookup'
  | 'result';


/* ============================================================================
   HELPERS
============================================================================ */

function isMissingRoute(error: unknown) {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    ((error as { status?: unknown }).status === 404 ||
      (error as { status?: unknown }).status === 405)
  );
}

function packageToDraft(pack: PackageSummary): CustomPackDraft {
  const verificationSources = pack.verificationSources ?? [];
  const hasVerifiedOfficialSource =
    pack.verificationStatus === 'verified' && verificationSources.length > 0;

  return {
    packageName: pack.title,
    category: pack.category,
    description: pack.description,
    searchMetadata: {
      ...pack.searchMetadata,
      searchPhrases: pack.searchMetadata?.searchPhrases ?? [],
    },
    sourceTitle: pack.source?.title ?? '',
    sourceUrl: pack.source?.url ?? '',
    sourceOrganization: pack.source?.name ?? '',
    lastChecked: pack.source?.lastCheckedAt ?? '',
    verificationSources,
    lastVerifiedAt: pack.lastVerifiedAt ?? null,
    verificationStatus: pack.verificationStatus ?? 'user_created',
    hasVerifiedOfficialSource,
    confidence: pack.searchMetadata?.confidence,
    disclaimer: pack.searchMetadata?.disclaimer,
    requiredDocuments: pack.requirements
      .filter(requirement => requirement.required)
      .map(requirement => ({
        id: requirement.id,
        category: pack.category,
        documentType: requirement.acceptedDocumentTypes?.[0] ?? 'other',
        owner: requirement.owner ?? 'self',
        name: requirement.title,
        title: requirement.title,
        required: requirement.required,
        whyNeeded: requirement.description ?? '',
      })),
  };
}

function errorMessage(
  error: unknown,
  fallback: string,
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === 'object'
  ) {
    const value = error as {
      message?: unknown;
      error?: unknown;
      data?: {
        message?: unknown;
      };
    };

    if (
      typeof value.message === 'string'
    ) {
      return value.message;
    }

    if (
      typeof value.error === 'string'
    ) {
      return value.error;
    }

    if (
      typeof value.data?.message ===
      'string'
    ) {
      return value.data.message;
    }
  }

  return fallback;
}


/**
 * Makes matching slightly more tolerant.
 *
 * Example:
 * Passport
 * passport
 * Passport Document
 * passport_document
 */
function normalizeDocumentLabel(
  value: string,
) {
  return value
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


/**
 * Determines whether a requirement is already
 * represented in the user's archive.
 */
function requirementExistsInArchive(
  requirement: string,
  documentLabels: string[],
) {
  const required =
    normalizeDocumentLabel(
      requirement,
    );

  if (!required) {
    return false;
  }

  return documentLabels.some(label => {
    const document =
      normalizeDocumentLabel(label);

    if (!document) {
      return false;
    }

    if (
      document === required
    ) {
      return true;
    }

    if (
      document.includes(required) ||
      required.includes(document)
    ) {
      return true;
    }

    /*
     * Common document aliases.
     */
    const aliases: Record<
      string,
      string[]
    > = {
      passport: [
        'passport',
        'passport document',
        'travel document',
      ],

      'proof of funds': [
        'proof of funds',
        'bank statement',
        'financial statement',
        'bank account',
      ],

      'travel itinerary': [
        'travel itinerary',
        'itinerary',
        'flight itinerary',
      ],

      'accommodation proof': [
        'accommodation proof',
        'hotel booking',
        'accommodation',
        'hotel reservation',
      ],

      'passport photos': [
        'passport photos',
        'passport photo',
        'photo',
        'photograph',
      ],
    };

    const aliasesForRequirement =
      aliases[required];

    if (
      aliasesForRequirement?.includes(
        document,
      )
    ) {
      return true;
    }

    return false;
  });
}


/* ============================================================================
   COMPONENT
============================================================================ */

export function CustomPackBottomSheet({
  visible,
  onClose,
  documentLabels,
  onCreateGenerationJob,
  onGetGenerationJob,
  onSearchOrGenerate,
  onSaveCustomPack,
  onPackSaved,
}: CustomPackBottomSheetProps) {
  const { theme } =
    useAppTheme();
  const insets = useSafeAreaInsets();

  const [
    step,
    setStep,
  ] = useState<Step>('lookup');

  const [
    purpose,
    setPurpose,
  ] = useState('');

  const [
    packName,
    setPackName,
  ] = useState('');

  const [
    requirements,
    setRequirements,
  ] = useState<string[]>([
    '',
    '',
  ]);

  const [
    source,
    setSource,
  ] =
    useState<
      CustomPackPayload['source']
    >();

  const [
    verificationSources,
    setVerificationSources,
  ] = useState<
    VerificationSource[]
  >([]);

  const [
    verificationStatus,
    setVerificationStatus,
  ] = useState(
    'user_created',
  );

  const [
    searchMetadata,
    setSearchMetadata,
  ] =
    useState<
      Record<string, unknown>
    >();

  const [
    disclaimer,
    setDisclaimer,
  ] = useState('');

  const [
    generationJob,
    setGenerationJob,
  ] =
    useState<
      CustomPackageGenerationJob
    >();

  const [
    lookupLoading,
    setLookupLoading,
  ] = useState(false);

  const [
    lookupError,
    setLookupError,
  ] = useState<string>();

  const translateY =
    useRef(
      new Animated.Value(800),
    ).current;

  const backdropOpacity =
    useRef(
      new Animated.Value(0),
    ).current;


  /* ==========================================================================
     OPEN / CLOSE
  ========================================================================== */

  useEffect(() => {
    if (!visible) {
      return;
    }

    setStep('lookup');
    setPurpose('');
    setPackName('');
    setRequirements([
      '',
      '',
    ]);
    setSource(undefined);
    setVerificationSources([]);
    setVerificationStatus(
      'user_created',
    );
    setSearchMetadata(undefined);
    setDisclaimer('');
    setGenerationJob(undefined);
    setLookupError(undefined);
    setLookupLoading(false);

    Animated.parallel([
      Animated.spring(
        translateY,
        {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 180,
          mass: 0.8,
        },
      ),

      Animated.timing(
        backdropOpacity,
        {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        },
      ),
    ]).start();
  }, [
    visible,
    translateY,
    backdropOpacity,
  ]);


  const close = (
    afterClose?: () => void,
  ) => {
    Animated.parallel([
      Animated.timing(
        translateY,
        {
          toValue: 800,
          duration: 220,
          useNativeDriver: true,
        },
      ),

      Animated.timing(
        backdropOpacity,
        {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        },
      ),
    ]).start(
      ({ finished }) => {
        if (!finished) {
          return;
        }

        onClose();
        afterClose?.();
      },
    );
  };


  /* ==========================================================================
     REQUIREMENTS
  ========================================================================== */

  const addRequirement =
    () => {
      setRequirements(
        current => [
          ...current,
          '',
        ],
      );
    };


  const updateRequirement = (
    index: number,
    value: string,
  ) => {
    setRequirements(
      current =>
        current.map(
          (
            item,
            itemIndex,
          ) =>
            itemIndex === index
              ? value
              : item,
        ),
    );
  };


  const removeRequirement = (
    index: number,
  ) => {
    setRequirements(
      current => {
        if (
          current.length <= 1
        ) {
          return [''];
        }

        return current.filter(
          (
            _,
            itemIndex,
          ) =>
            itemIndex !==
            index,
        );
      },
    );
  };


  const canSave =
    packName.trim().length >
      0 &&
    requirements.some(
      requirement =>
        requirement.trim()
          .length > 0,
    );


  /* ==========================================================================
     APPLY SERVER RESPONSE
  ========================================================================== */

  const applyDraft = (
    draft: CustomPackDraft,
    job: CustomPackageGenerationJob,
    query: string,
  ) => {
    setPackName(
      current =>
        current.trim() ||
        draft.packageName,
    );

    setPurpose(
      current =>
        current.trim() ||
        draft.description,
    );

    const requiredDocuments =
      (draft.requiredDocuments ?? [])
        .map(
          requirement =>
            requirement.title ||
            requirement.name,
        )
        .filter(Boolean);
    setRequirements(requiredDocuments.length ? requiredDocuments : ['']);

    setSource(
      draft.sourceUrl
        ? {
            name:
              draft.sourceOrganization,

            title:
              draft.sourceTitle,

            url:
              draft.sourceUrl,

            lastCheckedAt:
              draft.lastChecked,
          }
        : undefined,
    );

    setVerificationSources(
      draft.verificationSources,
    );

    setVerificationStatus(
      draft.verificationStatus ||
        (
          draft
            .verificationSources
            .length
            ? 'draft_verified'
            : 'user_created'
        ),
    );

    setSearchMetadata({
      ...draft.searchMetadata,

      searchPhrases:
        draft.searchMetadata
          .searchPhrases ??
        [query],

      confidence:
        job.confidence,

      disclaimer:
        job.disclaimer ??
        draft.disclaimer,

      hasVerifiedOfficialSource:
        job.hasVerifiedOfficialSource,
    });

    setDisclaimer(
      job.disclaimer ??
        draft.disclaimer ??
        (requiredDocuments.length
          ? ''
          : 'No requirements were returned. Add the documents you need below.'),
    );

    setGenerationJob(job);
  };


  /* ==========================================================================
     LOOKUP
  ========================================================================== */

  const lookupPack =
    async () => {
      const packageType =
        purpose.trim();

      if (
        !packageType ||
        lookupLoading
      ) {
        return;
      }

      setLookupLoading(true);
      setLookupError(undefined);

      /*
       * Immediately move to result UI.
       * This allows the user to see that research
       * is happening.
       */
      setStep('result');

      if (!packName.trim()) {
        setPackName(
          packageType
            .replace(
              /^documents?\s+(needed|required|requested)\s+(for|by)\s+/i,
              '',
            )
            .slice(0, 80),
        );
      }

      try {
        /*
         * 1. Create generation job
         */
        let job =
          await onCreateGenerationJob(
            packageType,
            documentLabels,
          );

        setGenerationJob(job);

        /*
         * 2. Wait for backend generation
         */
        const terminalStatuses =
          new Set([
            'completed',
            'completed_with_unverified_sources',
            'failed',
          ]);

        /*
         * 3. Poll every 1.5 seconds
         */
        for (
          let attempt = 0;

          !job.draft &&
          !terminalStatuses.has(
            job.status,
          ) &&
          attempt < 40;

          attempt += 1
        ) {
          await new Promise<void>(
            resolve =>
              setTimeout(
                resolve,
                1500,
              ),
          );

          job =
            await onGetGenerationJob(
              job.id,
            );

          setGenerationJob(
            job,
          );
        }

        /*
         * 4. No draft
         */
        if (!job.draft) {
          throw new Error(
            job.errorMessage ||
              'Could not generate this package right now.',
          );
        }

        /*
         * 5. Apply response to UI
         */
        applyDraft(
          job.draft,
          job,
          packageType,
        );
      } catch (error) {
        if (isMissingRoute(error)) {
          try {
            const result = await onSearchOrGenerate(
              packageType,
              documentLabels,
            );
            const draft = packageToDraft(result.package);
            const fallbackJob: CustomPackageGenerationJob = {
              id: result.package.slug,
              status: 'completed',
              statusMessage: 'Package requirements loaded',
              draft,
              queuedAt: new Date().toISOString(),
              retryCount: 0,
              provider429Count: 0,
              hasVerifiedOfficialSource: Boolean(
                draft.hasVerifiedOfficialSource,
              ),
              confidence: draft.confidence,
              disclaimer: draft.disclaimer,
            };

            setGenerationJob(fallbackJob);
            applyDraft(draft, fallbackJob, packageType);
            return;
          } catch (fallbackError) {
            error = fallbackError;
          }
        }

        setLookupError(
          errorMessage(
            error,
            'Could not look this up right now. You can still add the documents yourself.',
          ),
        );

        /*
         * Keep result screen visible so
         * user can manually edit requirements.
         */
        setRequirements(
          current =>
            current.length
              ? current
              : [''],
        );
      } finally {
        setLookupLoading(
          false,
        );
      }
    };


  /* ==========================================================================
     SAVE
  ========================================================================== */

  const savePack =
    async () => {
      const cleanedRequirements =
        requirements
          .map(item =>
            item.trim(),
          )
          .filter(Boolean);

      if (
        !canSave ||
        lookupLoading
      ) {
        return;
      }

      setLookupLoading(true);
      setLookupError(undefined);

      try {
        const payload:
          CustomPackPayload = {
          title:
            packName.trim(),

          description:
            purpose.trim() ||
            'Custom pack',

          requirements:
            cleanedRequirements,

          searchMetadata,

          source,

          verificationSources,

          verificationStatus:
            verificationSources.length
              ? verificationStatus
              : verificationStatus ===
                  'unverified_guidance'
                ? 'unverified_guidance'
                : 'user_created',
        };

        const pack =
          await onSaveCustomPack(
            payload,
          );

        close(() =>
          onPackSaved(pack),
        );
      } catch (error) {
        setLookupError(
          errorMessage(
            error,
            'Unable to create custom pack.',
          ),
        );
      } finally {
        setLookupLoading(
          false,
        );
      }
    };


  /* ==========================================================================
     LOOKUP SCREEN
  ========================================================================== */

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() =>
        close()
      }
      statusBarTranslucent
    >
      <View
        style={styles.modalRoot}
      >

        {/* BACKDROP */}
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.backdrop,
            {
              opacity:
                backdropOpacity,
            },
          ]}
        >
          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={() =>
              close()
            }
          />
        </Animated.View>


        <KeyboardAvoidingView
          style={[
            styles.keyboardContainer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          pointerEvents="box-none"
        >

          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor:
                  theme.colors
                    .background,

                borderColor:
                  theme.colors
                    .border,

                transform: [
                  {
                    translateY,
                  },
                ],
              },
            ]}
          >

            {/* HANDLE */}
            <View
              style={[
                styles.handle,
                {
                  backgroundColor:
                    theme.colors
                      .border,
                },
              ]}
            />


            {/* HEADER */}
            <View
              style={styles.header}
            >
              <AppText
                variant="title"
                style={
                  styles.title
                }
              >
                Create a custom pack
              </AppText>

              <Pressable
                onPress={() =>
                  close()
                }
                style={[
                  styles.closeButton,
                  {
                    backgroundColor:
                      theme.colors
                        .surfaceElevated,

                    borderColor:
                      theme.colors
                        .border,
                  },
                ]}
              >
                <X
                  size={25}
                  color={
                    theme.colors
                      .textPrimary
                  }
                  strokeWidth={2}
                />
              </Pressable>
            </View>


            {step === 'lookup' ? (
              <LookupStep
                theme={theme}
                purpose={purpose}
                setPurpose={
                  setPurpose
                }
                onLookup={
                  lookupPack
                }
                loading={
                  lookupLoading
                }
                error={
                  lookupError
                }
              />
            ) : (
              <ResultStep
                theme={theme}
                packName={packName}
                setPackName={
                  setPackName
                }
                requirements={
                  requirements
                }
                updateRequirement={
                  updateRequirement
                }
                addRequirement={
                  addRequirement
                }
                removeRequirement={
                  removeRequirement
                }
                documentLabels={
                  documentLabels
                }
                error={
                  lookupError
                }
                canSave={
                  canSave
                }
                saving={
                  lookupLoading
                }
                onSave={
                  savePack
                }
                generationJob={
                  generationJob
                }
                verificationSources={
                  verificationSources
                }
                disclaimer={
                  disclaimer
                }
                source={
                  source
                }
              />
            )}

          </Animated.View>

        </KeyboardAvoidingView>

      </View>
    </Modal>
  );
}


/* ============================================================================
   LOOKUP STEP
============================================================================ */

function LookupStep({
  theme,
  purpose,
  setPurpose,
  onLookup,
  loading,
  error,
}: {
  theme: ReturnType<
    typeof useAppTheme
  >['theme'];

  purpose: string;

  setPurpose: (
    value: string,
  ) => void;

  onLookup: () => void;

  loading: boolean;

  error?: string;
}) {
  return (
    <ScrollView
      style={styles.lookupScroll}
      contentContainerStyle={styles.lookupScrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
    <Stack
      gap="md"
      style={styles.content}
    >

      <AppText
        variant="body"
        color="secondary"
        style={styles.intro}
      >
        For situations the catalog
        does not cover.
      </AppText>


      <AppText
        variant="label"
        color="secondary"
        style={styles.fieldLabel}
      >
        WHAT DO YOU NEED DOCUMENTS FOR?
      </AppText>


      <TextInput
        value={purpose}
        onChangeText={
          setPurpose
        }
        placeholder="My son's school admission"
        placeholderTextColor={
          theme.colors
            .textSecondary
        }
        multiline
        textAlignVertical="top"
        style={[
          styles.textArea,
          {
            backgroundColor:
              theme.colors
                .surfaceElevated,

            borderColor:
              theme.colors
                .border,

            color:
              theme.colors
                .textPrimary,
          },
        ]}
      />


      <Pressable
        onPress={
          onLookup
        }
        disabled={
          !purpose.trim() ||
          loading
        }
        style={[
          styles.primaryButton,
          {
            backgroundColor:
              theme.colors.primary,
          },

          (!purpose.trim() ||
            loading) &&
            styles.disabledButton,
        ]}
      >
        <AppText
          variant="label"
          color="onPrimary"
          style={
            styles.primaryButtonText
          }
        >
          {loading
            ? 'Searching official sources…'
            : 'Look it up for me'}
        </AppText>
      </Pressable>


      {error ? (
        <AppText
          variant="caption"
          color="danger"
        >
          {error}
        </AppText>
      ) : null}

    </Stack>
    </ScrollView>
  );
}


/* ============================================================================
   RESULT STEP
============================================================================ */

function ResultStep({
  theme,
  packName,
  setPackName,
  requirements,
  updateRequirement,
  addRequirement,
  removeRequirement,
  documentLabels,
  error,
  canSave,
  saving,
  onSave,
  generationJob,
  verificationSources,
  disclaimer,
  source,
}: {
  theme: ReturnType<
    typeof useAppTheme
  >['theme'];

  packName: string;

  setPackName: (
    value: string,
  ) => void;

  requirements: string[];

  updateRequirement: (
    index: number,
    value: string,
  ) => void;

  addRequirement: () => void;

  removeRequirement: (
    index: number,
  ) => void;

  documentLabels: string[];

  error?: string;

  canSave: boolean;

  saving: boolean;

  onSave: () => void;

  generationJob?: CustomPackageGenerationJob;

  verificationSources: VerificationSource[];

  disclaimer: string;

  source?: CustomPackPayload['source'];
}) {

  /*
   * Calculate archive matches.
   */
  const archiveMatches =
    requirements.filter(
      requirement =>
        requirementExistsInArchive(
          requirement,
          documentLabels,
        ),
    ).length;

  const totalRequirements =
    requirements.filter(
      requirement =>
        requirement.trim()
          .length > 0,
    ).length;

  /*
   * API can provide confidence.
   */
  const confidence =
    generationJob?.confidence ??
    'low';

  /*
   * Last checked date.
   */
  const lastChecked =
    source?.lastCheckedAt;

  const checkedDate =
    lastChecked
      ? new Date(
          lastChecked,
        ).toISOString()
          .slice(0, 10)
      : new Date()
          .toISOString()
          .slice(0, 10);

  const isVerified =
    Boolean(
      generationJob
        ?.hasVerifiedOfficialSource,
    );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={
        false
      }
      contentContainerStyle={
        styles.resultContent
      }
    >

      {/* ==========================================================
          PACK NAME
      ========================================================== */}

      <AppText
        variant="label"
        color="secondary"
        style={styles.fieldLabel}
      >
        PACK NAME
      </AppText>


      <TextInput
        value={packName}
        onChangeText={
          setPackName
        }
        placeholder="Name this pack"
        placeholderTextColor={
          theme.colors
            .textSecondary
        }
        style={[
          styles.input,
          {
            backgroundColor:
              theme.colors
                .surfaceElevated,

            borderColor:
              theme.colors
                .border,

            color:
              theme.colors
                .textPrimary,
          },
        ]}
      />


      {/* ==========================================================
          DOCUMENTS NEEDED
      ========================================================== */}

      <AppText
        variant="label"
        color="secondary"
        style={[
          styles.fieldLabel,
          styles.documentsLabel,
        ]}
      >
        DOCUMENTS NEEDED
      </AppText>


      <AppText
        variant="body"
        color="secondary"
        style={
          styles.description
        }
      >
        List what you were asked for.
        You can attach the actual
        documents once the pack is
        saved.
      </AppText>


      {/* ==========================================================
          VERIFICATION MESSAGE
      ========================================================== */}

      {/* ==========================================================
          REQUIREMENTS
      ========================================================== */}

      <Stack
        gap="sm"
        style={styles.requirements}
      >
        {requirements.map((requirement, index) => {
          const hasDocument = requirementExistsInArchive(
            requirement,
            documentLabels,
          );

          return (
            <Row
              key={`${requirement}-${index}`}
              align="center"
              gap="sm"
            >
              <TextInput
                value={requirement}
                onChangeText={value => updateRequirement(index, value)}
                placeholder="Document name"
                placeholderTextColor={theme.colors.textSecondary}
                style={[
                  styles.requirementInput,
                  hasDocument && styles.requirementMatched,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: hasDocument ? theme.colors.success : theme.colors.border,
                    color: theme.colors.textPrimary,
                  },
                ]}
              />
              {hasDocument ? (
                <Check size={20} color={theme.colors.success} strokeWidth={3} />
              ) : null}
              <Pressable
                onPress={() => removeRequirement(index)}
                style={[
                  styles.deleteButton,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Trash2 size={17} color={theme.colors.textPrimary} strokeWidth={2} />
              </Pressable>
            </Row>
          );
        })}
      </Stack>

      <Pressable
        onPress={addRequirement}
        style={[
          styles.addRequirementButton,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Plus size={17} color={theme.colors.textPrimary} strokeWidth={2} />
        <AppText variant="label" style={styles.addRequirementText}>
          Add requirement
        </AppText>
      </Pressable>

      <AppText
        style={[styles.archiveCount, { color: theme.colors.success }]}
      >
        {archiveMatches} of {totalRequirements} already in your archive.
      </AppText>

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor:
              theme.colors
                .surfaceElevated,

            borderColor:
              isVerified
                ? theme.colors
                    .success
                : theme.colors
                    .primary,
          },
        ]}
      >
        <AppText
          style={[
            styles.infoText,
            {
              color:
                isVerified
                  ? theme.colors
                      .success
                  : theme.colors
                      .primary,
            },
          ]}
        >
          {isVerified
            ? 'Based on an official source. Review it and edit to match what you were asked for.'
            : 'A starting draft, not officially verified. Edit it to match what you were asked for.'}
        </AppText>
      </View>

      {verificationSources.length ? (
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.colors.surfaceElevated },
          ]}
        >
          <AppText variant="label">Official sources</AppText>
          {verificationSources.slice(0, 4).map(verificationSource => (
            <AppText key={verificationSource.url} variant="caption" color="secondary">
              {verificationSource.organization}: {verificationSource.title}
            </AppText>
          ))}
        </View>
      ) : null}


      {/* ==========================================================
          OFFLINE ESTIMATE
      ========================================================== */}

      <View
        style={[
          styles.estimateCard,
          {
            backgroundColor:
              theme.colors
                .background,

            borderColor:
              theme.colors
                .border,
          },
        ]}
      >

        <View
          style={
            styles.estimateHeader
          }
        >

          <AppText
            style={[
              styles.estimateTitle,
              {
                color:
                  theme.colors
                    .danger,
              },
            ]}
          >
            {isVerified
              ? 'Official estimate'
              : 'Offline estimate'}
          </AppText>


          <AppText
            style={
              styles.estimateMeta
            }
          >
            · confidence:{' '}
            {String(
              confidence,
            )}
          </AppText>


          <AppText
            style={
              styles.estimateMeta
            }
          >
            · checked{' '}
            {checkedDate}
          </AppText>

        </View>


        <AppText
          style={
            styles.estimateDescription
          }
          color="secondary"
        >
          {disclaimer ||
            'Offline estimate. Connect to get the current official list.'}
        </AppText>

      </View>


      {/* ==========================================================
          ERROR
      ========================================================== */}

      {error ? (
        <AppText
          variant="caption"
          color="danger"
          style={
            styles.errorText
          }
        >
          {error}
        </AppText>
      ) : null}


      {/* ==========================================================
          SAVE
      ========================================================== */}

      <Pressable
        onPress={
          onSave
        }
        disabled={
          !canSave ||
          saving
        }
        style={[
          styles.saveButton,
          {
            backgroundColor:
              theme.colors
                .primary,
          },

          (!canSave ||
            saving) &&
            styles.disabledButton,
        ]}
      >
        <AppText
          variant="label"
          color="onPrimary"
          style={
            styles.saveButtonText
          }
        >
          {saving
            ? 'Saving…'
            : 'Save pack'}
        </AppText>
      </Pressable>

    </ScrollView>
  );
}


/* ============================================================================
   STYLES
============================================================================ */

const styles =
  StyleSheet.create({

    /* ------------------------------------------------------------
       ROOT
    ------------------------------------------------------------ */

    modalRoot: {
      flex: 1,
      justifyContent:
        'flex-end',
    },

    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor:
        'rgba(0,0,0,0.58)',
    },

    keyboardContainer: {
      width: '100%',
      justifyContent:
        'flex-end',
    },

    sheet: {
      width: '100%',
      maxHeight: '90%',

      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,

      borderWidth: 1,

      paddingTop: 8,
      paddingHorizontal: 12,
      paddingBottom: 12,
    },


    /* ------------------------------------------------------------
       HANDLE
    ------------------------------------------------------------ */

    handle: {
      alignSelf:
        'center',

      width: 42,
      height: 4,

      borderRadius: 3,

      marginBottom: 12,
    },


    /* ------------------------------------------------------------
       HEADER
    ------------------------------------------------------------ */

    header: {
      minHeight: 44,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 12,

      marginBottom: 4,
    },

    title: {
      flex: 1,

      fontSize: 20,
      lineHeight: 28,

      fontWeight:
        '700',
    },

    closeButton: {
      width: 44,
      height: 44,

      borderRadius: 12,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    /* ------------------------------------------------------------
       LOOKUP
    ------------------------------------------------------------ */

    content: {
      paddingTop: 8,
      paddingBottom: 12,
    },

    lookupScroll: {
      flexShrink: 1,
    },

    lookupScrollContent: {
      flexGrow: 1,
    },

    intro: {
      fontSize: 15,
      lineHeight: 22,
    },

    fieldLabel: {
      marginTop: 12,

      fontSize: 17,
      lineHeight: 22,

      fontWeight:
        '700',

      letterSpacing:
        0,
    },

    textArea: {
      minHeight: 104,

      borderRadius: 12,
      borderWidth: 1,

      paddingHorizontal: 12,
      paddingVertical: 12,

      fontSize: 15,
      lineHeight: 22,
    },

    primaryButton: {
      height: 50,

      borderRadius: 12,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 4,
    },

    primaryButtonText: {
      fontSize: 15,
      lineHeight: 22,
    },

    disabledButton: {
      opacity: 0.45,
    },


    /* ------------------------------------------------------------
       RESULT CONTENT
    ------------------------------------------------------------ */

    resultContent: {
      paddingTop: 4,
      paddingBottom: 12,
    },

    input: {
      height: 52,

      borderRadius: 11,
      borderWidth: 1,

      paddingHorizontal: 12,
      paddingVertical: 12,

      fontSize: 15,
      lineHeight: 22,
    },

    documentsLabel: {
      marginTop: 12,
    },

    description: {
      marginTop: 4,

      fontSize: 13,
      lineHeight: 20,
    },


    /* ------------------------------------------------------------
       INFO CARD
    ------------------------------------------------------------ */

    infoCard: {
      marginTop: 12,

      minHeight: 0,

      borderRadius: 12,

      borderWidth: 1,

      paddingHorizontal: 12,
      paddingVertical: 12,

      justifyContent:
        'center',
    },

    infoText: {
      fontSize: 13,
      lineHeight: 20,

      fontWeight:
        '500',
    },


    /* ------------------------------------------------------------
       REQUIREMENTS
    ------------------------------------------------------------ */

    requirements: {
      marginTop: 12,
    },

    requirementInput: {
      flex: 1,

      minWidth: 0,

      height: 50,

      borderRadius: 11,

      borderWidth: 1,

      paddingHorizontal: 12,

      fontSize: 15,
      lineHeight: 22,

      fontWeight:
        '500',
    },

    requirementMatched: {
      borderWidth: 1.5,
    },

    deleteButton: {
      width: 42,
      height: 38,

      borderRadius: 10,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    /* ------------------------------------------------------------
       ADD REQUIREMENT
    ------------------------------------------------------------ */

    addRequirementButton: {
      alignSelf:
        'flex-start',

      height: 42,

      borderRadius: 10,

      borderWidth: 1,

      paddingHorizontal: 12,

      marginTop: 8,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,
    },

    addRequirementText: {
      fontSize: 13,
      lineHeight: 20,
    },


    /* ------------------------------------------------------------
       ARCHIVE COUNT
    ------------------------------------------------------------ */

    archiveCount: {
      marginTop: 12,

      fontSize: 13,
      lineHeight: 20,

      fontWeight:
        '500',
    },


    /* ------------------------------------------------------------
       ESTIMATE
    ------------------------------------------------------------ */

    estimateCard: {
      marginTop: 12,

      borderRadius: 12,

      borderWidth: 1,

      paddingHorizontal: 12,
      paddingVertical: 12,
    },

    estimateHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      flexWrap:
        'wrap',

      columnGap: 12,
      rowGap: 2,
    },

    estimateTitle: {
      fontSize: 13,
      lineHeight: 20,

      fontWeight:
        '700',
    },

    estimateMeta: {
      fontSize: 12,
      lineHeight: 18,

      color: '#93A0B8',
    },

    estimateDescription: {
      marginTop: 8,

      fontSize: 13,
      lineHeight: 18,
    },


    /* ------------------------------------------------------------
       ERROR
    ------------------------------------------------------------ */

    errorText: {
      marginTop: 12,

      fontSize: 13,
      lineHeight: 20,
    },


    /* ------------------------------------------------------------
       SAVE
    ------------------------------------------------------------ */

    saveButton: {
      height: 50,

      borderRadius: 12,

      marginTop: 12,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    saveButtonText: {
      fontSize: 15,
      lineHeight: 22,

      fontWeight:
        '700',
    },

  });'='