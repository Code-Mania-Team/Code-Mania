import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import "../App.css";
import useAuth from "../hooks/useAxios";
import useLearningProgress from "../services/useLearningProgress";
import { useTheme } from "../context/ThemeProvider.jsx";
import useNotifications from "../services/useNotifications";

const notificationIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1773418099/notification_scq4kg.png';

// Character icons from Cloudinary
const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';
const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';
const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';
const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';

const crown = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925753/crown_rgkcpl.png';
const burgerIcon = 'https://res.cloudinary.com/daegpuoss/image/upload/v1766925752/burger_fhgxqr.png';

// ── Notification Bell Component ──────────────────────────────
const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close panel on escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const formatNotifTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notification-bell-wrap" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        title="Notifications"
      >
        <img src={notificationIcon} alt="Notifications" className="notification-bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="notification-drawer-overlay"
            aria-label="Close notifications"
            onClick={() => setIsOpen(false)}
          />

          <aside className="notification-drawer" aria-label="Notifications panel">
            <div className="notification-drawer-header">
              <div className="notification-drawer-title">
                <span className="notification-dropdown-title">Notifications</span>
                <span className="notification-unread-pill">{unreadCount || 0} unread</span>
              </div>

              <div className="notification-drawer-actions">
                <button
                  type="button"
                  className="notification-mark-all-btn"
                  onClick={markAllAsRead}
                  disabled={unreadCount <= 0}
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  className="notification-drawer-close"
                  aria-label="Close"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="notification-list">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  (() => {
                    const kind = notif?.metadata?.kind;
                    const prize = notif?.metadata?.unlocked_cosmetic || null;
                    const hasPrize =
                      kind === "weekly_challenge_complete" &&
                      (Boolean(prize?.key) || Boolean(notif?.metadata?.unlocked_cosmetic_key));

                    return (
                  <div
                    key={notif.notification_id}
                    className={`notification-item ${!notif.is_read ? 'notification-item-unread' : ''} ${hasPrize ? 'notification-item-prize' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.notification_id);
                      const href = notif?.metadata?.href;
                      if (href && typeof href === "string") {
                        setIsOpen(false);
                        navigate(href);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!notif.is_read) markAsRead(notif.notification_id);
                        const href = notif?.metadata?.href;
                        if (href && typeof href === "string") {
                          setIsOpen(false);
                          navigate(href);
                        }
                      }
                    }}
                  >
                    {!notif.is_read && <span className="notification-item-dot" />}
                    <div className="notification-item-content">
                      <p className="notification-item-title">{notif.title}</p>
                      <p className="notification-item-message">{notif.message}</p>

                      {hasPrize ? (
                        <div className="notification-prize-row" aria-label="Prize unlocked">
                          {prize?.asset_url ? (
                            <img className="notification-prize-thumb" src={prize.asset_url} alt="" loading="lazy" />
                          ) : (
                            <span className="notification-prize-badge">PRIZE</span>
                          )}
                          <span className="notification-prize-text">
                            {prize?.name ? `Unlocked: ${prize.name}` : "Prize unlocked"}
                          </span>
                        </div>
                      ) : null}

                      <span className="notification-item-time">{formatNotifTime(notif.created_at)}</span>
                    </div>
                  </div>
                    );
                  })()
                ))
              ) : (
                <div className="notification-empty">No notifications yet.</div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

const Header = ({ onOpenModal, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const [characterIcon, setCharacterIcon] = useState(() => localStorage.getItem('selectedCharacterIcon') || null);
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { progress } = useLearningProgress();

  // Unlock terminal when user completes at least 16 exercises in any one course
  const hasTerminalAccess = progress.some(
    (p) => Number(p?.completed || 0) >= 16
  );

  // Load character icon from localStorage
  useEffect(() => {
    const iconByCharacterId = {
      0: characterIcon1,
      1: characterIcon0,
      2: characterIcon2,
      3: characterIcon3,
    };

    const loadCharacterIcon = () => {
      if (!isAuthenticated) {
        setCharacterIcon(null);
        return;
      }

      const userCharacterId = user?.character_id;
      const normalizedUserCharacterId =
        userCharacterId === null || userCharacterId === undefined
          ? null
          : Number(userCharacterId);

      if (normalizedUserCharacterId !== null && !Number.isNaN(normalizedUserCharacterId)) {
        const iconFromUser = iconByCharacterId[normalizedUserCharacterId] || null;
        if (iconFromUser) {
          localStorage.setItem('selectedCharacter', String(normalizedUserCharacterId));
          localStorage.setItem('selectedCharacterIcon', iconFromUser);
          setCharacterIcon(iconFromUser);
          return;
        }
      }

      // Authenticated user with no character in profile and no local selection: avoid stale icon from previous account
      const hasStoredCharacter = localStorage.getItem('selectedCharacter') !== null;
      if (
        user?.user_id &&
        (normalizedUserCharacterId === null || Number.isNaN(normalizedUserCharacterId)) &&
        !hasStoredCharacter
      ) {
        localStorage.removeItem('selectedCharacter');
        localStorage.removeItem('selectedCharacterIcon');
        setCharacterIcon(null);
        return;
      }

      const storedCharacterIdRaw = localStorage.getItem('selectedCharacter');
      const storedCharacterId = storedCharacterIdRaw === null ? null : Number(storedCharacterIdRaw);

      if (storedCharacterId === null || Number.isNaN(storedCharacterId)) {
        const storedIcon = localStorage.getItem('selectedCharacterIcon');
        setCharacterIcon(storedIcon || null);
        return;
      }

      const expectedIcon = iconByCharacterId[storedCharacterId] || null;
      if (expectedIcon) {
        localStorage.setItem('selectedCharacterIcon', expectedIcon);
      } else {
        localStorage.removeItem('selectedCharacterIcon');
      }
      setCharacterIcon(expectedIcon);
    };

    // Load immediately
    loadCharacterIcon();

    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'selectedCharacterIcon' || e.key === 'selectedCharacter') {
        loadCharacterIcon();
      }
    };

    // Also listen for custom events (for same-tab updates)
    const handleCharacterUpdate = () => {
      loadCharacterIcon();
    };

    const handleAuthChange = () => {
      loadCharacterIcon();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('characterUpdated', handleCharacterUpdate);
    window.addEventListener('authchange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('characterUpdated', handleCharacterUpdate);
      window.removeEventListener('authchange', handleAuthChange);
    };
  }, [isAuthenticated, isLoading, user?.user_id, user?.character_id]);

  const isAdmin = isAuthenticated && user?.role === "admin";
  const homePath = isAdmin ? '/admin' : isAuthenticated ? '/dashboard' : '/';

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
      setIsLearnOpen(false);
      setIsAccountOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsLearnOpen(false);
    setIsAccountOpen(false);
    setIsProfileOpen(false);
  };

  // Close profile dropdown on outside click / escape
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!isProfileOpen) return;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    const onDocKeyDown = (e) => {
      if (!isProfileOpen) return;
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [isProfileOpen]);

  const handleLearnClick = (e) => {
    if (window.innerWidth <= 1000) {
      e.preventDefault();
      setIsLearnOpen((prev) => {
        const next = !prev;
        if (next) setIsAccountOpen(false);
        return next;
      });
    } else {
      closeMobileMenu();
    }
  };

  const handleAccountClick = (e) => {
    if (window.innerWidth <= 1000) {
      e.preventDefault();
      setIsAccountOpen((prev) => {
        const next = !prev;
        if (next) setIsLearnOpen(false);
        return next;
      });
    }
  };

  const handleSignOutClick = async () => {
    closeMobileMenu();
    if (onSignOut) await onSignOut();
  };

  const closeProfileDropdown = () => {
    setIsProfileOpen(false);
    // Prevent focus-within from holding the menu open.
    try {
      document.activeElement?.blur?.();
    } catch {
      // ignore
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <NavLink to={homePath} onClick={() => setIsMenuOpen(false)}>
          <img src={crown} alt="Code Mania Logo" />
        </NavLink>
        <h1 className="logo-text"><NavLink to={homePath} onClick={() => setIsMenuOpen(false)}>Code Mania</NavLink></h1>
      </div>

      <button
        className="hamburger"
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <img
          src={burgerIcon}
          alt="Menu"
          className={`hamburger-icon ${isMenuOpen ? 'is-active' : ''}`}
        />
      </button>

      <nav className={`nav ${isMenuOpen ? 'is-active' : ''}`}>
        <NavLink to={homePath} className="nav-link" onClick={closeMobileMenu}>{isAdmin ? "ADMIN" : isAuthenticated ? "DASHBOARD" : "HOME"}</NavLink>

        <div className="nav-dropdown">
          <NavLink to="/learn" className={`nav-link learn-trigger ${isLearnOpen ? "is-open" : ""}`} onClick={handleLearnClick}>
            <span>LEARN</span>
            <span className="learn-arrow">&gt;</span>
          </NavLink>
          <div className={`dropdown-menu ${isLearnOpen ? "is-open" : ""}`}>
            <Link to="/learn" className="dropdown-item mobile-only-item" onClick={closeMobileMenu}>All Courses</Link>
            <Link to="/learn/python" className="dropdown-item course-python" onClick={closeMobileMenu}>Python</Link>
            <Link to="/learn/cpp" className="dropdown-item course-cpp" onClick={closeMobileMenu}>C++</Link>
            <Link to="/learn/javascript" className="dropdown-item course-javascript" onClick={closeMobileMenu}>JavaScript</Link>
          </div>
        </div>

        <NavLink to="/freedomwall" className="nav-link" onClick={closeMobileMenu}>COMMUNITY</NavLink>
        <NavLink to="/leaderboard" className="nav-link" onClick={closeMobileMenu}>LEADERBOARD</NavLink>

        {/* Terminal link — locked until 1 course is completed (admins always have access) */}
        {isAuthenticated && (
          <NavLink
            to="/terminal"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''} ${isAdmin || hasTerminalAccess ? '' : 'nav-link-locked'}`
            }
            onClick={closeMobileMenu}
          >
            TERMINAL
          </NavLink>
        )}

        <NavLink
          to="/rewards"
          className="nav-link nav-icon-link"
          onClick={closeMobileMenu}
          aria-label="Rewards"
          title="Rewards"
        >
          <span className="nav-extra-icon" aria-hidden="true" />
          <span className="nav-icon-text">REWARDS</span>
        </NavLink>

        <button
          type="button"
          className="nav-link theme-toggle"
          onClick={() => {
            toggleTheme();
            closeMobileMenu();
          }}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          <span className="theme-toggle-icon" aria-hidden="true" />
        </button>

        {isLoading ? null : isAuthenticated ? (
          <>
            <div className="mobile-account nav-dropdown">
              <a href="#" className={`nav-link learn-trigger account-trigger ${isAccountOpen ? "is-open" : ""}`} onClick={handleAccountClick}>
                <span className="account-label">
                  {characterIcon ? (
                    <img src={characterIcon} alt="Profile" className="mobile-account-avatar" />
                  ) : (
                    <span className="mobile-account-avatar-fallback" role="img" aria-label="Profile">👤</span>
                  )}
                  <span>ACCOUNT</span>
                </span>
                <span className="learn-arrow">&gt;</span>
              </a>
              <div className={`dropdown-menu ${isAccountOpen ? "is-open" : ""}`}>
                {isAdmin ? (
                  <Link to="/admin" className="dropdown-item" onClick={closeMobileMenu}>Admin Dashboard</Link>
                ) : (
                  <Link to="/profile" className="dropdown-item" onClick={closeMobileMenu}>Profile</Link>
                )}
                <button type="button" className="dropdown-item dropdown-item-button" onClick={handleSignOutClick}>Sign Out</button>
              </div>
            </div>

            <NotificationBell />

            <div
              className="profile-icon-container"
              ref={profileDropdownRef}
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <button
                type="button"
                className="profile-icon"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={isProfileOpen ? "true" : "false"}
                onClick={() => setIsProfileOpen((prev) => !prev)}
              >
                {characterIcon ? (
                  <img
                    src={characterIcon}
                    alt="Profile"
                    className="profile-character-icon"
                  />
                ) : (
                  <span role="img" aria-label="Profile">👤</span>
                )}
              </button>

              <div className={`profile-dropdown ${isProfileOpen ? "is-open" : ""}`} role="menu" aria-label="Account">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="dropdown-item"
                    onClick={() => {
                      closeProfileDropdown();
                      closeMobileMenu();
                    }}
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => {
                      closeProfileDropdown();
                      closeMobileMenu();
                    }}
                  >
                    Profile
                  </Link>
                )}
                <button
                  type="button"
                  className="dropdown-item dropdown-item-button"
                  onClick={async () => {
                    closeProfileDropdown();
                    await handleSignOutClick();
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </>
        ) : (
          <button className="sign-in-btn" onClick={() => { onOpenModal(); closeMobileMenu(); }}>
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
