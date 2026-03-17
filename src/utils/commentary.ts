import type { User, Response, GroupMember } from '../types';

/**
 * Generates deadpan commentary based on the current state of responses to a meetup.
 * All copy is placeholder — the product owner will write final versions.
 */
export function getMeetupCommentary(
  members: GroupMember[],
  allResponses: Response[],
  changedUser?: { user: User; oldAvailability?: string; newAvailability: string }
): string {
  if (changedUser) {
    if (changedUser.oldAvailability && changedUser.newAvailability !== changedUser.oldAvailability) {
      if (changedUser.newAvailability === 'maybe') {
        return `${changedUser.user.name} says maybe, which as we all know means no.`;
      }
      return `${changedUser.user.name} has revised their position. Diplomats call this a U-turn.`;
    }
    if (changedUser.newAvailability === 'maybe') {
      return `${changedUser.user.name} says maybe, which as we all know means no.`;
    }
  }

  const memberCount = members.length;
  const respondedUserIds = new Set(allResponses.map(r => r.user_id));
  const respondedCount = respondedUserIds.size;

  if (respondedCount === 0) {
    return 'Tumbleweed.';
  }

  if (respondedCount === 1) {
    const respondedMember = members.find(m => respondedUserIds.has(m.user_id));
    const name = respondedMember?.user?.name ?? 'Someone';
    return `${name} has done their bit. The rest of you — noted.`;
  }

  if (respondedCount < memberCount) {
    return `${respondedCount} of ${memberCount} have responded. The others are apparently very busy.`;
  }

  // All responded — check the mix
  const latestResponsesByUser = new Map<string, string>();
  for (const r of allResponses) {
    latestResponsesByUser.set(r.user_id, r.availability);
  }

  const values = Array.from(latestResponsesByUser.values());
  const yesCount = values.filter(v => v === 'yes').length;
  const maybeCount = values.filter(v => v === 'maybe').length;
  const noCount = values.filter(v => v === 'no').length;

  if (yesCount === memberCount) {
    return "Unprecedented. Mark the calendar. Actually, that's the whole point.";
  }

  if (maybeCount === memberCount) {
    return 'Commitment issues across the board. Shocking.';
  }

  if (noCount === memberCount) {
    return 'Nobody can make it. Remarkable coordination in the wrong direction.';
  }

  if (noCount === 1) {
    const noMember = members.find(m => latestResponsesByUser.get(m.user_id) === 'no');
    const name = noMember?.user?.name ?? 'Someone';
    return `${name} can't make it. The rest of you will have to cope somehow.`;
  }

  return `${yesCount} yes, ${maybeCount} maybe, ${noCount} no. Progress of a sort.`;
}

export function getConfirmedCommentary(date: string, location: string | null): string {
  const loc = location ?? 'TBD';
  return `Done. ${date}. ${loc}. No one's allowed to be ill.`;
}

export function getCancelledCommentary(): string {
  return 'Called off. Back to WhatsApp.';
}

export function getNoWinnerCommentary(): string {
  return 'No clear winner. You might need more options.';
}

export function getDateRemovedCommentary(creatorName: string): string {
  return `${creatorName} has moved the goalposts.`;
}

export function getNudgeMessage(name: string, nudgeNumber: 1 | 2 | 3): string {
  switch (nudgeNumber) {
    case 1:
      return `${name} hasn't responded. They're probably busy. Probably.`;
    case 2:
      return `${name}. Mate. It's one button.`;
    case 3:
      return `At this point ${name} is making a statement.`;
  }
}
