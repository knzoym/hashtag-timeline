// src/utils/wikiEventUtils.js - Wiki イベント状態管理ユーティリティ
export const EVENT_STATUS = {
  STABLE: 'stable',           // 安定版（承認済み）
  PENDING: 'pending',         // 承認待ち
  REJECTED: 'rejected',       // 却下済み
  DRAFT: 'draft'             // 下書き
};

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected',
  AUTO_APPROVED: 'auto_approved'
};

// イベントの承認状態を取得
export const getEventApprovalStatus = (event) => {
  // 安定版が存在する場合
  if (event.stable_revision_id) {
    return EVENT_STATUS.STABLE;
  }
  
  // リビジョン情報がある場合
  if (event.approval_status) {
    switch (event.approval_status) {
      case APPROVAL_STATUS.PENDING:
        return EVENT_STATUS.PENDING;
      case APPROVAL_STATUS.REJECTED:
        return EVENT_STATUS.REJECTED;
      case APPROVAL_STATUS.APPROVED:
      case APPROVAL_STATUS.AUTO_APPROVED:
        return EVENT_STATUS.STABLE;
      default:
        return EVENT_STATUS.PENDING;
    }
  }
  
  // デフォルトは承認待ち
  return EVENT_STATUS.PENDING;
};

// 承認状態に応じたスタイル情報を取得
export const getEventStatusStyle = (status) => {
  const styleMap = {
    [EVENT_STATUS.STABLE]: {
      borderColor: '#10b981',
      backgroundColor: '#ecfdf5',
      textColor: '#059669',
      badgeColor: '#10b981',
      badgeText: '安定版',
      opacity: 1
    },
    [EVENT_STATUS.PENDING]: {
      borderColor: '#f59e0b', 
      backgroundColor: '#fefbf0',
      textColor: '#d97706',
      badgeColor: '#f59e0b',
      badgeText: '承認待ち',
      opacity: 0.8
    },
    [EVENT_STATUS.REJECTED]: {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2', 
      textColor: '#dc2626',
      badgeColor: '#ef4444',
      badgeText: '却下済み',
      opacity: 0.6
    },
    [EVENT_STATUS.DRAFT]: {
      borderColor: '#6b7280',
      backgroundColor: '#f9fafb',
      textColor: '#6b7280', 
      badgeColor: '#6b7280',
      badgeText: '下書き',
      opacity: 0.7
    }
  };

  return styleMap[status] || styleMap[EVENT_STATUS.PENDING];
};

// Timeline/Network表示用のイベントスタイル適用
export const applyWikiEventStyles = (event, showPendingEvents = false) => {
  const status = getEventApprovalStatus(event);
  const styleInfo = getEventStatusStyle(status);

  // 承認待ちイベントを表示しない場合は除外
  if (!showPendingEvents && status !== EVENT_STATUS.STABLE) {
    return null;
  }

  return {
    ...event,
    wikiStatus: status,
    style: {
      borderColor: styleInfo.borderColor,
      backgroundColor: styleInfo.backgroundColor,
      opacity: styleInfo.opacity,
      borderWidth: status === EVENT_STATUS.STABLE ? '2px' : '1px',
      borderStyle: status === EVENT_STATUS.PENDING ? 'dashed' : 'solid'
    },
    badge: {
      text: styleInfo.badgeText,
      color: styleInfo.badgeColor,
      show: status !== EVENT_STATUS.STABLE // 安定版以外はバッジ表示
    }
  };
};

// 自動承認の条件をチェック
export const checkAutoApprovalCriteria = (revision) => {
  const criteria = {
    minUpvotes: 3,
    minScore: 2.0,
    maxReports: 1,
    minAgeHours: 24
  };

  const upvotes = revision.upvotes || 0;
  const reports = revision.reports || 0; 
  const score = revision.stable_score || 0;
  const ageHours = (new Date() - new Date(revision.created_at)) / (1000 * 60 * 60);

  const checks = {
    upvotes: upvotes >= criteria.minUpvotes,
    score: score >= criteria.minScore,
    reports: reports <= criteria.maxReports,
    age: ageHours >= criteria.minAgeHours
  };

  return {
    ...checks,
    isEligible: Object.values(checks).every(Boolean),
    criteria,
    current: { upvotes, reports, score, ageHours }
  };
};

// 承認権限レベルの判定
export const getUserApprovalPermission = (user) => {
  if (!user) return 'none';
  
  // TODO: 実際の権限システムに置き換え
  // 暫定的に全ログインユーザーに承認権限を付与
  return {
    level: 'moderator',
    canApprove: true,
    canReject: true,
    canAutoApprove: true,
    canViewPending: true
  };

//   将来的な権限システム例:
//   const reputation = user.reputation || 0;
//   const role = user.role || 'user';
  
//   if (role === 'admin') {
//     return {
//       level: 'admin',
//       canApprove: true,
//       canReject: true, 
//       canAutoApprove: true,
//       canViewPending: true,
//       canManageUsers: true
//     };
}