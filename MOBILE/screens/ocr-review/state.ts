import type { LeadQualifier, OcrRelationshipMatch } from '@/lib/types';
import type { OcrReviewFormValues } from '@/lib/ocr-form-mapper';

import type { LeadTag } from './constants';

export type OcrReviewStringField =
  | 'fullName'
  | 'company'
  | 'title'
  | 'email'
  | 'phone'
  | 'website'
  | 'address'
  | 'notes'
  | 'leadNotes';

export interface OcrReviewState {
  fullName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  notes: string;
  leadQualifier: LeadQualifier | '';
  tags: LeadTag[];
  leadNotes: string;
  linkToContactId?: string;
  duplicateDismissed: boolean;
  confirmedFields: Record<string, boolean>;
}

export const initialOcrReviewState: OcrReviewState = {
  fullName: '',
  company: '',
  title: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  notes: '',
  leadQualifier: 'warm',
  tags: [],
  leadNotes: '',
  duplicateDismissed: false,
  confirmedFields: {},
};

export type OcrReviewAction =
  | { type: 'HYDRATE'; payload: Partial<OcrReviewFormValues> }
  | { type: 'SET_FIELD'; field: OcrReviewStringField; value: string }
  | { type: 'SET_LEAD'; value: LeadQualifier | '' }
  | { type: 'TOGGLE_TAG'; tag: LeadTag }
  | { type: 'MERGE_DUPLICATE'; contactId: string }
  | { type: 'KEEP_BOTH' }
  | { type: 'CONFIRM_FIELD'; field: string };

export function ocrReviewReducer(
  state: OcrReviewState,
  action: OcrReviewAction,
): OcrReviewState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        fullName: action.payload.fullName ?? state.fullName,
        company: action.payload.company ?? state.company,
        title: action.payload.title ?? state.title,
        email: action.payload.email ?? state.email,
        phone: action.payload.phone ?? state.phone,
        website: action.payload.website ?? state.website,
      };
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        confirmedFields: {
          ...state.confirmedFields,
          [action.field]: true,
        },
      };
    case 'SET_LEAD':
      return { ...state, leadQualifier: action.value };
    case 'TOGGLE_TAG':
      return {
        ...state,
        tags: state.tags.includes(action.tag)
          ? state.tags.filter((tag) => tag !== action.tag)
          : [...state.tags, action.tag],
      };
    case 'MERGE_DUPLICATE':
      return {
        ...state,
        linkToContactId: action.contactId,
        duplicateDismissed: false,
      };
    case 'KEEP_BOTH':
      return {
        ...state,
        linkToContactId: undefined,
        duplicateDismissed: true,
      };
    case 'CONFIRM_FIELD':
      return {
        ...state,
        confirmedFields: {
          ...state.confirmedFields,
          [action.field]: true,
        },
      };
    default:
      return state;
  }
}

export function getFieldConfidence(
  scores: Record<string, number>,
  field: string,
): number | undefined {
  if (scores[field] != null) {
    return scores[field];
  }
  if (field === 'email' && scores.emails != null) {
    return scores.emails;
  }
  if (field === 'phone' && scores.phones != null) {
    return scores.phones;
  }
  return undefined;
}

export function isLowConfidence(
  scores: Record<string, number>,
  field: string,
  confirmedFields: Record<string, boolean>,
): boolean {
  if (confirmedFields[field]) {
    return false;
  }
  const confidence = getFieldConfidence(scores, field);
  return confidence != null && confidence < 0.75;
}

export interface DuplicateMatchProps {
  match: OcrRelationshipMatch;
}
