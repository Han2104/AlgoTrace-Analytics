import React from 'react';

export const MiniDashboard = ({ title, stats }) => {
  return (
    <div className="mini-dashboard">
      <div className="algo-title">{title}</div>
      <div className="stat-item">
        <span>{stats.visited}</span> visited
      </div>
      <div className="stat-item">
        <span>{stats.cost}</span> cost
      </div>
      <div className="stat-item" style={{ marginLeft: 'auto' }}>
        {stats.status}
      </div>
    </div>
  );
};
