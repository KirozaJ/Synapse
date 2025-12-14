import { useEffect, useState, useCallback } from 'react';
import { noteService } from '../services/NoteService';
import { type Note } from '../types';
import { useAuth } from '../context/AuthContext';

export const useNotes = () => {
    const { session } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotes = useCallback(async () => {
        if (!session) {
            setNotes([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const fetchedNotes = await noteService.getNotes();
            setNotes(fetchedNotes);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch notes', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchNotes();
        // Setup Supabase Realtime subscription here if desired later
        // For now, we rely on manual refresh or optimism
    }, [fetchNotes]);

    const refresh = () => fetchNotes();

    return { notes, loading, error, refresh };
};
