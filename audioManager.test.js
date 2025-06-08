const AudioManager = require('./audioManager'); // Assuming AudioManager is exported using module.exports

// Mock Howler.js
global.Howl = jest.fn(options => {
    const howlInstance = {
        play: jest.fn().mockReturnThis(),
        volume: jest.fn().mockReturnThis(),
        on: jest.fn((event, callback) => {
            if (options.onload && event === 'load') {
                process.nextTick(options.onload);
            }
            if (options.onloaderror && event === 'loaderror') {
                process.nextTick(() => options.onloaderror(123, 'Simulated load error'));
            }
            return howlInstance;
        }),
        state: jest.fn().mockReturnValue('loaded'), // Mock state as loaded
    };
    // Simulate onload being called for the mock
    if(options.onload) {
        process.nextTick(options.onload);
    }
    return howlInstance;
});
global.Howler = {
    volume: jest.fn(),
    // Add any other global Howler properties/methods used
};

// Mock Openverse Client
global.window = Object.create(window || {}); // Ensure window object exists for openverseClient
global.window.openverseClient = jest.fn();

// Mock OpenverseApiClient constructor 
global.window.OpenverseApiClient = jest.fn(() => global.window.openverseClient);

describe('AudioManager', () => {
    let audioManager;
    const mockAnimalData = [
        { name: 'Cat', emoji: '🐱', codePoint: 'U+1F431', searchTerms: ['cat meow', 'cat purr', 'kitten'] },
        { name: 'Dog', emoji: '🐶', codePoint: 'U+1F436', searchTerms: ['dog bark', 'dog woof', 'puppy'] },
    ];

    beforeEach(() => {
        // Reset mocks before each test
        global.Howl.mockClear();
        global.Howler.volume.mockClear();
        global.window.openverseClient.mockReset(); // Use mockReset to clear all history and behavior
        global.window.OpenverseApiClient.mockClear();

        audioManager = new AudioManager(mockAnimalData, 0.5);
        audioManager.soundsEnabled = true; // Ensure sounds are enabled for tests
    });

    test('should initialize correctly', () => {
        expect(audioManager.animalData).toEqual(mockAnimalData);
        expect(audioManager.volume).toBe(0.5);
        expect(global.Howler.volume).toHaveBeenCalledWith(0.5);
    });

    test('should search for and attempt to load animal sounds via Openverse API', async () => {
        const mockApiResponseAppear = {
            body: {
                results: [
                    { download_url: 'http://example.com/cat_meow.mp3', url: 'http://example.com/cat_meow_page.mp3' },
                ]
            }
        };
        const mockApiResponseTap = {
            body: {
                results: [
                    { download_url: 'http://example.com/cat_purr.mp3', url: 'http://example.com/cat_purr_page.mp3' },
                ]
            }
        };

        // Mock the Openverse client to return a successful response
        // One for "cat meow" (appear) and one for "cat purr" (tap)
        global.window.openverseClient
            .mockImplementation(async (path, options) => {
                if (options && options.params && options.params.q === 'cat meow') {
                    return mockApiResponseAppear;
                }
                if (options && options.params && options.params.q === 'cat purr') {
                    return mockApiResponseTap;
                }
                return { body: { results: [] } }; // Default empty response
            });

        // Initialize the openverse client
        await audioManager.initializeSounds();

        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.loadAnimalSounds(catData);

        // Wait for all promises triggered by loadAnimalSounds to settle.
        // This requires knowing how many async operations are started.
        // loadAnimalSounds starts two searchAndLoadSound calls.
        // Each searchAndLoadSound calls apiClient and then potentially loadSoundFromUrl (Howl).
        // We need to ensure these async operations complete.
        // Using jest.runAllTimers() can help if only timers are involved,
        // but here we have actual async operations (mocked).
        // A more robust way is to await the promises returned by searchAndLoadSound if they were collected.
        // Since loadAnimalSounds doesn't return a promise that aggregates these,
        // we rely on a small timeout or flush promises.
        
        // Flush promises - process.nextTick helps, but for multiple chained promises, a small delay might still be needed
        // await new Promise(resolve => process.nextTick(resolve));
        // await new Promise(resolve => process.nextTick(resolve)); // Extra tick for safety
        // await new Promise(resolve => setTimeout(resolve, 50)); // Short delay for Howl onload
        // Using jest.runAllTimers() if timers (like setTimeout) are used in AudioManager for async ops
        // However, the primary async ops are Promises from openverseClient and Howl
        // Let's ensure all microtasks are flushed, and give a bit of time for Howl onload mocks
        for (let i = 0; i < 10; i++) { // Pump the event loop a few times
            await new Promise(resolve => process.nextTick(resolve));
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for onload callbacks


        // Check if Openverse client was called for appear sound
        expect(global.window.openverseClient).toHaveBeenCalledWith("GET v1/audio/", {
            params: {
                q: 'cat meow',
                extension: "mp3,wav,ogg,aac,m4a,opus",
                mature: "false",
                page_size: 5,
                unstable__include_sensitive_results: "false"
            }
        });

        // Check if Openverse client was called for tap sound
        expect(global.window.openverseClient).toHaveBeenCalledWith("GET v1/audio/", {
            params: {
                q: 'cat purr',
                extension: "mp3,wav,ogg,aac,m4a,opus",
                mature: "false",
                page_size: 5,
                unstable__include_sensitive_results: "false"
            }
        });

        // Check if Howl was called to load the sounds
        // It should be called twice, once for appear, once for tap
        expect(global.Howl).toHaveBeenCalledTimes(2);
        expect(global.Howl).toHaveBeenCalledWith(expect.objectContaining({
            src: ['http://example.com/cat_meow.mp3'], // Appear sound
            volume: 0.5,
            html5: true,
        }));
        expect(global.Howl).toHaveBeenCalledWith(expect.objectContaining({
            src: ['http://example.com/cat_purr.mp3'], // Tap sound
            volume: 0.5,
            html5: true,
        }));

        // Check if sounds are cached
        expect(audioManager.soundCache.has('Cat_appear')).toBe(true);
        expect(audioManager.soundCache.has('Cat_tap')).toBe(true);
    });

    test('should handle Openverse API error gracefully', async () => {
        // Reset the mock to clear any previous calls from initialization
        global.window.openverseClient.mockReset();
        global.window.openverseClient.mockRejectedValue(new Error("API Error"));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Initialize the openverse client
        await audioManager.initializeSounds();

        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.loadAnimalSounds(catData);
        await new Promise(resolve => setTimeout(resolve, 0)); // Allow async operations

        expect(global.window.openverseClient).toHaveBeenCalledTimes(4); // 2 for init + 2 for loadAnimalSounds
        expect(global.Howl).not.toHaveBeenCalled();
        expect(audioManager.soundCache.size).toBe(0);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Critical error in searchAndLoadSound for \"cat meow\":", "API Error", expect.any(Error));
        expect(consoleErrorSpy).toHaveBeenCalledWith("Critical error in searchAndLoadSound for \"cat purr\":", "API Error", expect.any(Error));
        
        consoleErrorSpy.mockRestore();
    });

    test('should handle no sound results from Openverse API', async () => {
        // Reset the mock to clear any previous calls from initialization
        global.window.openverseClient.mockReset();
        global.window.openverseClient.mockResolvedValue({ body: { results: [] } });
        
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Initialize the openverse client
        await audioManager.initializeSounds();

        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.loadAnimalSounds(catData);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(global.window.openverseClient).toHaveBeenCalledTimes(4); // 2 for init + 2 for loadAnimalSounds
        expect(global.Howl).not.toHaveBeenCalled();
        expect(audioManager.soundCache.size).toBe(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No sound results found for "cat meow"'), 'Full response was:', expect.any(Object));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No sound results found for "cat purr"'), 'Full response was:', expect.any(Object));

        consoleWarnSpy.mockRestore();
    });

    test('playSound should attempt to play a cached sound', async () => {
        // Pre-load a sound into the cache for testing playSound
        const mockSoundUrl = 'http://example.com/cat_meow.mp3';
        global.window.openverseClient.mockResolvedValueOnce({
            body: { results: [{ download_url: mockSoundUrl }] }
        });
        
        // Initialize the openverse client
        await audioManager.initializeSounds();
        
        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.searchAndLoadSound(catData.searchTerms[0], 'Cat_appear');
        
        // Ensure Howl's onload has been processed and cache is populated
        for (let i = 0; i < 5; i++) { // Pump the event loop
            await new Promise(resolve => process.nextTick(resolve));
        }
        await new Promise(resolve => setTimeout(resolve, 50)); // Wait for onload callback

        expect(audioManager.soundCache.has('Cat_appear')).toBe(true);
        const mockHowlInstance = audioManager.soundCache.get('Cat_appear');
        
        audioManager.playSound('Cat_appear');
        expect(mockHowlInstance.play).toHaveBeenCalled();
        expect(mockHowlInstance.volume).toHaveBeenCalledWith(0.5); // Ensure volume is set before playing
    });

    test('playSound should attempt to load a sound on demand if not cached', async () => {
        const mockApiResponse = {
            body: {
                results: [{ download_url: 'http://example.com/dog_bark.mp3' }]
            }
        };
        // Reset the mock to clear any previous calls from initialization
        global.window.openverseClient.mockReset();
        global.window.openverseClient.mockResolvedValue(mockApiResponse);

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Initialize the openverse client but don't let it preload sounds for Dog
        await audioManager.initializeSounds();

        // Clear the spy to only capture calls from playSound
        consoleLogSpy.mockClear();

        // Make sure Dog_appear is definitely not in cache
        audioManager.soundCache.delete('Dog_appear');
        audioManager.soundLoading.delete('Dog_appear');

        audioManager.playSound('Dog_appear'); // Dog_appear is not in cache initially
        
        // Check that a log message indicates on-demand loading
        expect(consoleLogSpy).toHaveBeenCalledWith("Sound Dog_appear not ready, attempting to load on demand...");
        
        // Allow time for the async loadAnimalSounds to be called
        await new Promise(resolve => setTimeout(resolve, 50)); 

        // Verify Openverse client was called for the on-demand load (should have 2 calls: one for appear, one for tap)
        expect(global.window.openverseClient).toHaveBeenCalledWith("GET v1/audio/", expect.objectContaining({
            params: expect.objectContaining({ 
                q: 'dog bark',
                extension: "mp3,wav,ogg,aac,m4a,opus",
                mature: "false",
                page_size: 5,
                unstable__include_sensitive_results: "false"
            })
        }));
        
        // Verify Howl was called (eventually)
        expect(global.Howl).toHaveBeenCalledWith(expect.objectContaining({
            src: ['http://example.com/dog_bark.mp3']
        }));

        consoleLogSpy.mockRestore();
    });

    test('setVolume should update Howler.volume and cached sounds volume', () => {
        // Pre-cache a sound
        const mockSoundInstance = { volume: jest.fn(), play: jest.fn() };
        audioManager.soundCache.set('Test_sound', mockSoundInstance);

        audioManager.setVolume(0.8);
        expect(audioManager.volume).toBe(0.8);
        expect(global.Howler.volume).toHaveBeenCalledWith(0.8);
        expect(mockSoundInstance.volume).toHaveBeenCalledWith(0.8);
    });

    test('should not attempt to load sounds if soundsEnabled is false', async () => {
        audioManager.soundsEnabled = false;
        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.loadAnimalSounds(catData);

        expect(global.window.openverseClient).not.toHaveBeenCalled();
        expect(global.Howl).not.toHaveBeenCalled();
    });

    test('should gracefully handle Howler load error', async () => {
        // First provide a successful API response so we get to the Howler error
        global.window.openverseClient.mockReset();
        global.window.openverseClient.mockResolvedValue({
            body: { results: [{ download_url: 'http://example.com/bad_sound.mp3' }] }
        });

        const originalHowl = global.Howl;
        global.Howl = jest.fn(options => {
            const howlInstance = {
                play: jest.fn().mockReturnThis(),
                volume: jest.fn().mockReturnThis(),
                on: jest.fn((event, callback) => {
                    if (options.onloaderror && event === 'loaderror') {
                        process.nextTick(() => options.onloaderror(123, 'Simulated load error'));
                    } else if (options.onload && event === 'load') {
                        process.nextTick(options.onload);
                    }
                    return howlInstance;
                }),
                state: jest.fn().mockReturnValue('error'), // Mock state as error
            };
            // Simulate onloaderror being called for the mock in this specific test case
            if(options.onloaderror){
                process.nextTick(() => options.onloaderror(123, 'Simulated load error'));
            }
            return howlInstance;
        });

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Initialize the openverse client
        await audioManager.initializeSounds();

        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.searchAndLoadSound(catData.searchTerms[0], 'Cat_appear_bad');
        
        // Ensure Howl's onloaderror has been processed
        for (let i = 0; i < 5; i++) { // Pump the event loop
            await new Promise(resolve => process.nextTick(resolve));
        }
        await new Promise(resolve => setTimeout(resolve, 50)); // Wait for onerror callback

        expect(audioManager.soundCache.has('Cat_appear_bad')).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Howler.js failed to load sound from http://example.com/bad_sound.mp3 (cacheKey: Cat_appear_bad):',
            'Simulated load error',
            'Sound ID: 123'
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'Failed to load sound from http://example.com/bad_sound.mp3 (Title: N/A, searchTerm: "cat meow"):',
            'Howler: Failed to load sound from http://example.com/bad_sound.mp3: Simulated load error'
        );

        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        global.Howl = originalHowl; // Restore original mock
    });

});

// Increase Jest timeout for async tests
jest.setTimeout(10000); // 10 seconds timeout for all tests in this file
