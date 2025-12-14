import { supabase } from '../lib/supabase';
import { type Note } from '../types';

export interface NoteService {
    getNotes(): Promise<Note[]>;
    getNote(id: number): Promise<Note | null>;
    createNote(note: Omit<Note, 'id' | 'user_id' | 'createdAt' | 'updatedAt'>): Promise<number>;
    updateNote(id: number, note: Partial<Note>): Promise<void>;
    deleteNote(id: number): Promise<void>;
}

export class SupabaseNoteService implements NoteService {
    async getNotes(): Promise<Note[]> {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Map snake_case from DB to camelCase for app
        return (data || []).map(this.mapFromDb);
    }

    async getNote(id: number): Promise<Note | null> {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return this.mapFromDb(data);
    }

    async createNote(note: { title: string; content: string }): Promise<number> {
        const { data, error } = await supabase
            .from('notes')
            .insert({
                title: note.title,
                content: note.content,
                // user_id is handled by default auth.uid() in DB if set up correctly, 
                // but client sends the request with auth token.
            })
            .select()
            .single();

        if (error) throw error;
        return data.id;
    }

    async updateNote(id: number, note: Partial<Note>): Promise<void> {
        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };
        if (note.title !== undefined) updatePayload.title = note.title;
        if (note.content !== undefined) updatePayload.content = note.content;

        const { error } = await supabase
            .from('notes')
            .update(updatePayload)
            .eq('id', id);

        if (error) throw error;
    }

    async deleteNote(id: number): Promise<void> {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    private mapFromDb(row: any): Note {
        return {
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            content: row.content,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

export const noteService = new SupabaseNoteService();
