import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';

export class DomainHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: string,
    message: string,
  ) {
    super({ code, message }, status);
  }
}

export class SessionClosedException extends DomainHttpException {
  constructor(message = 'Event session is closed') {
    super(HttpStatus.CONFLICT, 'SESSION_CLOSED', message);
  }
}

export class OcrConfidenceTooLowException extends DomainHttpException {
  constructor(message = 'OCR confidence below review threshold') {
    super(HttpStatus.UNPROCESSABLE_ENTITY, 'OCR_CONFIDENCE_TOO_LOW', message);
  }
}

export class DuplicateContactDetectedException extends ConflictException {
  constructor(message = 'Duplicate contact detected') {
    super({ code: 'DUPLICATE_CONTACT_DETECTED', message });
  }
}

export class DuplicateEventSessionDetectedException extends ConflictException {
  constructor(message = 'Duplicate event detected') {
    super({ code: 'DUPLICATE_EVENT_SESSION_DETECTED', message });
  }
}

export class RelationshipMatchFoundException extends DomainHttpException {
  constructor(message = 'Relationship match requires user decision') {
    super(HttpStatus.CONFLICT, 'RELATIONSHIP_MATCH_FOUND', message);
  }
}

export class OrganizationQuotaExceededException extends DomainHttpException {
  constructor(message = 'Organization quota exceeded') {
    super(HttpStatus.FORBIDDEN, 'ORG_QUOTA_EXCEEDED', message);
  }
}
