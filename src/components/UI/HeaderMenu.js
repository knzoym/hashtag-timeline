// src/components/UI/HeaderMenu.js
import React from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';

const HeaderMenu = ({ onClose, fileOperations }) => {
    const { setView, resetView, setEvents, setTimelines } = useTimelineStore();

    const handleItemClick = (action) => {
        if (action) action();
        onClose();
    };

    const menuItems = [
        { label: '新規作成', action: () => {
            if (window.confirm('現在の内容をクリアしますか？')) {
                setEvents([]);
                setTimelines([]);
            }
        }},
        { label: 'ファイルを開く', action: () => setView('mypage') },
        { label: 'JSON形式でエクスポート', action: fileOperations.handleExportJSON },
        { label: 'JSONファイルをインポート', action: fileOperations.handleImportJSON },
        { label: '表示をリセット', action: resetView },
    ];

    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)', zIndex: 99,
        },
        menu: {
            position: 'fixed', top: '60px', left: '12px', width: '250px',
            backgroundColor: 'white', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100,
            padding: '8px',
        },
        item: {
            padding: '10px 12px', borderRadius: '4px', cursor: 'pointer',
            fontSize: '14px',
        }
    };

    return (
        <>
            <div style={styles.overlay} onClick={onClose} />
            <div style={styles.menu}>
                {menuItems.map((item, index) => (
                    <div 
                        key={index} 
                        style={styles.item}
                        onClick={() => handleItemClick(item.action)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </>
    );
};

export default HeaderMenu;
