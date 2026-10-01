import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { safeStorage } from './storage';
import { SYNC_KEYS, readWorkspace, writeWorkspace } from './workspace';
import { validateBackup } from './validateBackup';

const BACKUP_VERSION = 1;
const EXPORT_FILENAME = 'neurolift_backup';

interface BackupData {
    version: number;
    timestamp: string;
    platform: string;
    data: Record<string, any>;
}

export const DataManager = {
    /**
     * Collects all app data and exports it as a JSON file
     */
    exportData: async (): Promise<boolean> => {
        try {
            // 1. Collect all data keys
            const keysToExport = [...SYNC_KEYS];

            const exportData: Record<string, any> = {};

            keysToExport.forEach(key => {
                const value = safeStorage.getItem(key);
                if (value) {
                    try {
                        exportData[key] = JSON.parse(value);
                    } catch (e) {
                        exportData[key] = value;
                    }
                }
            });

            // 2. Create backup object
            const backup: BackupData = {
                version: BACKUP_VERSION,
                timestamp: new Date().toISOString(),
                platform: 'web/android/ios',
                data: exportData
            };

            const jsonString = JSON.stringify(backup, null, 2);
            const fileName = `${EXPORT_FILENAME}_${new Date().toISOString().split('T')[0]}.json`;

            // 3. Write file
            if (Capacitor.isNativePlatform()) {
                // Only the dedicated export cache is exposed to the native share sheet.
                const result = await Filesystem.writeFile({
                    path: `exports/${fileName}`,
                    data: jsonString,
                    directory: Directory.Cache,
                    recursive: true,
                    encoding: Encoding.UTF8
                });

                // 4. Share file
                await Share.share({
                    title: 'NeuroLift Backup',
                    text: 'Here is my NeuroLift data backup.',
                    url: result.uri,
                    dialogTitle: 'Export Backup'
                });
            } else {
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            return true;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        }
    },

    /**
     * Imports data from a JSON string, validating and restoring it
     */
    importData: async (jsonContent: string): Promise<{ success: boolean; message: string }> => {
        try {
            let backup: BackupData;
            try {
                backup = JSON.parse(jsonContent);
            } catch (e) {
                return { success: false, message: 'Invalid file format. Please upload a valid JSON backup.' };
            }

            const data = validateBackup(backup);
            const state = readWorkspace();
            const next = { ...state.data };
            for (const [key, value] of Object.entries(data)) next[key] = value;
            writeWorkspace({ ...state, data: next, dirty: true });
            const entries = Object.entries(data);
            return { success: true, message: `Successfully restored ${entries.length} data categories.` };
        } catch (error) {
            console.error('Import failed:', error);
            return { success: false, message: error instanceof Error ? error.message : 'Import failed.' };
        }
    }
};
