import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import eventReducer from './eventSlice';
import groupReducer from './groupSlice';
import rsvpReducer from './rsvpSlice';
import commentReducer from './commentSlice';
import userReducer from './userSlice';
import inviteReducer from './inviteSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    groups: groupReducer,
    rsvps: rsvpReducer,
    comments: commentReducer,
    users: userReducer,
    invites: inviteReducer,
  },
});

export default store;