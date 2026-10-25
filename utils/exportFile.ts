import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** User-initiated export, shared by ordinary backups and failure recovery. */
export async function exportJsonFile(filename: string, content: unknown) {
  const data = JSON.stringify(content, null, 2);
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({ path: `exports/${filename}`, data,
      directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
    await Share.share({ title: 'NeuroLift Backup', url: result.uri, dialogTitle: 'Export Backup' });
    return;
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
