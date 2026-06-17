import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { formatCaptureMode, formatLeadLabel } from '@/lib/format';
import type {
  CaptureMode,
  EventSessionRecord,
  LeadQualifier,
} from '@/lib/types';

export interface ContactFormValues {
  fullName: string;
  company: string;
  title: string;
  emailsText: string;
  phonesText: string;
  website: string;
  linkedinUrl: string;
  leadNote: string;
  followUpDate: string;
  notes: string;
  captureMode: CaptureMode;
  eventSessionId?: string;
  leadQualifier?: LeadQualifier;
}

interface ContactFormProps {
  initialValues: ContactFormValues;
  sessions: EventSessionRecord[];
  isSubmitting?: boolean;
  submitLabel: string;
  onSubmit: (payload: {
    fullName: string;
    company?: string;
    title?: string;
    emails?: string[];
    phones?: string[];
    website?: string;
    linkedinUrl?: string;
    leadNote?: string;
    followUpDate?: string;
    notes?: string;
    captureMode?: CaptureMode;
    eventSessionId?: string;
    leadQualifier?: LeadQualifier;
  }) => void;
}

const LEAD_OPTIONS: (LeadQualifier | 'unqualified')[] = [
  'unqualified',
  'hot',
  'warm',
  'cold',
];
const CAPTURE_OPTIONS: CaptureMode[] = [
  'visitor',
  'exhibitor',
  'quick_capture',
  'legacy',
];

export function ContactForm({
  initialValues,
  sessions,
  isSubmitting,
  submitLabel,
  onSubmit,
}: ContactFormProps) {
  const colors = useThemeColors();
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [company, setCompany] = useState(initialValues.company);
  const [title, setTitle] = useState(initialValues.title);
  const [emailsText, setEmailsText] = useState(initialValues.emailsText);
  const [phonesText, setPhonesText] = useState(initialValues.phonesText);
  const [website, setWebsite] = useState(initialValues.website);
  const [linkedinUrl, setLinkedinUrl] = useState(initialValues.linkedinUrl);
  const [leadNote, setLeadNote] = useState(initialValues.leadNote);
  const [followUpDate, setFollowUpDate] = useState(initialValues.followUpDate);
  const [notes, setNotes] = useState(initialValues.notes);
  const [captureMode, setCaptureMode] = useState<CaptureMode>(
    initialValues.captureMode,
  );
  const [eventSessionId, setEventSessionId] = useState<string | undefined>(
    initialValues.eventSessionId,
  );
  const [leadQualifier, setLeadQualifier] = useState<LeadQualifier | undefined>(
    initialValues.leadQualifier,
  );

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === eventSessionId),
    [sessions, eventSessionId],
  );

  const submit = () => {
    const normalizedFullName = fullName.trim();
    if (!normalizedFullName) {
      return;
    }

    onSubmit({
      fullName: normalizedFullName,
      company: company.trim() || undefined,
      title: title.trim() || undefined,
      emails: parseList(emailsText),
      phones: parseList(phonesText),
      website: website.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      leadNote: leadNote.trim() || undefined,
      followUpDate: followUpDate.trim() || undefined,
      notes: notes.trim() || undefined,
      captureMode: selectedSession?.mode ?? captureMode,
      eventSessionId: selectedSession?.id,
      leadQualifier,
    });
  };

  return (
    <View style={styles.form}>
      <Text style={[styles.label, { color: colors.text }]}>Full name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Ashok Badjatiya"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Company</Text>
      <TextInput
        value={company}
        onChangeText={setCompany}
        placeholder="Company"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Managing Director"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Event</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[
            styles.chip,
            { borderColor: colors.border, backgroundColor: colors.inputBg },
            !eventSessionId && styles.chipActive,
          ]}
          onPress={() => setEventSessionId(undefined)}
        >
          <Text
            style={[
              styles.chipText,
              { color: colors.text },
              !eventSessionId && styles.chipTextActive,
            ]}
          >
            Standalone
          </Text>
        </Pressable>
        {sessions.map((session) => {
          const selected = session.id === eventSessionId;
          return (
            <Pressable
              key={session.id}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: colors.inputBg },
                selected && styles.chipActive,
              ]}
              onPress={() => {
                setEventSessionId(session.id);
                setCaptureMode(session.mode);
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.text },
                  selected && styles.chipTextActive,
                ]}
              >
                {session.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Category</Text>
      {selectedSession ? (
        <View
          style={[
            styles.readonlyCard,
            { backgroundColor: colors.inputBg, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.readonlyText, { color: colors.text }]}>
            {formatCaptureMode(selectedSession.mode)}
          </Text>
          <Text style={[styles.readonlyHint, { color: colors.muted }]}>
            Matched to the selected event
          </Text>
        </View>
      ) : (
        <View style={styles.chipRow}>
          {CAPTURE_OPTIONS.map((mode) => {
            const selected = mode === captureMode;
            return (
              <Pressable
                key={mode}
                style={[
                  styles.chip,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBg,
                  },
                  selected && styles.chipActive,
                ]}
                onPress={() => setCaptureMode(mode)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.text },
                    selected && styles.chipTextActive,
                  ]}
                >
                  {formatCaptureMode(mode)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Lead status</Text>
      <View style={styles.chipRow}>
        {LEAD_OPTIONS.map((option) => {
          const selected =
            (option === 'unqualified' ? undefined : option) === leadQualifier;
          return (
            <Pressable
              key={option}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: colors.inputBg },
                selected && styles.chipActive,
              ]}
              onPress={() =>
                setLeadQualifier(option === 'unqualified' ? undefined : option)
              }
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.text },
                  selected && styles.chipTextActive,
                ]}
              >
                {option === 'unqualified'
                  ? 'Unqualified'
                  : formatLeadLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Emails</Text>
      <TextInput
        value={emailsText}
        onChangeText={setEmailsText}
        placeholder="name@company.com, alt@company.com"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          styles.multiline,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        multiline
      />

      <Text style={[styles.label, { color: colors.text }]}>Phones</Text>
      <TextInput
        value={phonesText}
        onChangeText={setPhonesText}
        placeholder="+91 9999999999, +91 8888888888"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          styles.multiline,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        multiline
      />

      <Text style={[styles.label, { color: colors.text }]}>Website</Text>
      <TextInput
        value={website}
        onChangeText={setWebsite}
        placeholder="https://company.com"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>LinkedIn</Text>
      <TextInput
        value={linkedinUrl}
        onChangeText={setLinkedinUrl}
        placeholder="https://linkedin.com/in/name"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Follow-up date</Text>
      <TextInput
        value={followUpDate}
        onChangeText={setFollowUpDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>Lead note</Text>
      <TextInput
        value={leadNote}
        onChangeText={setLeadNote}
        placeholder="Follow-up context or next step"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          styles.notes,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        multiline
      />

      <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes about the lead"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          styles.notes,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        multiline
      />

      <Pressable
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={submit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function parseList(value: string): string[] | undefined {
  const items = value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

const styles = StyleSheet.create({
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  notes: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  readonlyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  readonlyText: { fontSize: 16, fontWeight: '600' },
  readonlyHint: { marginTop: 4, fontSize: 12 },
  submitButton: {
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});
