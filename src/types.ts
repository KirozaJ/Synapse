export interface Note {
    id: number;
    user_id?: string; // Optional for local notes, required for cloud notes (but handled by DB)
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface File {
    id: number;
    name: string;
    type: string;
    data: Blob;
    createdAt: string;
}
