export type DocumentRecord = {
  id: string;
  type: string;
  title: string;
  category: string;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
};
export type DocumentFileRecord = {
  id: string;
  documentId: string;
  pageNumber: number;
  localPath: string;
  mimeType: string;
  size: number;
};
