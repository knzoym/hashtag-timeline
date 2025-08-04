// src/App.js
import React from 'react';
import HashtagTimeline from './pages/HashtagTimeline';
import TimelineErrorBoundary from './components/TimelineErrorBoundary';
import './App.css';

function App() {
  return (
    <div className="App">
      <TimelineErrorBoundary>
        <HashtagTimeline />
      </TimelineErrorBoundary>
    </div>
  );
}

export default App;