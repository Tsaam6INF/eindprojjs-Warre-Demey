import { useEffect, useState } from "react";

function Profile({ user }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:3001/api/posts`)
        .then(res => res.json())
        .then(data => {
          // Filter enkel de posts van de ingelogde gebruiker
          const userPosts = data.filter(post => post.user_id === user.id);
          setPosts(userPosts);
        });
    }
  }, [user]);

  if (!user) return <p>Log in om je profiel te zien.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Profiel van {user.username}</h2>
      {posts.length === 0 && <p>Je hebt nog geen posts.</p>}
      {posts.map(post => (
        <div key={post.id} className="mb-4 border-b pb-2">
          <p className="font-semibold">{post.caption}</p>
          {post.image_url && (
            <img src={post.image_url} alt="Post" className="w-64 h-auto" />
          )}
          <p className="text-sm text-gray-500">
            Gemaakt op:{" "}
            {post.created_at
              ? new Date(post.created_at.replace(" ", "T") + "Z").toLocaleString()
              : "onbekend"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Profile;
