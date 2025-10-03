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

    // Step 1: Analyze prompt with Claude AI
    console.log('🤖 Analyzing prompt with Claude AI...');
    
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
          content: `You are a music recommendation expert. Analyze this user prompt and extract music preferences.

User prompt: "${prompt}"

Respond with ONLY this format (no extra text):
MOOD: [one word describing the emotional state]
ARTIST_NAMES: [any artist names mentioned, in ORIGINAL language exactly as written, comma separated, or "none"]
KEYWORDS_ENGLISH: [5-10 search keywords in English, comma separated, NOT including artist names]
KEYWORDS_NATIVE: [5-10 search keywords in the user's language if not English, comma separated, or "none" if English]
ENERGY: [number 0.0-1.0, where 0=calm and 1=energetic]
VALENCE: [number 0.0-1.0, where 0=sad and 1=happy]
TEMPO: [slow/medium/fast]
GENRES: [3-5 music genres, comma separated]

Example:
If user says "אני רוצה שירים כמו של עומר אדם" respond:
MOOD: upbeat
ARTIST_NAMES: עומר אדם
KEYWORDS_ENGLISH: pop, dance, energetic, party
KEYWORDS_NATIVE: פופ, מסיבה, אנרגטי
ENERGY: 0.8
VALENCE: 0.7
TEMPO: fast
GENRES: pop, dance, Israeli pop`
        }]
      })
    });

    if (!claudeResponse.ok) {
      throw new Error('Claude API request failed');
    }

    const claudeData = await claudeResponse.json();
    const analysis = claudeData.content[0].text;
    
    console.log('📊 Claude analysis:', analysis);

    // Parse Claude's response
    const moodMatch = analysis.match(/MOOD:\s*(.+)/i);
    const artistNamesMatch = analysis.match(/ARTIST_NAMES:\s*(.+)/i);
    const keywordsEnMatch = analysis.match(/KEYWORDS_ENGLISH:\s*(.+)/i);
    const keywordsNativeMatch = analysis.match(/KEYWORDS_NATIVE:\s*(.+)/i);
    const energyMatch = analysis.match(/ENERGY:\s*([\d.]+)/i);
    const valenceMatch = analysis.match(/VALENCE:\s*([\d.]+)/i);
    const tempoMatch = analysis.match(/TEMPO:\s*(.+)/i);
    const genresMatch = analysis.match(/GENRES:\s*(.+)/i);

    const mood = moodMatch ? moodMatch[1].trim() : 'chill';
    const artistNames = artistNamesMatch && !artistNamesMatch[1].toLowerCase().includes('none') 
      ? artistNamesMatch[1].split(',').map(k => k.trim()) 
      : [];
    const keywordsEnglish = keywordsEnMatch ? keywordsEnMatch[1].split(',').map(k => k.trim()) : [];
    const keywordsNative = keywordsNativeMatch && !keywordsNativeMatch[1].toLowerCase().includes('none') 
      ? keywordsNativeMatch[1].split(',').map(k => k.trim()) 
      : [];
    const targetEnergy = energyMatch ? parseFloat(energyMatch[1]) : 0.5;
    const targetValence = valenceMatch ? parseFloat(valenceMatch[1]) : 0.5;
    const tempo = tempoMatch ? tempoMatch[1].trim().toLowerCase() : 'medium';
    const genres = genresMatch ? genresMatch[1].split(',').map(g => g.trim()) : [];

    console.log('🎯 Extracted parameters:', {
      mood,
      artistNames,
      keywordsEnglish,
      keywordsNative,
      energy: targetEnergy,
      valence: targetValence,
      tempo,
      genres
    });

    // Step 2: Search Spotify with multiple strategies
    console.log('🔍 Searching Spotify...');
    
    const allTracks = new Set();
    const searchQueries = [];

    // Add artist name searches FIRST (highest priority)
    artistNames.slice(0, 3).forEach(artist => {
      searchQueries.push(artist);
    });

    // Add English keyword searches
    keywordsEnglish.slice(0, 5).forEach(keyword => {
      searchQueries.push(keyword);
    });

    // Add native language keyword searches
    keywordsNative.slice(0, 3).forEach(keyword => {
      searchQueries.push(keyword);
    });

    // Add genre searches
    genres.slice(0, 3).forEach(genre => {
      searchQueries.push(`genre:${genre}`);
    });

    // Execute searches
    for (const query of searchQueries) {
      try {
        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20&market=from_token`;
        
        const response = await fetch(searchUrl, {
          headers: { 'Authorization': `Bearer ${spotifyAccessToken}` }
        });

        if (response.ok) {
          const data = await response.json();
          data.tracks?.items?.forEach(track => {
            if (track.id) {
              allTracks.add(JSON.stringify({
                id: track.id,
                uri: track.uri,
                name: track.name,
                artist: track.artists[0]?.name
              }));
            }
          });
        }
      } catch (error) {
        console.error(`Search error for "${query}":`, error.message);
      }
    }

    // Convert back to objects
    const trackObjects = Array.from(allTracks).map(t => JSON.parse(t));
    console.log(`✅ Found ${trackObjects.length} unique tracks from searches`);

    if (trackObjects.length === 0) {
      return res.status(400).json({
        error: 'No tracks found',
        message: 'Try different keywords or genres'
      });
    }

    // Step 3: Get audio features and filter
    console.log('🎵 Analyzing audio features...');
    
    const trackIds = trackObjects.map(t => t.id).slice(0, 100);
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 50) {
      chunks.push(trackIds.slice(i, i + 50));
    }

    const allAudioFeatures = [];
    for (const chunk of chunks) {
      try {
        const featuresUrl = `https://api.spotify.com/v1/audio-features?ids=${chunk.join(',')}`;
        const response = await fetch(featuresUrl, {
          headers: { 'Authorization': `Bearer ${spotifyAccessToken}` }
        });

        if (response.ok) {
          const data = await response.json();
          allAudioFeatures.push(...(data.audio_features || []));
        }
      } catch (error) {
        console.error('Audio features error:', error.message);
      }
    }

    // Filter tracks by audio features
    const energyRange = [targetEnergy - 0.25, targetEnergy + 0.25];
    const valenceRange = [targetValence - 0.25, targetValence + 0.25];
    
    const tempoRanges = {
      slow: [0, 100],
      medium: [90, 130],
      fast: [120, 200]
    };
    const tempoRange = tempoRanges[tempo] || [0, 200];

    const filteredTracks = [];
    allAudioFeatures.forEach((features) => {
      if (!features) return;

      const matchingTrack = trackObjects.find(t => t.id === features.id);
      if (!matchingTrack) return;

      const energyMatch = features.energy >= energyRange[0] && features.energy <= energyRange[1];
      const valenceMatch = features.valence >= valenceRange[0] && features.valence <= valenceRange[1];
      const tempoMatch = features.tempo >= tempoRange[0] && features.tempo <= tempoRange[1];

      let score = 0;
      if (energyMatch) score += 2;
      if (valenceMatch) score += 2;
      if (tempoMatch) score += 1;

      if (score >= 1) {
        filteredTracks.push({
          ...matchingTrack,
          score,
          energy: features.energy,
          valence: features.valence,
          tempo: features.tempo
        });
      }
    });

    filteredTracks.sort((a, b) => b.score - a.score);
    
    console.log(`✅ Filtered to ${filteredTracks.length} tracks matching audio criteria`);

    if (filteredTracks.length === 0) {
      console.log('⚠️ No tracks matched filters, using unfiltered results');
      filteredTracks.push(...trackObjects.slice(0, 30).map(t => ({ ...t, score: 1 })));
    }

    const finalTracks = filteredTracks.slice(0, 30);

    // Step 4: Create playlist
    console.log('🎵 Creating Spotify playlist...');
    
    const playlistName = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes`;
    const playlistDescription = `AI playlist for ${mood} music`;

    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/me/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${spotifyAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: playlistName,
        description: playlistDescription,
        public: false
      })
    });

    console.log('Create playlist status:', createPlaylistResponse.status);

    if (!createPlaylistResponse.ok) {
      const errorText = await createPlaylistResponse.text();
      console.error('Spotify error:', errorText);
      throw new Error(`Failed to create playlist: ${createPlaylistResponse.status} - ${errorText}`);
    }

    const playlist = await createPlaylistResponse.json();
    console.log(`✅ Created playlist: ${playlist.name} (${playlist.id})`);

    // Step 5: Add tracks to playlist
    const trackUris = finalTracks.map(t => t.uri);
    
    const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${spotifyAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: trackUris
      })
    });

    if (!addTracksResponse.ok) {
      throw new Error('Failed to add tracks to playlist');
    }

    console.log(`✅ Added ${trackUris.length} tracks to playlist`);

    // Return success
    return res.status(200).json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        url: playlist.external_urls.spotify,
        trackCount: finalTracks.length
      },
      analysis: {
        mood,
        energy: targetEnergy,
        valence: targetValence,
        tempo,
        genres
      },
      tracks: finalTracks.slice(0, 10).map(t => ({
        name: t.name,
        artist: t.artist
      }))
    });

  } catch (error) {
    console.error('❌ Error generating playlist:', error);
    return res.status(500).json({
      error: 'Failed to generate playlist',
      message: error.message
    });
  }
}