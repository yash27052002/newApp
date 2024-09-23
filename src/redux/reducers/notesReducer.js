// redux/notesReducer.js
import { createSlice } from '@reduxjs/toolkit';

const notesSlice = createSlice({
    name: 'notes',
    initialState: {
        notes: [],
    },
    reducers: {
        saveNote: (state, action) => {
            state.notes.push(action.payload);
        },
        getNotes: (state, action) => {
            state.notes = action.payload;
        },
    },
});

// Export actions
export const { saveNote, getNotes } = notesSlice.actions;

// Export reducer
export default notesSlice.reducer;
