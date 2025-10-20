import React from 'react';
import { Trophy } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = () => {
  // Sample leaderboard data
  const leaderboardData = [
    { rank: 1, name: 'Vince De Castro', score: 9850, avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=alex' },
    { rank: 2, name: 'Diether Pano', score: 8765, avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=maria' },
    { rank: 3, name: 'Wilson Esmabe', score: 7654, avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=james' },
    { rank: 4, name: 'Sarah Lee', score: 7432, avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=sarah' },
    { rank: 5, name: 'David Kim', score: 7210, avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=david' },
  ];

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <Trophy className="trophy-icon" />
        <h1>Leaderboard</h1>
      </div>

      <div className="leaderboard-container">
        <div className="leaderboard-tabs">
          <button className="tab active">All Time</button>
          <button className="tab">This Week</button>
          <button className="tab">Today</button>
        </div>

        <div className="leaderboard-list">
          {leaderboardData.map((player) => (
            <div key={player.rank} className="leaderboard-card">
              <div className="player-rank">
                <span className={`rank-badge ${player.rank <= 3 ? 'top-three' : ''}`}>
                  {player.rank}
                </span>
              </div>
              <img 
                src={player.avatar} 
                alt={player.name} 
                className="player-avatar"
              />
              <div className="player-info">
                <span className="player-name">{player.name}</span>
                <span className="player-score">{player.score.toLocaleString()} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
