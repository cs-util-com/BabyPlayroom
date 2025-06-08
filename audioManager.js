// Manages audio loading and playback for Baby Playroom

class AudioManager {
    constructor(animalData, initialVolume = 0.5) {
        this.animalData = animalData;
        this.volume = initialVolume;
        this.soundCache = new Map();
        this.soundLoading = new Set(); // Track which sounds are currently being loaded
        this.soundsEnabled = true; // Allow disabling sounds if API fails

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
            // Check if Openverse client is available
            if (!window.openverseClient) {
                console.warn('Openverse client not available, sounds will be disabled');
                this.soundsEnabled = false;
                return;
            }

            console.log('Initializing sounds with Openverse API...');

            // Load sounds for each animal in the background
            for (const animal of this.animalData) {
                this.loadAnimalSounds(animal); // No await here, let them load in parallel
            }
        } catch (error) {
            console.error('Error initializing sounds:', error);
            this.soundsEnabled = false;
        }
    }

    async loadAnimalSounds(animalData) {
        if (!this.soundsEnabled) return;
        try {
            // Load appear sound (first search term)
            const appearKey = `${animalData.name}_appear`;
            if (!this.soundCache.has(appearKey) && !this.soundLoading.has(appearKey)) {
                this.soundLoading.add(appearKey);
                // Intentionally not awaiting here to allow parallel fetching
                this.searchAndLoadSound(animalData.searchTerms[0], appearKey)
                    .catch(err => console.error(`Failed to load appear sound for ${animalData.name}:`, err))
                    .finally(() => this.soundLoading.delete(appearKey));
            }

            // Load tap sound (second search term if available, otherwise first)
            const tapKey = `${animalData.name}_tap`;
            if (!this.soundCache.has(tapKey) && !this.soundLoading.has(tapKey)) {
                this.soundLoading.add(tapKey);
                const searchTerm = animalData.searchTerms[1] || animalData.searchTerms[0];
                // Intentionally not awaiting here to allow parallel fetching
                this.searchAndLoadSound(searchTerm, tapKey)
                    .catch(err => console.error(`Failed to load tap sound for ${animalData.name}:`, err))
                    .finally(() => this.soundLoading.delete(tapKey));
            }
        } catch (error) {
            console.error(`Error loading sounds for ${animalData.name}:`, error);
        }
    }

    async searchAndLoadSound(searchTerm, cacheKey) {
        if (!this.soundsEnabled) {
            console.log(`Skipping sound search for "${searchTerm}" - sounds disabled.`);
            this.soundLoading.delete(cacheKey); // Ensure loading flag is cleared
            return;
        }
        try {
            if (!window.openverseClient) {
                console.log(`Skipping sound search for "${searchTerm}" - Openverse client not available`);
                this.soundLoading.delete(cacheKey);
                return;
            }

            console.log(`Searching for sound: "${searchTerm}", client type:`, typeof window.openverseClient);

            let response;
            const apiClient = window.openverseClient;
            const commonQueryParams = {
                q: searchTerm,
                category: "sound_effect",
                extension: "mp3",
                mature: false,
                page_size: 5
            };

            if (typeof apiClient === "function") {
                const options = { params: commonQueryParams };
                console.log("Calling apiClient (function style) with path 'GET v1/audio/' and options:", JSON.stringify(options, null, 2));
                response = await apiClient("GET v1/audio/", options);
            } else if (apiClient && typeof apiClient.GET === "function") {
                const options = { params: { query: commonQueryParams } };
                console.log("Calling apiClient.GET (object style) with path '/v1/audio/' and options:", JSON.stringify(options, null, 2));
                response = await apiClient.GET("/v1/audio/", options);
            } else {
                console.error("Openverse client (window.openverseClient) is not configured correctly or is unavailable.", apiClient);
                this.soundLoading.delete(cacheKey);
                return;
            }

            console.log(`API response for "${searchTerm}":`, response);

            if (response.error) {
                console.warn(`API error searching for "${searchTerm}":`, response.error);
                this.soundLoading.delete(cacheKey);
                return;
            }

            if (response.data && response.data.results && response.data.results.length > 0) {
                let soundLoaded = false;
                for (const result of response.data.results.slice(0, 3)) {
                    try {
                        const audioUrl = result.download_url || result.url;
                        if (!audioUrl) {
                            console.warn(`No valid URL found for result:`, result);
                            continue;
                        }
                        await this.loadSoundFromUrl(audioUrl, cacheKey);
                        console.log(`Loaded sound for ${cacheKey} from ${audioUrl}`);
                        soundLoaded = true;
                        break; 
                    } catch (error) {
                        console.warn(`Failed to load sound from ${result.url || result.download_url}:`, error);
                        continue;
                    }
                }
                if (!soundLoaded) {
                     console.warn(`All attempts to load sound for "${searchTerm}" failed.`);
                }
            } else {
                console.warn(`No sound results found for "${searchTerm}"`);
            }
        } catch (error) {
            console.error(`Error searching for sound "${searchTerm}":`, error);
        } finally {
            this.soundLoading.delete(cacheKey);
        }
    }

    async loadSoundFromUrl(url, cacheKey) {
        if (!this.soundsEnabled) {
            return Promise.reject(new Error("Sounds are disabled."));
        }
        return new Promise((resolve, reject) => {
            if (this.soundCache.has(cacheKey)) {
                resolve(this.soundCache.get(cacheKey));
                return;
            }

            const sound = new Howl({
                src: [url],
                volume: this.volume,
                format: ['mp3', 'wav', 'ogg'],
                html5: true,
                onload: () => {
                    this.soundCache.set(cacheKey, sound);
                    resolve(sound);
                },
                onloaderror: (id, error) => {
                    console.error(`Howler.js failed to load sound from ${url}:`, error);
                    reject(new Error(`Failed to load sound from ${url}: ${error}`));
                }
            });
        });
    }

    playSound(soundKey) {
        if (!this.soundsEnabled) {
            return;
        }

        const sound = this.soundCache.get(soundKey);
        if (sound) {
            sound.volume(this.volume); // Ensure current volume is applied
            sound.play();
        } else {
            const animalName = soundKey.split('_')[0];
            const animalData = this.animalData.find(a => a.name === animalName);
            if (animalData && !this.soundLoading.has(soundKey)) {
                console.log(`Sound ${soundKey} not ready, attempting to load on demand...`);
                // Intentionally not awaiting, fire and forget for on-demand
                this.loadAnimalSounds(animalData).catch(err => {
                    console.error(`On-demand load failed for ${soundKey}:`, err);
                });
            } else if (this.soundLoading.has(soundKey)) {
                console.log(`Sound ${soundKey} is currently loading.`);
            } else {
                console.warn(`Sound ${soundKey} not found and no animal data to load it.`);
            }
        }
    }

    setVolume(volumeLevel) { // volumeLevel is 0-1
        this.volume = volumeLevel;
        if (this.soundsEnabled && typeof Howler !== 'undefined') {
            Howler.volume(this.volume);
        }
        // Update volume for already cached sounds
        this.soundCache.forEach(sound => {
            sound.volume(this.volume);
        });
    }
}

// Export the class if using modules, otherwise it's globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
