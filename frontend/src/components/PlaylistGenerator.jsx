import { useState } from "react";
import { playlistAPI } from "../services/api";
import "./PlaylistGenerator.css";

function PlaylistGenerator() {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPlaylist(null);

    try {
      console.log("Calling backend with description:", description);

      // Call the real backend API
      const response = await playlistAPI.generate(description);

      console.log("Backend response:", response);

      if (response.success) {
        setPlaylist(response.playlist);
      } else {
        setError("Failed to generate playlist");
      }
    } catch (err) {
      console.error("Generation failed:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to generate playlist. Please try again."
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setDescription("");
    setPlaylist(null);
    setError(null);
  };

  return (
    <div className="playlist-generator">
      <div className="generator-header">
        <h2>🎵 Generate Your Playlist</h2>
        <p className="generator-subtitle">
          Describe the mood, genre, or feeling you want, and AI will create the
          perfect playlist for you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-group">
          <label htmlFor="description">Describe your perfect playlist:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: I need upbeat songs for my morning workout, something energetic with electronic beats..."
            rows="5"
            disabled={isGenerating}
            className="description-input"
          />
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="form-actions">
          {!playlist ? (
            <button
              type="submit"
              disabled={isGenerating}
              className="generate-button"
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                "✨ Generate Playlist"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="reset-button"
            >
              🔄 Generate Another
            </button>
          )}
        </div>
      </form>

      {playlist && (
        <div className="playlist-result">
          <div className="result-content">
            <h3>✅ Playlist Created!</h3>
            <p className="playlist-name">{playlist.name}</p>
            <a
              href={playlist.url}
              target="_blank"
              rel="noopener noreferrer"
              className="spotify-link"
            >
              🎧 Open in Spotify
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistGenerator;
