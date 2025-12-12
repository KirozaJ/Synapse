import Dexie, { type EntityTable } from 'dexie';

interface Note {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

interface File {
    id: number;
    name: string;
    type: string;
    data: Blob;
    createdAt: string;
}

const db = new Dexie('SynapseDB') as Dexie & {
    notes: EntityTable<Note, 'id'>;
    files: EntityTable<File, 'id'>;
};

db.version(2).stores({
    notes: '++id, title, content, createdAt, updatedAt',
    files: '++id, name, type, createdAt'
});

export type { Note, File };
export { db };
