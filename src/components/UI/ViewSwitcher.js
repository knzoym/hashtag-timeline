// src/components/UI/ViewSwitcher.js
import React from 'react';
import EventGraphView from '../EventGraphView/EventGraphView';
import TableView from '../TableView/TableView';
import MyPage from '../MyPage/MyPage';
import WikiBrowser from '../WikiBrowser/WikiBrowser';
import TimelineView from '../TimelineView/TimelineView';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWikiData } from '../../hooks/useWikiData';

const ViewSwitcher = ({ user, onLoadTimeline }) => {
  const { currentView, setEvents } = useTimelineStore();
  const wikiData = useWikiData(user);

  const handleWikiEventImport = (wikiEvent) => {
    setEvents([...useTimelineStore.getState().events, wikiEvent]);
  };

  switch (currentView) {
    case 'graph':
      return <EventGraphView />;
    case 'table':
      return <TableView />;
    case 'wiki':
      return <WikiBrowser user={user} wikiData={wikiData} onImportEvent={handleWikiEventImport} />;
    case 'mypage':
      return <MyPage user={user} onLoadTimeline={onLoadTimeline} />;
    case 'timeline':
    default:
      return <TimelineView />;
  }
};

export default ViewSwitcher;
