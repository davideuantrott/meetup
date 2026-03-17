import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { useMeetup } from '../hooks/useMeetup';
import { SlotCard } from '../components/meetup/SlotCard';
import { ReactionsBar } from '../components/meetup/ReactionsBar';
import { ConfirmedView } from '../components/meetup/ConfirmedView';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { getMeetupCommentary } from '../utils/commentary';
import { getBestSlot } from '../utils/slots';
import type { Availability, ProposedSlot } from '../types';
import { formatSlotDate } from '../utils/slots';

export function MeetupView() {
  const { id: meetupId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { members } = useGroup(profile?.id);
  const { meetup, reactions, loading, respond, addReaction, confirmMeetup, cancelMeetup, addSlot, removeSlot } = useMeetup(meetupId);

  const [showSharePrompt, setShowSharePrompt] = useState(isNew);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState<ProposedSlot | null>(null);
  const [confirmingSlotId, setConfirmingSlotId] = useState<string | null>(null);
  const [commentary, setCommentary] = useState('');

  useEffect(() => {
    if (meetup && members.length > 0) {
      const allResponses = (meetup.slots ?? []).flatMap(s => s.responses ?? []);
      setCommentary(getMeetupCommentary(members, allResponses));
    }
  }, [meetup, members]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  if (!meetup || !profile) return null;

  const isCreator = meetup.created_by === profile.id;
  const isOpen = meetup.status === 'open';
  const isConfirmed = meetup.status === 'confirmed';
  const slots = meetup.slots ?? [];
  const bestSlot = getBestSlot(slots, members);
  const allResponses = slots.flatMap(s => s.responses ?? []);

  async function handleRespond(slotId: string, availability: Availability) {
    if (!profile) return;

    // Optimistic commentary update
    const slot = slots.find(s => s.id === slotId);
    const oldResponse = slot?.responses?.find(r => r.user_id === profile.id);
    const newCommentary = getMeetupCommentary(
      members,
      allResponses,
      { user: profile, oldAvailability: oldResponse?.availability, newAvailability: availability }
    );
    setCommentary(newCommentary);

    await respond(slotId, profile.id, availability);
  }

  async function handleConfirm() {
    if (!confirmingSlotId || !meetupId) return;
    await confirmMeetup(meetupId, confirmingSlotId);
    setShowConfirmModal(false);
  }

  async function handleCancel() {
    if (!meetupId) return;
    await cancelMeetup(meetupId);
    setShowCancelModal(false);
    navigate('/');
  }

  async function handleRemoveSlot(slot: ProposedSlot) {
    await removeSlot(slot.id, meetup!.id);
    setShowRemoveModal(null);
  }

  function handleShare() {
    const url = `${window.location.origin}/meetup/${meetupId}`;
    const title = meetup?.title ?? 'Meetup';
    const text = `${title} — pick your dates on Swimming Pals Planner`;
    if (navigator.share) {
      navigator.share({ title, text, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  if (isConfirmed && meetup.confirmed_details) {
    return (
      <ConfirmedView
        meetup={meetup}
        members={members}
        currentUser={profile}
        isCreator={isCreator}
        onCancel={() => setShowCancelModal(true)}
        onShare={handleShare}
      >
        <Modal
          open={showCancelModal}
          title="Cancel this meetup?"
          onClose={() => setShowCancelModal(false)}
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowCancelModal(false)}>Keep it</Button>
              <Button variant="danger" size="sm" onClick={handleCancel}>Cancel meetup</Button>
            </>
          }
        >
          <p className="text-sm text-gray-600">Everyone will be notified. This can't be undone.</p>
        </Modal>
      </ConfirmedView>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Back to home"
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{meetup.title}</h1>
            {meetup.location && (
              <p className="text-xs text-gray-400 truncate">{meetup.location}</p>
            )}
          </div>
          <button
            onClick={handleShare}
            aria-label="Share meetup"
            className="p-2 rounded-xl hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 flex flex-col gap-5">
        {/* Commentary */}
        <div
          className="bg-white rounded-2xl border border-gray-200 p-4"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-sm text-gray-600 italic">{commentary || 'Waiting for responses.'}</p>
        </div>

        {/* Avatar row */}
        <div
          className="flex gap-3 flex-wrap"
          aria-label="Group members and their response status"
        >
          {members.map(m => {
            if (!m.user) return null;
            const userResponses = allResponses.filter(r => r.user_id === m.user_id);
            const hasAnyYes = userResponses.some(r => r.availability === 'yes');
            const hasAnyMaybe = userResponses.some(r => r.availability === 'maybe');
            const hasAnyNo = userResponses.every(r => r.availability === 'no') && userResponses.length > 0;
            const hasResponded = userResponses.length > 0;
            const avail = hasAnyYes ? 'yes' : hasAnyMaybe ? 'maybe' : hasAnyNo ? 'no' : undefined;

            return (
              <div key={m.user_id} className="flex flex-col items-center gap-0.5">
                <Avatar
                  user={m.user}
                  availability={avail}
                  hasNotResponded={!hasResponded}
                  size="md"
                />
                <span className="text-xs text-gray-400">{m.user.name.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>

        {/* Date carousel */}
        <section aria-labelledby="dates-heading">
          <h2 id="dates-heading" className="sr-only">Date options</h2>
          <div
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
            role="list"
            style={{ scrollbarWidth: 'none' }}
          >
            {slots
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(slot => (
                <div key={slot.id} role="listitem" className="relative">
                  <SlotCard
                    slot={slot}
                    members={members}
                    currentUser={profile}
                    isBest={bestSlot?.id === slot.id}
                    onRespond={avail => handleRespond(slot.id, avail)}
                    disabled={!isOpen}
                  />
                  {isCreator && isOpen && (
                    <button
                      type="button"
                      aria-label={`Remove ${formatSlotDate(slot)}`}
                      onClick={() => setShowRemoveModal(slot)}
                      className="absolute top-2 right-2 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* Creator controls */}
        {isCreator && isOpen && (
          <section className="flex flex-col gap-3" aria-label="Meetup controls">
            {bestSlot && (
              <Button
                onClick={() => { setConfirmingSlotId(bestSlot.id); setShowConfirmModal(true); }}
                size="lg"
                className="w-full"
              >
                Confirm {formatSlotDate(bestSlot)}
              </Button>
            )}
            <div className="flex gap-2">
              {slots.length < 5 && (
                <AddSlotButton meetupId={meetup.id} onAdd={addSlot} />
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="flex-1"
              >
                Cancel meetup
              </Button>
            </div>
            {!bestSlot && slots.length > 0 && (
              <p className="text-sm text-gray-500 text-center italic">
                No clear winner. You might need more options.
              </p>
            )}
          </section>
        )}

        {/* Reactions */}
        <ReactionsBar
          reactions={reactions}
          currentUser={profile}
          onReact={content => addReaction(meetup.id, profile.id, content)}
          disabled={!isOpen}
        />
      </main>

      {/* Share prompt */}
      {showSharePrompt && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4"
          role="status"
          aria-live="polite"
        >
          <div className="bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
            <p className="text-sm">Share to WhatsApp so people actually respond.</p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="text-sm font-semibold text-indigo-300 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
              >
                Share
              </button>
              <button
                onClick={() => setShowSharePrompt(false)}
                aria-label="Dismiss"
                className="text-sm text-gray-400 hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <Modal
        open={showConfirmModal}
        title="Confirm this date?"
        onClose={() => setShowConfirmModal(false)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmModal(false)}>Go back</Button>
            <Button size="sm" onClick={handleConfirm}>Confirm</Button>
          </>
        }
      >
        {confirmingSlotId && (() => {
          const slot = slots.find(s => s.id === confirmingSlotId);
          return slot ? (
            <p className="text-sm text-gray-600">
              Confirm <strong>{formatSlotDate(slot)}</strong>? Everyone will be notified.
            </p>
          ) : null;
        })()}
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={showCancelModal}
        title="Cancel this meetup?"
        onClose={() => setShowCancelModal(false)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowCancelModal(false)}>Keep it</Button>
            <Button variant="danger" size="sm" onClick={handleCancel}>Cancel meetup</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Everyone will be notified. This can't be undone.</p>
      </Modal>

      {/* Remove slot modal */}
      {showRemoveModal && (
        <Modal
          open={!!showRemoveModal}
          title="Remove this date?"
          onClose={() => setShowRemoveModal(null)}
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowRemoveModal(null)}>Keep it</Button>
              <Button variant="danger" size="sm" onClick={() => handleRemoveSlot(showRemoveModal)}>Remove</Button>
            </>
          }
        >
          {(() => {
            const count = (showRemoveModal.responses ?? []).length;
            return (
              <p className="text-sm text-gray-600">
                {count > 0
                  ? `${count} ${count === 1 ? 'person has' : 'people have'} responded to this date. Remove anyway?`
                  : `Remove ${formatSlotDate(showRemoveModal)}?`}
              </p>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}

function AddSlotButton({ meetupId, onAdd }: {
  meetupId: string;
  onAdd: (meetupId: string, slot: { date: string; time_type: 'none'; time_value: null }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!date) return;
    setSaving(true);
    await onAdd(meetupId, { date, time_type: 'none', time_value: null });
    setSaving(false);
    setDate('');
    setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="flex-1">
        + Add date
      </Button>
      <Modal
        open={open}
        title="Add a date option"
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleAdd} disabled={!date}>Add</Button>
          </>
        }
      >
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          aria-label="Date"
        />
      </Modal>
    </>
  );
}
