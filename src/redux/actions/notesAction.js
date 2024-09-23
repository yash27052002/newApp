// redux/notesActions.js
import axios from 'axios';
import { saveNote, getNotes as setNotes } from './notesReducer';

const API_URL = 'http://13.202.193.62:8085'; // Replace with your actual API URL

export const saveNoteAction = (note) => async (dispatch) => {
    try {
        const response = await axios.post(`${API_URL}/caller/save`, { note });
        dispatch(saveNote(response.data));
    } catch (error) {
        console.error('Error saving note:', error);
    }
};

export const getNotesAction = () => async (dispatch) => {
    try {
        const response = await axios.get(`${API_URL}/caller/66f0fa18c4ba091ca7d06940`);
        dispatch(setNotes(response.data));
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
};
