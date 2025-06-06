/**
 * Home Component
 * 
 * Dit is de hoofdweergave van de applicatie die de feed van posts toont.
 * De component beheert het ophalen en weergeven van posts, evenals interacties zoals likes en comments.
 * 
 * Functionaliteiten:
 * 1. Ophalen en weergeven van posts
 * 2. Like/unlike functionaliteit
 * 3. Commentaar toevoegen
 * 4. Laadstatus en foutafhandeling
 */

import { useState, useEffect } from 'react';
import Post from './Post';

function Home({ user }) {
  // State management voor posts, laadstatus en fouten
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Effect hook voor het ophalen van posts bij het laden van de component
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
   * Update de UI optimistisch en synchroniseert met de backend
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
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Er is iets misgegaan bij het liken van de post');
      }

      const data = await response.json();

      // Update de posts lokaal voor snelle UI feedback
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: data.action === 'liked',
            like_count: data.action === 'liked' ? post.like_count + 1 : post.like_count - 1
          };
        }
        return post;
      }));
    } catch (err) {
      setError(err.message);
      console.error('Like fout:', err);
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
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Er is iets misgegaan bij het plaatsen van de reactie');
      }

      const newComment = await response.json();

      // Update de posts lokaal voor snelle UI feedback
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), newComment],
            comment_count: (post.comment_count || 0) + 1
          };
        }
        return post;
      }));
    } catch (err) {
      setError(err.message);
      console.error('Commentaar fout:', err);
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

  // Hoofdweergave van de feed
  return (
    <div className="max-w-2xl mx-auto">
      {posts.length === 0 ? (
        // Weergave voor wanneer er geen posts zijn
        <div className="text-center text-gray-600 mt-8">
          <p className="text-xl">Er zijn nog geen posts</p>
          <p className="mt-2">Wees de eerste om een post te maken!</p>
        </div>
      ) : (
        // Weergave van de post feed
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

export default Home; 