import { useEffect, useState } from 'react';

function Feed() {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:3001/api/posts')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error(data.error);
        } else {
          setPosts(data);
        }
      })
      .catch((error) => {
        console.error("Fout bij het ophalen van de posts:", error);
      });
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Feed</h2>
      {posts.length === 0 ? (
        <p>Er zijn nog geen posts!</p>
      ) : (
        posts.map((post) => {
          console.log(post.image_url); // Log de URL voor elke post binnen de map

          return (
            <div key={post.id} className="border p-4 mb-4 rounded shadow">
              <p><strong>{post.username}</strong> postte:</p>
              <p>{post.caption}</p>
              {post.image_url && (
                <img
                    src={`http://localhost:3001${post.image_url}`} // Zorg ervoor dat dit pad correct is
                    alt="Post afbeelding"
                    className="w-full h-64 object-cover rounded my-2"
                />
              )}
              <p className="text-gray-500 text-sm">Gemaakt op: {new Date(post.created_at).toLocaleString()}</p>
            </div>
          );
        })
      )}
    </div>
  );
}

export default Feed;
