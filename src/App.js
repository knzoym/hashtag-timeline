// src/App.js
import React from 'react';
import HashtagTimelinePage from './pages/HashtagTimelinePage';
import TimelineErrorBoundary from './components/TimelineErrorBoundary';
import './App.css';

function App() {
  return (
    <div className="App">
      <TimelineErrorBoundary>
        <HashtagTimelinePage />
      </TimelineErrorBoundary>
    </div>
  );
}

export default App;
