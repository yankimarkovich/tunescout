const handler = async (req, res) => {
  console.log('🎵 Playlist generation requested');
  console.log('User:', req.user.userId);
  console.log('Description:', req.body.description);

  const { description } = req.body;

  // Validate input
  if (!description || !description.trim()) {
    return res.status(400).json({ 
      error: 'Description is required' 
    });
  }

  try {
    // TODO: Later we'll call Claude AI here
    // For now, simulate processing time and return mock data
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response
    const mockPlaylist = {
      id: 'mock_playlist_' + Date.now(),
      name: '🎧 Your AI Playlist',
      description: `Generated from: "${description.substring(0, 50)}..."`,
      url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', // Example Spotify URL
      trackCount: 25
    };

    console.log('✅ Mock playlist generated:', mockPlaylist.name);

    res.json({
      success: true,
      playlist: mockPlaylist
    });

  } catch (error) {
    console.error('❌ Playlist generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate playlist',
      message: error.message 
    });
  }
};

export default handler;