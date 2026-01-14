import { openDB, DBSchema, IDBPDatabase, StoreNames } from 'idb';

interface NeuroLiftDB extends DBSchema {
    workouts: {
        key: string;
        value: any;
    };
    journal: {
        key: string;
        value: any;
    };
    settings: {
        key: string;
        value: any;
    };
}

let db: IDBPDatabase<NeuroLiftDB> | null = null;

export const initDB = async () => {
    if (db) return db;

    db = await openDB<NeuroLiftDB>('neurolift-db', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('workouts')) {
                db.createObjectStore('workouts');
            }
            if (!db.objectStoreNames.contains('journal')) {
                db.createObjectStore('journal');
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings');
            }
        },
    });

    return db;
};

export const dbStorage = {
    async getItem(store: StoreNames<NeuroLiftDB>, key: string) {
        const database = await initDB();
        return database.get(store, key);
    },

    async setItem(store: StoreNames<NeuroLiftDB>, key: string, value: any) {
        const database = await initDB();
        return database.put(store, value, key);
    },

    async removeItem(store: StoreNames<NeuroLiftDB>, key: string) {
        const database = await initDB();
        return database.delete(store, key);
    },

    async getAllKeys(store: StoreNames<NeuroLiftDB>) {
        const database = await initDB();
        return database.getAllKeys(store);
    },

    async getAll(store: StoreNames<NeuroLiftDB>) {
        const database = await initDB();
        return database.getAll(store);
    }
};
