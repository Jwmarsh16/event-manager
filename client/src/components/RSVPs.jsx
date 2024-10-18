import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createRSVP } from '../redux/rsvpSlice'; // Adjusted import to match the slice

function RSVPs({ eventId }) {
  const [status, setStatus] = useState('');
  const dispatch = useDispatch();
  
  const { loading, error } = useSelector((state) => state.rsvps);

  const handleRSVP = (e) => {
    e.preventDefault();
    if (status) {
      dispatch(createRSVP({ event_id: eventId, status }));
    } else {
      console.error('Please select a status');
    }
  };

  return (
    <div>
      <form onSubmit={handleRSVP}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Select Status</option>
          <option value="going">Going</option>
          <option value="not_going">Not Going</option>
          <option value="maybe">Maybe</option>
        </select>
        <button type="submit" disabled={loading}>RSVP</button>
      </form>
      {loading && <p>Submitting RSVP...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}

export default RSVPs;
