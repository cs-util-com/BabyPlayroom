// Manages audio loading and playback for Baby Playroom

class AudioManager {
    constructor(animalData, initialVolume = 0.5) {
        this.animalData = animalData;
        this.volume = initialVolume;
        this.soundCache = new Map();
        this.soundLoading = new Set(); // Track which sounds are currently being loaded
        this.soundsEnabled = true; // Allow disabling sounds if API fails
        this.openverseClientInstance = null; // Initialize Openverse client instance

        // Ensure Howler is available
        if (typeof Howl === 'undefined' || typeof Howler === 'undefined') {
            console.warn('Howler.js not found. Sounds will be disabled.');
            this.soundsEnabled = false;
        } else {
            Howler.volume(this.volume);
        }
    }

    async initializeSounds() {
        if (!this.soundsEnabled) {
            console.log('Sounds are disabled, skipping initialization.');
            return;
        }
        try {
            // Detailed logging for OpenverseApiClient
            console.log('AUDIO_MANAGER_LOG: In initializeSounds, attempting to get OpenverseApiClient.');
            console.log('AUDIO_MANAGER_LOG: typeof window.OpenverseApiClient:', typeof window.OpenverseApiClient);
            if (window.OpenverseApiClient) {
                console.log('AUDIO_MANAGER_LOG: window.OpenverseApiClient.toString():', String(window.OpenverseApiClient).slice(0, 250));
                if (typeof window.OpenverseApiClient.OpenverseClient === 'function') {
                    console.log('AUDIO_MANAGER_LOG: typeof window.OpenverseApiClient.OpenverseClient:', typeof window.OpenverseApiClient.OpenverseClient);
                    console.log('AUDIO_MANAGER_LOG: window.OpenverseApiClient.OpenverseClient.toString():', String(window.OpenverseApiClient.OpenverseClient).slice(0, 250));
                } else {
                    console.log('AUDIO_MANAGER_LOG: window.OpenverseApiClient.OpenverseClient is not a function.');
                }
            } else {
                console.log('AUDIO_MANAGER_LOG: window.OpenverseApiClient is null or undefined.');
            }

            // Check if Openverse API client constructor is available
            if (typeof window.OpenverseApiClient !== 'function' && (typeof window.OpenverseApiClient !== 'object' || typeof window.OpenverseApiClient?.OpenverseClient !== 'function')) {
                console.warn('AUDIO_MANAGER_LOG_WARN: Openverse API client constructor (window.OpenverseApiClient or window.OpenverseApiClient.OpenverseClient) not available. Sounds will be disabled.');
                this.soundsEnabled = false;
                return;
            }

            console.log('AUDIO_MANAGER_LOG: Proceeding to instantiation block.');
            try {
                let ClientConstructor = null;
                if (typeof window.OpenverseApiClient === 'function') {
                    ClientConstructor = window.OpenverseApiClient;
                    console.log('AUDIO_MANAGER_LOG: Using window.OpenverseApiClient directly as constructor.');
                } else if (window.OpenverseApiClient && typeof window.OpenverseApiClient.OpenverseClient === 'function') {
                    // This path is taken if the test environment didn't hoist .OpenverseClient
                    ClientConstructor = window.OpenverseApiClient.OpenverseClient;
                    console.log('AUDIO_MANAGER_LOG: Using window.OpenverseApiClient.OpenverseClient as constructor.');
                }

                if (ClientConstructor) {
                    console.log('AUDIO_MANAGER_LOG: Final ClientConstructor type:', typeof ClientConstructor);
                    console.log('AUDIO_MANAGER_LOG: Final ClientConstructor.toString():', String(ClientConstructor).slice(0,250));
                    this.openverseClientInstance = new ClientConstructor();
                    console.log('AUDIO_MANAGER_LOG: Openverse API client instantiated successfully.');
                } else {
                    console.error('AUDIO_MANAGER_LOG_ERROR: No valid Openverse API client constructor found after checks.');
                    throw new Error("OpenverseApiClient constructor could not be resolved.");
                }
            } catch (instantiationError) {
                console.error('AUDIO_MANAGER_LOG_ERROR: Failed to instantiate Openverse API client:', instantiationError);
                console.error('AUDIO_MANAGER_LOG_ERROR: ClientConstructor was:', ClientConstructor ? String(ClientConstructor).slice(0,250) : 'null');
                this.soundsEnabled = false;
                return;
            }

            // console.log('Post-instantiation: this.openverseClientInstance is:', this.openverseClientInstance);
            // if (this.openverseClientInstance) {
            //     console.log('Post-instantiation: typeof this.openverseClientInstance.audio is:', typeof this.openverseClientInstance.audio);
            //     if (this.openverseClientInstance.audio) {
            //         console.log('Post-instantiation: typeof this.openverseClientInstance.audio.search is:', typeof this.openverseClientInstance.audio.search);
            //     } else {
            //         console.log('Post-instantiation: this.openverseClientInstance.audio is falsy.');
            //     }
            // } else {
            //     console.log('Post-instantiation: this.openverseClientInstance is falsy.');
            // }


            if (!this.openverseClientInstance || typeof this.openverseClientInstance.audio?.search !== 'function') {
                console.error("AUDIO_MANAGER_CLIENT_VALIDATION_FAILURE: Openverse API client instance is not valid or does not have audio.search method.");
                console.error('Failure Details:');
                console.error('  - this.openverseClientInstance exists:', !!this.openverseClientInstance);
                if (this.openverseClientInstance) {
                    console.error('  - typeof this.openverseClientInstance.audio:', typeof this.openverseClientInstance.audio);
                    console.error('  - typeof this.openverseClientInstance.audio?.search:', typeof this.openverseClientInstance.audio?.search);
                    console.error('  - Instance keys:', Object.keys(this.openverseClientInstance));
                    if (this.openverseClientInstance.audio) {
                        console.error('  - Instance.audio keys:', Object.keys(this.openverseClientInstance.audio));
                    } else {
                        console.error('  - this.openverseClientInstance.audio is null or undefined.');
                    }
                }
                this.soundsEnabled = false;
                this.openverseClientInstance = null; // Clear invalid instance
                return;
            }

            console.log('Successfully initialized and validated Openverse API client instance.');
            console.log('Initializing sounds with Openverse API...');

            // Load sounds for each animal in the background
            for (const animal of this.animalData) {
                this.loadAnimalSounds(animal); // No await here, let them load in parallel
            }
        } catch (error) { // Catch errors from the overall initialization logic
            console.error('Error initializing sounds manager:', error);
            this.soundsEnabled = false;
        }
    }

    async loadAnimalSounds(animalData) {
        if (!this.soundsEnabled) {
            // console.log(`Sounds disabled, skipping sound load for ${animalData.name}`);
            return;
        }
        if (!this.openverseClientInstance) {
            console.warn(`Openverse client not initialized, skipping sound load for ${animalData.name}`);
            return;
        }

        try {
            // Load appear sound (first search term)
            const appearKey = `${animalData.name}_appear`;
            if (!this.soundCache.has(appearKey) && !this.soundLoading.has(appearKey)) {
                this.soundLoading.add(appearKey);
                // Intentionally not awaiting here to allow parallel fetching
                this.searchAndLoadSound(animalData.searchTerms[0], appearKey)
                    .catch(err => console.error(`Failed to load appear sound for ${animalData.name} (term: ${animalData.searchTerms[0]}):`, err.message || err))
                    .finally(() => this.soundLoading.delete(appearKey));
            }

            // Load tap sound (second search term if available, otherwise first)
            const tapKey = `${animalData.name}_tap`;
            if (!this.soundCache.has(tapKey) && !this.soundLoading.has(tapKey)) {
                this.soundLoading.add(tapKey);
                const searchTerm = animalData.searchTerms[1] || animalData.searchTerms[0];
                // Intentionally not awaiting here to allow parallel fetching
                this.searchAndLoadSound(searchTerm, tapKey)
                    .catch(err => console.error(`Failed to load tap sound for ${animalData.name} (term: ${searchTerm}):`, err.message || err))
                    .finally(() => this.soundLoading.delete(tapKey));
            }
        } catch (error) {
            console.error(`Error queueing sound loading for ${animalData.name}:`, error.message || error);
        }
    }

    async searchAndLoadSound(searchTerm, cacheKey) {
        if (!this.soundsEnabled) {
            // console.log(`Skipping sound search for "${searchTerm}" - sounds disabled.`);
            this.soundLoading.delete(cacheKey); // Ensure loading flag is cleared
            return;
        }
        if (!this.openverseClientInstance) {
            console.warn(`Skipping sound search for "${searchTerm}" - Openverse client instance not available.`);
            this.soundLoading.delete(cacheKey);
            return;
        }

        try {
            console.log(`Searching Openverse for sound: "${searchTerm}" (cacheKey: ${cacheKey})`);

            const searchParams = {
                q: searchTerm,
                extension: "mp3,wav,ogg,aac,m4a,opus", // Request common audio formats
                mature: "false", // API expects string 'false' or 'true'
                page_size: 5, // Get a few options
                unstable__include_sensitive_results: "false", // Explicitly exclude sensitive results if API supports
            };

            // console.log("Calling Openverse API client audio.search with params:", JSON.stringify(searchParams, null, 2));
            const response = await this.openverseClientInstance.audio.search(searchParams);
            // Expected response structure: { result_count: N, page_count: M, results: [...] }

            // console.log(`Raw API response for "${searchTerm}":`, response);

            if (response && response.results && response.results.length > 0) {
                let soundLoaded = false;

                // Sort results: prefer download_url, then mp3, then any audio URL
                const sortedResults = response.results.sort((a, b) => {
                    const aHasDL = !!a.download_url;
                    const bHasDL = !!b.download_url;
                    if (aHasDL && !bHasDL) return -1;
                    if (!aHasDL && bHasDL) return 1;

                    const aIsMp3 = a.filetype === 'mp3';
                    const bIsMp3 = b.filetype === 'mp3';
                    if (aIsMp3 && !bIsMp3) return -1;
                    if (!aIsMp3 && bIsMp3) return 1;
                    
                    return 0;
                });

                for (const result of sortedResults.slice(0, 3)) { // Try top 3 relevant results
                    try {
                        const audioUrl = result.download_url || result.url;
                        if (!audioUrl) {
                            console.warn(`No valid URL (download_url or url) for result: ${result.title || result.id} (searchTerm: "${searchTerm}")`);
                            continue;
                        }

                        const lowerAudioUrl = audioUrl.toLowerCase();
                        const validExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.opus'];
                        const hasValidExtension = validExtensions.some(ext => lowerAudioUrl.includes(ext));
                        const isConfirmedAudioType = result.filetype && validExtensions.some(ext => ext.substring(1) === result.filetype.toLowerCase());

                        if (!hasValidExtension && !isConfirmedAudioType) {
                            console.warn(`Skipping URL for result ${result.title || result.id} (searchTerm: "${searchTerm}") as it does not appear to be a direct audio link and filetype (${result.filetype}) is not confirmatory: ${audioUrl}`);
                            continue;
                        }

                        await this.loadSoundFromUrl(audioUrl, cacheKey);
                        console.log(`SUCCESS: Loaded sound for ${cacheKey} (searchTerm: "${searchTerm}") from ${audioUrl} (Title: ${result.title || 'N/A'})`);
                        soundLoaded = true;
                        break; 
                    } catch (loadError) {
                        console.warn(`Failed to load sound from ${result.download_url || result.url} (Title: ${result.title || 'N/A'}, searchTerm: "${searchTerm}"):`, loadError.message || loadError);
                    }
                }
                if (!soundLoaded) {
                     console.warn(`All attempts to load sound for "${searchTerm}" failed from ${response.results.length} results.`);
                }
            } else {
                let message = `No sound results found for "${searchTerm}".`;
                if (response && response.error_type) {
                    message = `API Error for "${searchTerm}": ${response.error_type} - ${response.detail}.`;
                } else if (response && typeof response.message === 'string' && response.message) {
                    message = `API Error for "${searchTerm}": ${response.message}.`;
                } else if (response && response.results && response.results.length === 0) {
                    message = `No sound results found for "${searchTerm}" (0 items returned).`;
                }
                console.warn(message, 'Full response was:', response);
            }
        } catch (error) {
            console.error(`Critical error in searchAndLoadSound for "${searchTerm}":`, error.message || error, error);
            if (error.response && error.response.data) {
                console.error("Underlying API error details:", error.response.data);
            }
        } finally {
            this.soundLoading.delete(cacheKey);
        }
    }

    async loadSoundFromUrl(url, cacheKey) {
        if (!this.soundsEnabled) {
            return Promise.reject(new Error("Sounds are disabled."));
        }
        return new Promise((resolve, reject) => {
            if (this.soundCache.has(cacheKey)) { // Fixed: removed extra ')'
                // console.log(`Sound ${cacheKey} already in cache from ${url}`);
                resolve(this.soundCache.get(cacheKey));
                return;
            }

            // console.log(`Howler attempting to load: ${url} for ${cacheKey}`);
            const sound = new Howl({
                src: [url],
                volume: this.volume,
                format: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'flac', 'webm', 'oga'], // Expanded common formats
                html5: true, // Crucial for broader URL/CORS/format support
                onload: () => {
                    this.soundCache.set(cacheKey, sound);
                    // console.log(`Howler successfully loaded: ${url} for ${cacheKey}`);
                    resolve(sound);
                },
                onloaderror: (id, error) => {
                    console.error(`Howler.js failed to load sound from ${url} (cacheKey: ${cacheKey}):`, error, `Sound ID: ${id}`);
                    reject(new Error(`Howler: Failed to load sound from ${url}: ${error}`));
                }
            });
        });
    }

    playSound(soundKey) {
        if (!this.soundsEnabled) {
            // console.log(`Skipping playSound for ${soundKey} - sounds disabled.`);
            return;
        }

        const sound = this.soundCache.get(soundKey);
        if (sound) {
            sound.volume(this.volume);
            sound.play();
        } else {
            const animalName = soundKey.split('_')[0];
            const animalDataEntry = this.animalData.find(a => a.name === animalName);
            if (animalDataEntry && !this.soundLoading.has(soundKey)) {
                console.log(`Sound ${soundKey} not ready, attempting to load on demand...`);
                this.loadAnimalSounds(animalDataEntry).catch(err => {
                    console.error(`On-demand load failed for ${soundKey}:`, err.message || err);
                });
            } else if (this.soundLoading.has(soundKey)) {
                // console.log(`Sound ${soundKey} is currently loading.`);
            } else {
                console.warn(`Sound ${soundKey} not found and no animal data to load it.`);
            }
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (typeof Howler !== 'undefined') {
            Howler.volume(this.volume);
        }
        this.soundCache.forEach(sound => {
            sound.volume(this.volume);
        });
        // console.log(`AudioManager volume set to ${this.volume}`);
    }

    getVolume() {
        return this.volume;
    }

    enableSounds(enable) {
        this.soundsEnabled = !!enable;
        console.log(`Sounds ${this.soundsEnabled ? 'enabled' : 'disabled'}.`);
        if (typeof Howler !== 'undefined') {
            Howler.mute(!this.soundsEnabled);
        }
        
        if (this.soundsEnabled && !this.openverseClientInstance) {
            console.log("Attempting to re-initialize Openverse client after enabling sounds.");
            this.initializeSounds();
        }
    }

    isSoundReady(soundKey) {
        return this.soundCache.has(soundKey);
    }

    areSoundsGloballyEnabled() {
        return this.soundsEnabled;
    }

    // Helper to wait for specific sounds to be loaded
    async waitForSounds(soundKeys, timeoutMs = 10000) {
        if (!Array.isArray(soundKeys)) {
            soundKeys = [soundKeys];
        }
        const promises = soundKeys.map(key => {
            return new Promise(async (resolve, reject) => {
                if (this.isSoundReady(key)) {
                    resolve(true);
                    return;
                }

                const animalName = key.split('_')[0];
                const animal = this.animalData.find(a => a.name === animalName);

                if (animal && !this.soundLoading.has(key) && !this.isSoundReady(key)) {
                    // console.log(`waitForSounds: Triggering load for ${key}`);
                    this.loadAnimalSounds(animal); // Fire and forget, then poll
                }

                let elapsedTime = 0;
                const pollInterval = 200;
                const intervalId = setInterval(() => {
                    elapsedTime += pollInterval;
                    if (this.isSoundReady(key)) {
                        clearInterval(intervalId);
                        resolve(true);
                    } else if (elapsedTime >= timeoutMs) {
                        clearInterval(intervalId);
                        console.warn(`waitForSounds: Timeout waiting for ${key} after ${timeoutMs}ms`);
                        reject(new Error(`Timeout waiting for sound: ${key}`));
                    }
                }, pollInterval);
            });
        });
        // Promise.allSettled might be better if you want to know which ones failed vs. Promise.all which rejects on first failure
        return Promise.all(promises);
    }
}

// Export for testing if using modules, or rely on global scope for script tag
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
