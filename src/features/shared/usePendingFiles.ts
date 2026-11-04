import React from 'react';
import {
  cleanupPickedDocuments,
  type PickedDocument,
} from '../../native/documentFiles';
/** Keep a failed selection while reauthenticating; remove private temp files when leaving. */
export function usePendingFiles() {
  const owned = React.useRef<PickedDocument[]>([]);
  const [files, setFiles] = React.useState<PickedDocument[]>([]);
  React.useEffect(
    () => () => {
      void cleanupPickedDocuments(owned.current);
    },
    [],
  );
  const run = async (
    selected: PickedDocument[],
    operation: (items: PickedDocument[]) => Promise<unknown>,
  ) => {
    if (owned.current !== selected) await cleanupPickedDocuments(owned.current);
    owned.current = selected;
    setFiles(selected);
    await operation(selected);
    await cleanupPickedDocuments(selected);
    owned.current = [];
    setFiles([]);
  };
  return { files, run };
}
