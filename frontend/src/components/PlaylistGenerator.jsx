import { useState } from "react";
import { authAPI } from "../services/api";
import "./PlaylistGenerator.css";

function PlaylistGenerator() {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState(null);
  const [progressMessage, setProgressMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPlaylist(null);
    setProgressMessage("Starting...");

    try {
      // Get auth data first
      const authData = await authAPI.checkAuth();
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Start generation
      const startResponse = await fetch(`${API_URL}/api/playlist/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: description,
          spotifyAccessToken: authData.spotifyAccessToken,
          userId: authData.userId
        })
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start generation');
      }

      const { requestId } = await startResponse.json();
      console.log('Request ID:', requestId);

      // Poll for progress
      let lastMessageIndex = 0;
      const pollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(`${API_URL}/api/playlist/progress?requestId=${requestId}`, {
            credentials: 'include'
          });

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            
            // Show new messages
            if (progressData.messages && progressData.messages.length > lastMessageIndex) {
              const latestMessage = progressData.messages[progressData.messages.length - 1];
              setProgressMessage(latestMessage);
              lastMessageIndex = progressData.messages.length;
            }

            // Check if complete
            if (progressData.status === 'complete') {
              clearInterval(pollInterval);
              setPlaylist(progressData.result.playlist);
              setIsGenerating(false);
            } else if (progressData.status === 'error') {
              clearInterval(pollInterval);
              setError(progressData.error || 'Generation failed');
              setIsGenerating(false);
            }
          }
        } catch (pollError) {
          console.error('Poll error:', pollError);
        }
      }, 500); // Poll every 500ms

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setError('Generation timed out');
          setIsGenerating(false);
        }
      }, 120000);

    } catch (err) {
      console.error("Generation failed:", err);
      setError(err.message || "Failed to generate playlist. Please try again.");
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setDescription("");
    setPlaylist(null);
    setError(null);
    setProgressMessage("");
  };

  return (
    <div className="playlist-generator">
      <div className="generator-header">
        <h2>🎵 Generate Your Playlist</h2>
        <p className="generator-subtitle">
          Describe the mood, genre, or feeling you want, and AI will create the perfect playlist for you
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

        {isGenerating && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-bar-fill"></div>
            </div>
            <p className="progress-message">{progressMessage}</p>
          </div>
        )}

        <div className="form-actions">
          {!playlist ? (
            <button type="submit" disabled={isGenerating} className="generate-button">
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
            <button type="button" onClick={handleReset} className="reset-button">
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
            <p className="playlist-count">{playlist.trackCount} songs added</p>
            <a href={playlist.url} target="_blank" rel="noopener noreferrer" className="spotify-link">
              🎧 Open in Spotify
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistGenerator;