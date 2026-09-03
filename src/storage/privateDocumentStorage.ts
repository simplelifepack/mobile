import { Dirs, FileSystem } from 'react-native-file-access';
const root = `${Dirs.DocumentDir}/readiness-private`;
export const privateDocumentStorage = {
  async ensureReady() {
    if (!(await FileSystem.exists(root))) await FileSystem.mkdir(root);
    return root;
  },
  async importEncryptedFile(sourcePath: string, fileName: string) {
    await this.ensureReady();
    const destination = `${root}/${fileName}.encrypted`;
    await FileSystem.cp(sourcePath, destination);
    return destination;
  },
  async remove(path: string) {
    if (!path.startsWith(`${root}/`))
      throw new Error(
        'Refusing to remove a file outside private document storage.',
      );
    if (await FileSystem.exists(path)) await FileSystem.unlink(path);
  },
};
