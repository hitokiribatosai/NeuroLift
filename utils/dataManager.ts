import { exportJsonFile } from './exportFile';
import { safeStorage } from './storage';
import { SYNC_KEYS, flushWorkspace, readWorkspace, writeWorkspace } from './workspace';
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
            await flushWorkspace();
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

            const fileName = `${EXPORT_FILENAME}_${new Date().toISOString().split('T')[0]}.json`;
            await exportJsonFile(fileName, backup);

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
            await writeWorkspace({ ...state, data: next, dirty: true });
            const entries = Object.entries(data);
            return { success: true, message: `Successfully restored ${entries.length} data categories.` };
        } catch (error) {
            console.error('Import failed:', error);
            return { success: false, message: error instanceof Error ? error.message : 'Import failed.' };
        }
    }
};
