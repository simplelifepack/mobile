import { useCallback, useRef, useState } from 'react';
import { healthApi, type HealthMember } from '../../api/health.api';
import type { DocumentProfileNames } from './documentFilters';

/** Health profile names, and which profile each health document belongs to. */
export function useHealthProfileNames() {
  const requestId = useRef(0);
  const [state, setState] = useState<{ profileNames: DocumentProfileNames; profileMembers: string[] }>({
    profileNames: new Map(),
    profileMembers: [],
  });

  const refreshProfileNames = useCallback(async (additionalMember?: Pick<HealthMember, 'name'>) => {
    const currentRequestId = ++requestId.current;
    try {
      const members = await healthApi.members();
      const lists = await Promise.all(
        members.map(member => healthApi.records(member.id).catch(() => [])),
      );
      const names = new Map<string, string>();
      members.forEach((member, index) =>
        lists[index]!.forEach(record => names.set(record.documentId, member.name)),
      );
      if (currentRequestId === requestId.current) {
        setState({
          profileNames: names,
          profileMembers: [...new Set([
            ...members.map(member => member.name),
            ...(additionalMember ? [additionalMember.name] : []),
          ])],
        });
      }
    } catch (error) {
      console.warn('[documents] unable to load health profiles', error);
    }
  }, []);

  const cancelProfileNamesRefresh = useCallback(() => {
    requestId.current += 1;
  }, []);

  return { ...state, refreshProfileNames, cancelProfileNamesRefresh };
}
