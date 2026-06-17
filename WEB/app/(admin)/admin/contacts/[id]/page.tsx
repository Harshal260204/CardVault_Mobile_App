'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { LeadBadge } from '@/components/shared/lead-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useContact, useUpdateContact } from '@/hooks/use-contacts';
import { api } from '@/lib/api';
import { mergeContacts } from '@/lib/api-client';
import { formatCaptureMode, formatDateTime } from '@/lib/format';

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const contactId = params.id;
  const { data: contact, isLoading, error } = useContact(contactId);
  const updateContact = useUpdateContact(contactId);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    setMergeError(null);
    setMergeSuccess(null);
    if (!mergeSourceId.trim()) {
      setMergeError('Enter the source contact ID to merge into this record.');
      return;
    }
    setIsMerging(true);
    try {
      await mergeContacts(api, contactId, mergeSourceId.trim());
      setMergeSuccess('Contacts merged successfully.');
      setMergeSourceId('');
    } catch (e) {
      setMergeError(e instanceof Error ? e.message : 'Merge failed.');
    } finally {
      setIsMerging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="space-y-5 py-8">
        <EmptyState
          icon={AlertTriangle}
          title="Contact not found"
          description="This contact may have been deleted or you may not have access."
          actionLabel="Back to contacts"
          onAction={() => {
            window.location.href = '/admin/contacts';
          }}
        />
        <div className="text-center">
          <Link href="/admin/contacts" className="text-sm text-brand-600 hover:underline">
            Back to contacts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={contact.fullName}
        description={contact.company ?? 'Contact detail'}
        action={
          <div className="flex gap-2">
            <Link href="/admin/contacts">
              <Button variant="ghost">Back</Button>
            </Link>
            <Link href={`/admin/contacts/${contact.id}/edit`}>
              <Button>Edit</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">
                {formatCaptureMode(contact.captureMode)}
              </Badge>
              <LeadBadge qualifier={contact.leadQualifier} />
              {contact.encounterType ? (
                <Badge variant="default">{contact.encounterType}</Badge>
              ) : null}
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-tertiary">Company</dt>
                <dd className="font-medium text-text-primary">
                  {contact.company ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Title</dt>
                <dd className="font-medium text-text-primary">
                  {contact.title ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Emails</dt>
                <dd className="font-medium text-text-primary">
                  {contact.emails.length ? contact.emails.join(', ') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Phones</dt>
                <dd className="font-medium text-text-primary">
                  {contact.phones.length ? contact.phones.join(', ') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Website</dt>
                <dd className="font-medium text-text-primary">
                  {contact.website ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Notes</dt>
                <dd className="font-medium text-text-primary">
                  {contact.notes ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Created</dt>
                <dd className="font-medium text-text-primary">
                  {formatDateTime(contact.createdAt)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              Merge duplicate
            </h2>
            <p className="text-sm text-text-secondary">
              Merge another contact into this record. The source contact will be
              absorbed and this contact will remain.
            </p>
            {mergeError ? (
              <p className="rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
                {mergeError}
              </p>
            ) : null}
            {mergeSuccess ? (
              <p className="rounded-md border border-success-border bg-success-bg px-3 py-2 text-sm text-success-text">
                {mergeSuccess}
              </p>
            ) : null}
            <Input
              placeholder="Source contact UUID"
              value={mergeSourceId}
              onChange={(e) => setMergeSourceId(e.target.value)}
            />
            <Button
              onClick={handleMerge}
              loading={isMerging}
              disabled={updateContact.isPending}
            >
              Merge into this contact
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
