// src/components/UI/ViewSwitcher.js
import React, { useMemo } from 'react';
import EventGraphView from '../EventGraphView/EventGraphView';
import TableView from '../TableView/TableView';
import MyPage from '../MyPage/MyPage';
import WikiBrowser from '../WikiBrowser/WikiBrowser';
import TimelineView from '../TimelineView/TimelineView';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWikiData } from '../../hooks/useWikiData';

const ViewSwitcher = ({ user, onLoadTimeline }) => {
  const { currentView, events, setEvents } = useTimelineStore();
  
  // useWikiDataを条件的に呼び出すのではなく、常に呼び出す
  const wikiData = useWikiData(user);

  // Wiki event import handler をメモ化
  const handleWikiEventImport = useMemo(() => {
    return (wikiEvent) => {
      const currentEvents = useTimelineStore.getState().events;
      setEvents([...currentEvents, wikiEvent]);
    };
  }, [setEvents]);

  // 各ビューコンポーネントをメモ化して不要な再レンダリングを防ぐ
  const viewComponents = useMemo(() => ({
    graph: <EventGraphView />,
    table: <TableView />,
    timeline: <TimelineView />,
    wiki: (
      <WikiBrowser 
        user={user} 
        wikiData={wikiData} 
        onImportEvent={handleWikiEventImport} 
      />
    ),
    mypage: (
      <MyPage 
        user={user} 
        onLoadTimeline={onLoadTimeline} 
      />
    ),
  }), [user, wikiData, handleWikiEventImport, onLoadTimeline]);

  // 現在のビューに対応するコンポーネントを返す
  return viewComponents[currentView] || viewComponents.timeline;
};

export default ViewSwitcher;