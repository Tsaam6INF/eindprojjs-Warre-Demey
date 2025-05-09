import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreatePost({ user }) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    setImage(e.target.files[0]); // Slaat het geselecteerde bestand op
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      alert("Je moet ingelogd zijn om een post te maken.");
      return;
    }
  
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("caption", caption);
    formData.append("image", image);
  
    fetch("http://localhost:3001/api/posts", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        // Controleer of de server een id en andere gegevens heeft teruggestuurd
        if (data.id) {
          navigate("/"); // Navigeer naar feed als de post succesvol is
        } else {
          alert("Fout bij het maken van de post.");
        }
      })
      .catch((error) => {
        console.error("Fout bij het versturen van de post:", error);
        alert("Er is iets misgegaan bij het versturen van de post.");
      });
  };
  

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Nieuwe post maken</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border p-2"
        />
        <textarea
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full border p-2"
        />
        <button
          type="submit"
          className="bg-pink-500 text-white px-4 py-2 rounded"
        >
          Posten
        </button>
      </form>
    </div>
  );
}

export default CreatePost;
