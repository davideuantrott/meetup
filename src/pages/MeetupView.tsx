import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Share2, Plus, CheckCircle, XCircle, X } from 'lucide-react';
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
      <main className="min-h-screen flex items-center justify-center bg-[#F5F7F2]">
        <div className="w-10 h-10 rounded-full bg-[#C8F542] animate-pulse" />
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
    const slot = slots.find(s => s.id === slotId);
    const oldResponse = slot?.responses?.find(r => r.user_id === profile.id);
    setCommentary(getMeetupCommentary(members, allResponses, {
      user: profile, oldAvailability: oldResponse?.availability, newAvailability: availability,
    }));
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

  function handleShare() {
    const url = `${window.location.origin}/meetup/${meetupId}`;
    const title = meetup?.title ?? 'Meetup';
    if (navigator.share) navigator.share({ title, text: `${title} — Swimming Pals Planner`, url });
    else navigator.clipboard.writeText(url);
  }

  if (isConfirmed && meetup.confirmed_details) {
    return (
      <ConfirmedView
        meetup={meetup}
        members={members}
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
          <p className="text-[0.875rem] text-[#6B6B6B]">Everyone will be notified. This can't be undone.</p>
        </Modal>
      </ConfirmedView>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F2] flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <header className="bg-[#F5F7F2] sticky top-0 z-10 pt-4 pb-2 px-5">
        <div className="max-w-[480px] mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Back"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F7F2] text-[#6B6B6B] hover:bg-[#EBF0E6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348] shrink-0"
          >
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-[1.25rem] font-bold text-[#1A1A1A] truncate leading-tight tracking-[-0.01em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {meetup.title}
            </h1>
            {meetup.location && (
              <p className="text-[0.75rem] text-[#6B6B6B] truncate">{meetup.location}</p>
            )}
          </div>
          <button
            onClick={handleShare}
            aria-label="Share meetup"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F7F2] text-[#6B6B6B] hover:bg-[#EBF0E6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348] shrink-0"
          >
            <Share2 size={18} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[480px] mx-auto w-full px-5 py-4 flex flex-col gap-5 pb-10">

        {/* Commentary */}
        <div
          className="bg-white rounded-2xl px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-[0.875rem] text-[#6B6B6B] italic leading-relaxed">
            {commentary || 'Waiting for responses.'}
          </p>
        </div>

        {/* Avatar row */}
        <div
          className="flex gap-4 flex-wrap"
          aria-label="Group members and response status"
        >
          {members.map(m => {
            if (!m.user) return null;
            const userResponses = allResponses.filter(r => r.user_id === m.user_id);
            const hasYes = userResponses.some(r => r.availability === 'yes');
            const hasMaybe = userResponses.some(r => r.availability === 'maybe');
            const allNo = userResponses.length > 0 && userResponses.every(r => r.availability === 'no');
            const avail = hasYes ? 'yes' : hasMaybe ? 'maybe' : allNo ? 'no' : undefined;
            return (
              <div key={m.user_id} className="flex flex-col items-center gap-1">
                <Avatar user={m.user} availability={avail} hasNotResponded={!userResponses.length} size="md" />
                <span className="text-[0.625rem] text-[#9E9E9E] font-medium">{m.user.name.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>

        {/* Date carousel */}
        <section aria-labelledby="dates-heading">
          <h2 id="dates-heading" className="sr-only">Date options</h2>
          <div
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar"
            role="list"
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
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-[#9E9E9E] hover:text-[#F44336] hover:bg-[#FFEBEE] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F44336]"
                    >
                      <X size={14} strokeWidth={2} />
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
                <CheckCircle size={18} strokeWidth={2} />
                Confirm {formatSlotDate(bestSlot)}
              </Button>
            )}
            <div className="flex gap-2">
              {slots.length < 5 && <AddSlotInline meetupId={meetup.id} onAdd={addSlot} />}
              <Button variant="danger" size="sm" onClick={() => setShowCancelModal(true)} className="flex-1">
                <XCircle size={16} strokeWidth={1.75} />
                Cancel meetup
              </Button>
            </div>
            {!bestSlot && slots.length > 0 && (
              <p className="text-[0.8125rem] text-[#6B6B6B] text-center italic">
                No clear winner. You might need more options.
              </p>
            )}
          </section>
        )}

        {/* Reactions */}
        <ReactionsBar
          reactions={reactions}
          onReact={content => addReaction(meetup.id, profile.id, content)}
          disabled={!isOpen}
        />
      </main>

      {/* Share prompt toast */}
      {showSharePrompt && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-5 z-50" aria-live="polite">
          <div className="bg-[#1A1A1A] text-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-w-[400px] w-full">
            <div className="w-1 self-stretch rounded-full bg-[#C8F542] shrink-0" aria-hidden="true" />
            <p className="text-[0.875rem] flex-1">Share to WhatsApp so people actually respond.</p>
            <button onClick={handleShare} className="text-[0.875rem] font-semibold text-[#C8F542] hover:text-[#E8FAAB] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8F542] rounded">
              Share
            </button>
            <button onClick={() => setShowSharePrompt(false)} aria-label="Dismiss" className="text-[#6B6B6B] hover:text-[#9E9E9E] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B6B6B] rounded">
              <X size={16} strokeWidth={2} />
            </button>
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
            <p className="text-[0.875rem] text-[#6B6B6B]">
              Confirm <strong className="text-[#1A1A1A]">{formatSlotDate(slot)}</strong>? Everyone will be notified.
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
        <p className="text-[0.875rem] text-[#6B6B6B]">Everyone will be notified. This can't be undone.</p>
      </Modal>

      {/* Remove slot modal */}
      {showRemoveModal && (
        <Modal
          open
          title="Remove this date?"
          onClose={() => setShowRemoveModal(null)}
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowRemoveModal(null)}>Keep it</Button>
              <Button variant="danger" size="sm" onClick={async () => { await removeSlot(showRemoveModal.id, meetup!.id); setShowRemoveModal(null); }}>
                Remove
              </Button>
            </>
          }
        >
          {(() => {
            const count = (showRemoveModal.responses ?? []).length;
            return (
              <p className="text-[0.875rem] text-[#6B6B6B]">
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

function AddSlotInline({ meetupId, onAdd }: {
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
        <Plus size={16} strokeWidth={2} />
        Add date
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
          className="w-full rounded-xl border border-[#D0D0D0] bg-[#FAFBF8] px-4 text-[1rem] min-h-[48px] focus:outline-none focus:border-[#5C8348] transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
          aria-label="Date"
        />
      </Modal>
    </>
  );
}
