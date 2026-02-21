import React from 'react';
import '../styles/Leaderboard.css';
import useGetAllLeaderboard from '../services/leaderBoard';

const leaderboardBg = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925761/leaderboard_fryema.gif';
const trophyIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/trophy_tho3vz.png';

const Leaderboard = () => {
  const [activeTab, setActiveTab] = React.useState('all');
  const [leaderboardData, setLeaderboardData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const getAllLeaderboard = useGetAllLeaderboard();

  // Character icons
  const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';
  const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';
  const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';
  const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';

  const characterIcons = {
    0: characterIcon0,
    1: characterIcon1,
    2: characterIcon2,
    3: characterIcon3,
  };

  React.useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await getAllLeaderboard();
        if (!response?.data) return;

        let users = response.data.map((user) => ({
          ...user,
          selectedXP:
            activeTab === 'all'
              ? user.overall_xp
              : user[`${activeTab}_xp`],
        }));

        // ❗ Remove users with 0 XP for selected language
        users = users.filter((user) => user.selectedXP > 0);

        // ❗ Sort by selected XP
        users.sort((a, b) => b.selectedXP - a.selectedXP);

        // ❗ Recalculate ranking per tab
        const formatted = users.map((user, index) => ({
          rank: index + 1,
          name: user.full_name,
          score: user.selectedXP,
          avatar: characterIcons[user.character_id] || characterIcon0,
        }));

        setLeaderboardData(formatted);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab]);

  return (
    <div
      className="leaderboard-page"
      style={{
        background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${leaderboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        padding: '20px 0',
        color: '#fff'
      }}
    >
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
          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading...</p>
          ) : leaderboardData.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No players yet.</p>
          ) : (
            leaderboardData.map((player) => (
              <div key={player.rank} className="leaderboard-card">
                <div className="player-rank">
                  <span
                    className={`rank-badge ${
                      player.rank <= 3 ? 'top-three' : ''
                    }`}
                  >
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
                  <span className="player-score">
                    {player.score.toLocaleString()} XP
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;