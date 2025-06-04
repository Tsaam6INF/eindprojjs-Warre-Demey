/**
 * Profile Component
 * 
 * Deze component toont het profiel van een gebruiker en hun posts.
 * Het bevat gebruikersinformatie, statistieken en een feed van hun posts.
 * 
 * Functionaliteiten:
 * 1. Weergave van gebruikersprofiel informatie
 * 2. Statistieken (posts, volgers, volgend)
 * 3. Feed van gebruikersposts
 * 4. Interactie met posts (likes, comments)
 * 5. Laadstatus en foutafhandeling
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Post from './Post';

function Profile({ user }) {
  // URL parameters en state management
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Effect hook voor het laden van profiel en posts
   * Wordt uitgevoerd wanneer de userId parameter verandert
   */
  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [userId]);

  /**
   * Functie voor het ophalen van profielinformatie
   * Maakt gebruik van JWT authenticatie voor de API call
   */
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Er is iets misgegaan bij het ophalen van het profiel');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Functie voor het ophalen van gebruikersposts
   * Maakt gebruik van JWT authenticatie voor de API call
   */
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/users/${userId}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Er is iets misgegaan bij het ophalen van de posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler voor het liken/unliken van een post
   * Herlaadt de posts na de actie
   * 
   * @param {number} postId - ID van de post die geliked/unliked wordt
   */
  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) {
        throw new Error('Er is iets misgegaan bij het liken van de post');
      }

      // Update de posts na het liken
      fetchPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Handler voor het toevoegen van een commentaar
   * Herlaadt de posts na het toevoegen van een commentaar
   * 
   * @param {number} postId - ID van de post
   * @param {string} content - Inhoud van het commentaar
   */
  const handleComment = async (postId, content) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          content
        })
      });

      if (!response.ok) {
        throw new Error('Er is iets misgegaan bij het plaatsen van de reactie');
      }

      // Update de posts na het plaatsen van een reactie
      fetchPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  // Laadstatus weergave
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Profiel laden...</div>
      </div>
    );
  }

  // Foutmelding weergave
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  // Profiel niet gevonden weergave
  if (!profile) {
    return (
      <div className="text-center text-gray-600 mt-8">
        <p className="text-xl">Profiel niet gevonden</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profiel header met gebruikersinformatie en statistieken */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <div className="ml-6">
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <div className="flex space-x-6 mt-2">
              <div>
                <span className="font-semibold">{profile.post_count}</span> posts
              </div>
              <div>
                <span className="font-semibold">{profile.followers_count}</span> volgers
              </div>
              <div>
                <span className="font-semibold">{profile.following_count}</span> volgend
              </div>
            </div>
            {profile.bio && (
              <p className="mt-2 text-gray-600">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Posts feed */}
      {posts.length === 0 ? (
        <div className="text-center text-gray-600 mt-8">
          <p className="text-xl">Geen posts gevonden</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map(post => (
            <Post
              key={post.id}
              post={post}
              currentUser={user}
              onLike={() => handleLike(post.id)}
              onComment={handleComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile; 