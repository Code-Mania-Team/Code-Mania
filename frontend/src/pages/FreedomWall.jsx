import React, { useEffect, useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import "../styles/FreedomWall.css";
import useGetAllPosts from "../services/home";
import useUserPost from "../services/postFreedomwall";
// Character icons from Cloudinary
const characterIcon0 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character_kwtv10.png';
const characterIcon1 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character1_a6sw9d.png';
const characterIcon2 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character3_bavsbw.png';
const characterIcon3 = 'https://res.cloudinary.com/daegpuoss/image/upload/v1770438516/character4_y9owfi.png';
const FreedomWall = ({ onOpenModal }) => {
  const getAllPosts = useGetAllPosts();
  const userPost = useUserPost();
  const [comments, setComments] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [newComment, setNewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const iconByCharacterId = useMemo(() => {
    return {
      0: characterIcon1,
      1: characterIcon0,
      2: characterIcon2,
      3: characterIcon3,
    };
  }, []);
  const formatTimeAgo = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (!date || Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec} sec ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} mins ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return '1 hr ago';
    if (diffHr < 24) return `${diffHr} hrs ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return '1 day ago';
    if (diffDay < 7) return `${diffDay} days ago`;
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek === 1) return '1 week ago';
    return `${diffWeek} weeks ago`;
  };
  const mapApiPostToComment = (post) => {
    const rawUsername = post?.users?.username ?? post?.username;
    const username = rawUsername ? String(rawUsername) : 'Anonymous';
    const characterIdRaw = post?.users?.character_id ?? post?.character_id;
    const characterId = characterIdRaw === null || characterIdRaw === undefined ? null : Number(characterIdRaw);
    const avatar = characterId !== null && !Number.isNaN(characterId) ? (iconByCharacterId[characterId] || null) : null;
    console.log(rawUsername);
    const createdAtLabel = post?.created_at ? formatTimeAgo(post.created_at) : '';
    return {
      id: post?.fd_wall_id ?? post?.id ?? Date.now(),
      user: username,
      avatar,
      text: post?.content ?? '',
      time: createdAtLabel,
    };
  };
  const fetchPosts = async () => {
    setIsFetching(true);
    setFetchError('');
    try {
      const res = await getAllPosts();
      const items = Array.isArray(res?.result) ? res.result : [];
      setComments(items.map(mapApiPostToComment));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch posts.';
      setFetchError(String(msg));
    } finally {
      setIsFetching(false);
    }
  };
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleAddComment = async () => {
    const content = (newComment || '').trim();
    console.log("content",content);
    if (!content) return;
    setIsPosting(true);
    setPostError('');
    try {
      const res = await userPost(content);
      if (res?.success) {
        const created = res?.data ? mapApiPostToComment(res.data) : null;
        if (created) {
          setComments((prev) => [created, ...prev]);
        } else {
          await fetchPosts();
        }
        setNewComment('');
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setPostError('Please sign in to post on the Freedom Wall.');
        if (typeof onOpenModal === 'function') {
          onOpenModal();
        }
        return;
      }
      const msg = err?.response?.data?.message || err?.message || 'Failed to create post.';
      setPostError(String(msg));
    } finally {
      setIsPosting(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };
  const filteredComments = comments.filter(comment =>
    comment.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="freedomwall-page">
      {/* Search Bar */}
      <div className="search-container">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {/* Comment Input */}
      <div className="comment-input-section">
        <div className="comment-input-wrapper">
          <img
            src={localStorage.getItem('selectedCharacterIcon') || "https://api.dicebear.com/7.x/pixel-art/svg?seed=you"}
            alt="Your avatar"
            className="avatar"
          />
          <div className="comment-input">
            <textarea
              placeholder="Share your thoughts on the FreedomWall..."
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setPostError('');
              }}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleAddComment}
              className="post-button"
              disabled={isPosting}
            >
              <Send className="send-icon" />
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
        {postError ? (
          <div className="no-results">{postError}</div>
        ) : null}
      </div>
        {/* Comments List */}
        <div className="comments-section">
          {isFetching ? (
            <div className="no-results">Loading posts...</div>
          ) : fetchError ? (
            <div className="no-results">{fetchError}</div>
          ) : filteredComments.length > 0 ? (
            filteredComments.map((comment) => (
              <div key={comment.id} className="comment-card">
                <img
                  src={comment.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(comment.user)}`}
                  alt={`${comment.user}'s avatar`}
                  className="comment-avatar"
                />
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-user">{comment.user}</span>
                    <span className="comment-time">{comment.time}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              No comments found. Be the first to share your thoughts!
            </div>
          )}
        </div>
    </div>
  );
};
export default FreedomWall;