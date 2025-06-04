/**
 * Post Component
 * 
 * Deze component vertegenwoordigt een individuele post in de feed.
 * Het toont de post afbeelding, caption, likes, comments en interactiemogelijkheden.
 * 
 * Functionaliteiten:
 * 1. Weergave van post inhoud (afbeelding, caption, timestamp)
 * 2. Like/unlike interactie
 * 3. Commentaar systeem
 * 4. Gebruikersprofiel link
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

function Post({ post, currentUser, onLike, onComment }) {
  // State voor commentaar input en commentaar weergave
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  /**
   * Handler voor het plaatsen van een commentaar
   * Voorkomt lege commentaren en reset het input veld na plaatsing
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onComment(post.id, comment);
      setComment('');
    }
  };

  /**
   * Formatteert een datum naar Nederlands formaat
   * 
   * @param {string} dateString - ISO datum string
   * @returns {string} Geformatteerde datum string
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 border-2 border-gray-200">
      {/* Post header met gebruikersinformatie */}
      <div className="p-4 flex items-center border-b-2 border-gray-200">
        <Link to={`/profile/${post.user_id}`} className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <span className="ml-2 font-semibold">{post.username}</span>
        </Link>
      </div>

      {/* Post content met afbeelding en details */}
      <div className="flex flex-col md:flex-row">
        {/* Post afbeelding sectie */}
        <div className="md:w-2/3">
          <img
            src={`http://localhost:3001${post.image_url}`}
            alt={post.caption}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Post details sectie */}
        <div className="md:w-1/3 border-l-2 border-gray-200">
          {/* Interactie knoppen (like en commentaar) */}
          <div className="p-4 border-b-2 border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onLike(post.id)}
                className="text-2xl hover:opacity-70 transition-opacity"
              >
                {post.is_liked ? '❤️' : '🤍'}
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="text-2xl hover:opacity-70 transition-opacity"
              >
                💬
              </button>
            </div>

            {/* Like teller */}
            <div className="font-semibold mt-2">
              {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
            </div>
          </div>

          {/* Post caption */}
          <div className="p-4 border-b-2 border-gray-200">
            <div className="flex items-start">
              <span className="font-semibold text-blue-600 mr-2">{post.username}:</span>
              <p className="text-gray-800">{post.caption}</p>
            </div>
          </div>

          {/* Commentaar sectie */}
          {showComments && post.comments && post.comments.length > 0 && (
            <div className="p-4 border-b-2 border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3">Reacties</h3>
              <div className="space-y-3">
                {post.comments.map(comment => (
                  <div key={comment.id} className="border-2 border-gray-200 rounded-lg p-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-blue-600 border-b-2 border-gray-200 pb-1">{comment.username}</span>
                      <p className="mt-2 text-gray-800">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commentaar formulier */}
          <form onSubmit={handleSubmitComment} className="p-4">
            <div className="flex items-center">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Voeg een reactie toe..."
                className="flex-1 border-2 border-gray-200 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 border-2 border-blue-500"
              >
                Plaatsen
              </button>
            </div>
          </form>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 p-4 border-t-2 border-gray-200">
            {formatDate(post.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post; 