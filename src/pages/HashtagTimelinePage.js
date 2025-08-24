// src/pages/HashtagTimelinePage.js
import React, { useEffect } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { useAuth } from '../hooks/useAuth';
import { useFileOperations } from '../hooks/useFileOperations';

import Header from '../components/UI/Header';
import ViewSwitcher from '../components/UI/ViewSwitcher';
import { EventModal } from '../components/Shared/EventModal';
import TimelineModal from '../components/Shared/TimelineModal';

import { createappStyles } from '../styles/appStyles';

const HashtagTimelinePage = () => {
  const {
    isModalOpen,
    saveEvent,
    closeModal,
  } = useTimelineStore();

  const { user, loading: authLoading, signInWithGoogle, signOut, isAuthenticated } = useAuth();
  const { handleSaveTimeline, handleLoadTimeline, ...fileOperations } = useFileOperations();

  const styles = createappStyles();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen) {
        if (e.key === 'Escape') {
          closeModal();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          saveEvent();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal, saveEvent]);

  return (
    <div style={styles.app}>
      <Header
        user={user}
        authLoading={authLoading}
        isAuthenticated={isAuthenticated}
        signInWithGoogle={signInWithGoogle}
        signOut={signOut}
        onSave={handleSaveTimeline}
        fileOperations={fileOperations}
      />

      <main style={styles.mainContent}>
        <ViewSwitcher
          user={user}
          onLoadTimeline={handleLoadTimeline}
        />
      </main>

      <EventModal />
      <TimelineModal />
    </div>
  );
};

export default HashtagTimelinePage;