import React from 'react';

export const MiniDashboard = ({ title, stats }) => {
  return (
    <div className="mini-dashboard">
      <div className="algo-title">{title}</div>
      <div className="stat-item">
        Nút duyệt: <span>{stats.visited}</span>
      </div>
      <div className="stat-item">
        Chi phí: <span>{stats.cost}</span>
      </div>
      <div className="stat-item">
        Trạng thái: <span>{stats.status}</span>
      </div>
    </div>
  );
};
