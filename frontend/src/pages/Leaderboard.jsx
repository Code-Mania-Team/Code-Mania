import React from 'react';
import '../styles/Leaderboard.css';
const leaderboardBg = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925761/leaderboard_fryema.gif';
const trophyIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/trophy_tho3vz.png';
const Leaderboard = () => {
  const [activeTab, setActiveTab] = React.useState('all');
  // Character icons from Cloudinary
const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';
const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';
const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';
const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';
// Sample leaderboard data
const leaderboardData = [
    { rank: 1, name: 'Jet Padilla', score: 9850, avatar: characterIcon0 },
    { rank: 2, name: 'Diether Pano', score: 8765, avatar: characterIcon1 },
    { rank: 3, name: 'John Paul Bodino', score: 7654, avatar: characterIcon0 },
    { rank: 4, name: 'Wilster Dela Cruz', score: 7432, avatar: characterIcon1 },
    { rank: 5, name: 'Genniesys Bracia', score: 7210, avatar: characterIcon3 },
  ];
  return (
    <div className="leaderboard-page" style={{
      background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${leaderboardBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      padding: '20px 0',
      color: '#fff'
    }}>
      <div className="leaderboard-header">
        <div className="trophy-container">
          <img src={trophyIcon} alt="Trophy" className="trophy-icon" />
        </div>
        <h1>Leaderboard</h1>
      </div>
      <div className="leaderboard-container">
        <div className="leaderboard-tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`tab ${activeTab === 'python' ? 'active' : ''}`}
            onClick={() => setActiveTab('python')}
          >
            Python
          </button>
          <button 
            className={`tab ${activeTab === 'cpp' ? 'active' : ''}`}
            onClick={() => setActiveTab('cpp')}
          >
            C++
          </button>
          <button 
            className={`tab ${activeTab === 'javascript' ? 'active' : ''}`}
            onClick={() => setActiveTab('javascript')}
          >
            JavaScript
          </button>
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
                <span className="player-score">{player.score.toLocaleString()} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Leaderboard;
