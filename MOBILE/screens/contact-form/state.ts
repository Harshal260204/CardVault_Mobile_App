import type { CaptureMode, LeadQualifier } from '@/lib/types';

import type { ContactTag } from './constants';

export type ContactFormField =
  | 'fullName'
  | 'title'
  | 'company'
  | 'email'
  | 'phone'
  | 'website'
  | 'linkedinUrl'
  | 'notes';

export interface ContactWizardState {
  fullName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  linkedinUrl: string;
  notes: string;
  tags: ContactTag[];
  leadQualifier: LeadQualifier | '';
  eventSessionId?: string;
  captureMode: CaptureMode;
  showSessionPicker: boolean;
}

export type ContactFieldErrors = Partial<Record<ContactFormField, string>>;

export const initialContactWizardState = (
  overrides?: Partial<ContactWizardState>,
): ContactWizardState => ({
  fullName: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  linkedinUrl: '',
  notes: '',
  tags: [],
  leadQualifier: 'warm',
  eventSessionId: undefined,
  captureMode: 'legacy',
  showSessionPicker: false,
  ...overrides,
});

export type ContactWizardAction =
  | { type: 'SET_FIELD'; field: ContactFormField; value: string }
  | { type: 'SET_LEAD'; value: LeadQualifier | '' }
  | { type: 'TOGGLE_TAG'; tag: ContactTag }
  | { type: 'SET_SESSION'; sessionId?: string; captureMode?: CaptureMode }
  | { type: 'SET_SHOW_SESSION_PICKER'; value: boolean }
  | { type: 'RESET'; payload: ContactWizardState };

export function contactWizardReducer(
  state: ContactWizardState,
  action: ContactWizardAction,
): ContactWizardState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_LEAD':
      return { ...state, leadQualifier: action.value };
    case 'TOGGLE_TAG':
      return {
        ...state,
        tags: state.tags.includes(action.tag)
          ? state.tags.filter((tag) => tag !== action.tag)
          : [...state.tags, action.tag],
      };
    case 'SET_SESSION':
      return {
        ...state,
        eventSessionId: action.sessionId,
        captureMode: action.captureMode ?? state.captureMode,
        showSessionPicker: false,
      };
    case 'SET_SHOW_SESSION_PICKER':
      return { ...state, showSessionPicker: action.value };
    case 'RESET':
      return action.payload;
    default:
      return state;
  }
}

export function validateStepFields(
  step: number,
  state: ContactWizardState,
): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  if (step === 0) {
    if (!state.fullName.trim()) {
      errors.fullName = 'Name is required.';
    }
    if (!state.title.trim()) {
      errors.title = 'Title is required.';
    }
    if (!state.company.trim()) {
      errors.company = 'Company is required.';
    }
  }

  return errors;
}

export function validateSingleField(
  field: ContactFormField,
  state: ContactWizardState,
): string | undefined {
  if (field === 'fullName' && !state.fullName.trim()) {
    return 'Name is required.';
  }
  if (field === 'title' && !state.title.trim()) {
    return 'Title is required.';
  }
  if (field === 'company' && !state.company.trim()) {
    return 'Company is required.';
  }
  return undefined;
}

export const STEP_FIELDS: Record<number, ContactFormField[]> = {
  0: ['fullName', 'title', 'company'],
  1: ['email', 'phone', 'website', 'linkedinUrl'],
  2: [],
  3: ['notes'],
};
