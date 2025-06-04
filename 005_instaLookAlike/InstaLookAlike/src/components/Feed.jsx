/**
 * Feed Component
 * 
 * Deze component toont een feed van posts van gebruikers.
 * Het haalt posts op van de backend en toont ze in chronologische volgorde.
 * 
 * Functionaliteiten:
 * 1. Ophalen en weergave van posts
 * 2. Like/unlike functionaliteit
 * 3. Commentaar toevoegen
 * 4. Laadstatus en foutafhandeling
 * 5. Lege state weergave
 */

import { useState, useEffect } from 'react';
import Post from './Post';

function Feed({ user }) {
  // State management voor posts en laadstatus
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Effect hook voor het ophalen van posts
   * Wordt uitgevoerd bij het laden van de component
   */
  useEffect(() => {
    fetchPosts();
  }, []);

  /**
   * Functie voor het ophalen van posts van de backend
   * Maakt gebruik van JWT authenticatie voor de API call
   */
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/posts', {
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
        <div className="text-xl text-gray-600">Posts laden...</div>
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

  // Lege state weergave
  if (posts.length === 0) {
    return (
      <div className="text-center text-gray-600 mt-8">
        <p className="text-xl">Nog geen posts beschikbaar</p>
        <p className="mt-2">Wees de eerste om een post te maken!</p>
      </div>
    );
  }

  return (
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
  );
}

export default Feed;
