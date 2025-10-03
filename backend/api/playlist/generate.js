// Load environment variables FIRST
import 'dotenv/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, spotifyAccessToken, userId } = req.body;

    if (!prompt || !spotifyAccessToken || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Please provide prompt, spotifyAccessToken, and userId' 
      });
    }

    console.log('🎯 Generating playlist for prompt:', prompt);

    // Step 1: Analyze prompt with Claude to get search queries
    console.log('🤖 Asking Claude for search strategy...');
    const searchStrategy = await getSearchQueriesFromClaude(prompt);
    
    console.log('📝 Playlist name:', searchStrategy.playlistName);
    console.log('🔍 Search queries:', searchStrategy.queries);

    // Step 2: Search Spotify directly with those queries
    console.log('🎵 Searching Spotify...');
    const foundTracks = await searchSpotifyWithQueries(searchStrategy.queries, spotifyAccessToken);

    console.log(`✅ Found ${foundTracks.length} tracks`);

    if (foundTracks.length === 0) {
      return res.status(400).json({
        error: 'No tracks found on Spotify',
        message: 'Try a different prompt or be more specific'
      });
    }

    // Step 3: Create playlist
    console.log('🎵 Creating playlist...');
    
    // Get user's Spotify ID first
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${spotifyAccessToken}` }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const userData = await userResponse.json();
    const spotifyUserId = userData.id;
    
    console.log(`👤 Creating playlist for user: ${spotifyUserId}`);
    
    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${spotifyAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: searchStrategy.playlistName,
        description: 'Created by AI',
        public: false
      })
    });

    if (!createPlaylistResponse.ok) {
      const errorData = await createPlaylistResponse.json();
      console.error('❌ Spotify error details:', JSON.stringify(errorData, null, 2));
      console.error('Request was to:', `https://api.spotify.com/v1/users/${spotifyUserId}/playlists`);
      console.error('Request body:', JSON.stringify({
        name: 'AI Playlist',
        description: 'Created by AI',
        public: false
      }));
      throw new Error(`Failed to create playlist: ${errorData.error?.message || createPlaylistResponse.status}`);
    }

    const playlist = await createPlaylistResponse.json();

    // Step 4: Add tracks
    const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${spotifyAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: foundTracks.map(t => t.uri)
      })
    });

    if (!addTracksResponse.ok) {
      throw new Error('Failed to add tracks');
    }

    console.log(`✅ Done - ${foundTracks.length} tracks added`);

    return res.status(200).json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        url: playlist.external_urls.spotify,
        trackCount: foundTracks.length
      },
      tracks: foundTracks.map(t => ({
        name: t.name,
        artist: t.artist
      }))
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      error: 'Failed to generate playlist',
      message: error.message
    });
  }
}

// Ask Claude to create Spotify search queries (NO WEB SEARCH)
async function getSearchQueriesFromClaude(prompt) {
  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `User wants: "${prompt}"

Create:
1. A creative playlist name (short, catchy, relevant to the mood - can be in Hebrew or English)
2. 3-5 Spotify search queries to find relevant songs

Examples of good queries:
- "שירים עצובים" (for Hebrew sad songs)
- "breakup songs" (for English breakup songs)  
- "עדן בן זקן" (specific Hebrew artist)
- "sad love songs" (mood-based)

Respond with ONLY this JSON format:
{
  "playlistName": "playlist name here",
  "queries": ["query1", "query2", "query3"]
}

No other text.`
      }]
    })
  });

  if (!claudeResponse.ok) {
    throw new Error('Claude API failed');
  }

  const data = await claudeResponse.json();
  const text = data.content[0].text;
  
  // Parse JSON from response
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    const result = JSON.parse(match[0]);
    return {
      playlistName: result.playlistName || 'AI Playlist',
      queries: result.queries || ["sad songs", "breakup songs"]
    };
  }
  
  return {
    playlistName: 'AI Playlist',
    queries: ["sad songs", "breakup songs"]
  };
}

// Search Spotify with multiple queries
async function searchSpotifyWithQueries(queries, spotifyAccessToken) {
  const foundTracks = [];
  const seenUris = new Set();

  for (const query of queries) {
    console.log(`🔍 Searching Spotify for: "${query}"`);
    
    try {
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
      
      const response = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.tracks?.items) {
          // Take top 5 tracks from each query
          for (const track of data.tracks.items.slice(0, 5)) {
            if (!seenUris.has(track.uri)) {
              foundTracks.push({
                id: track.id,
                uri: track.uri,
                name: track.name,
                artist: track.artists[0]?.name
              });
              seenUris.add(track.uri);
              console.log(`  ✅ Added: ${track.name} - ${track.artists[0]?.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Error searching "${query}":`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Limit to 20 tracks max
  return foundTracks.slice(0, 20);
}