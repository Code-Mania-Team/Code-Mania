import React, { useState } from "react";
import { Search, Send } from "lucide-react";
import "./Community.css";

const Community = () => {
  const [comments, setComments] = useState([
    { 
      id: 1, 
      user: "Vince De Castro", 
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=vince",
      text: "Nice game I absolutely like it, since I love programming while playing games.", 
      time: "2 min ago" 
    },
    { 
      id: 2, 
      user: "Diether Pano", 
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=diether",
      text: "I am glad that CodeMania created a game with programming methods, it was stunning!", 
      time: "5 min ago" 
    },
    { 
      id: 3, 
      user: "Nathaniel Faborada", 
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=nathaniel",
      text: "I have been through a lot of levels just to understand on how this programming works. Well done!", 
      time: "10 min ago" 
    },
  ]);

  const [newComment, setNewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const newEntry = {
      id: Date.now(),
      user: "You",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=you",
      text: newComment,
      time: "Just now",
    };

    setComments([newEntry, ...comments]);
    setNewComment("");
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
    <div className="community-page">
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
            src="https://api.dicebear.com/7.x/pixel-art/svg?seed=you"
            alt="Your avatar"
            className="avatar"
          />
          <div className="comment-input">
            <textarea
              placeholder="Share your thoughts with the community..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleAddComment}
              className="post-button"
            >
              <Send className="send-icon" />
              Post
            </button>
          </div>
        </div>
      </div>

        {/* Comments List */}
        <div className="comments-section">
          {filteredComments.length > 0 ? (
            filteredComments.map((comment) => (
              <div key={comment.id} className="comment-card">
                <img
                  src={comment.avatar}
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

export default Community;