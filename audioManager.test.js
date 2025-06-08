const AudioManager = require('./audioManager'); // Assuming AudioManager is exported using module.exports

// Mock Howler.js
global.Howl = jest.fn(options => ({
    play: jest.fn(),
    volume: jest.fn(),
    on: jest.fn((event, callback) => {
        if (options.onload && event === 'load') {
            // Simulate successful load for testing purposes
            setTimeout(options.onload, 0);
        }
        if (options.onloaderror && event === 'loaderror') {
            // To test error cases, you might call options.onloaderror here under certain conditions
        }
    }),
    // Add any other methods of Howl that your AudioManager uses
}));
global.Howler = {
    volume: jest.fn(),
    // Add any other global Howler properties/methods used
};

// Mock Openverse Client
global.window = Object.create(window || {}); // Ensure window object exists for openverseClient
global.window.openverseClient = jest.fn();

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

        audioManager = new AudioManager(mockAnimalData, 0.5);
        audioManager.soundsEnabled = true; // Ensure sounds are enabled for tests
    });

    test('should initialize correctly', () => {
        expect(audioManager.animalData).toEqual(mockAnimalData);
        expect(audioManager.volume).toBe(0.5);
        expect(global.Howler.volume).toHaveBeenCalledWith(0.5);
    });

    test('should search for and attempt to load animal sounds via Openverse API', async () => {
        const mockApiResponse = {
            data: {
                results: [
                    { download_url: 'http://example.com/cat_meow.mp3', url: 'http://example.com/cat_meow_page.mp3' },
                    { download_url: 'http://example.com/cat_purr.mp3', url: 'http://example.com/cat_purr_page.mp3' },
                ]
            }
        };

        // Mock the Openverse client to return a successful response for both search terms
        global.window.openverseClient
            .mockResolvedValueOnce(mockApiResponse) // For 'cat meow'
            .mockResolvedValueOnce(mockApiResponse); // For 'cat purr'

        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.loadAnimalSounds(catData);

        // Wait for promises to resolve (e.g., sound loading)
        // A short timeout or more robust promise handling might be needed depending on AudioManager implementation
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow time for async operations

        // Check if Openverse client was called for appear sound
        expect(global.window.openverseClient).toHaveBeenCalledWith("GET v1/audio/", {
            params: {
                q: 'cat meow',
                category: "sound_effect",
                extension: "mp3",
                mature: false,
                page_size: 5
            }
        });

        // Check if Openverse client was called for tap sound
        expect(global.window.openverseClient).toHaveBeenCalledWith("GET v1/audio/", {
            params: {
                q: 'cat purr',
                category: "sound_effect",
                extension: "mp3",
                mature: false,
                page_size: 5
            }
        });

        // Check if Howl was called to load the sounds
        // It should be called twice, once for appear, once for tap
        expect(global.Howl).toHaveBeenCalledTimes(2);
        expect(global.Howl).toHaveBeenCalledWith(expect.objectContaining({
            src: ['http://example.com/cat_meow.mp3'],
            volume: 0.5,
            html5: true,
        }));
        expect(global.Howl).toHaveBeenCalledWith(expect.objectContaining({
            src: ['http://example.com/cat_purr.mp3'],
            volume: 0.5,
            html5: true,
        }));

        // Check if sounds are cached
        expect(audioManager.soundCache.has('Cat_appear')).toBe(true);
        expect(audioManager.soundCache.has('Cat_tap')).toBe(true);
    });

    test('should handle Openverse API error gracefully', async () => {
        global.window.openverseClient.mockResolvedValueOnce({ error: 'API Error', data: null });
        global.window.openverseClient.mockResolvedValueOnce({ error: 'API Error', data: null });

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.loadAnimalSounds(catData);
        await new Promise(resolve => setTimeout(resolve, 0)); // Allow async operations

        expect(global.window.openverseClient).toHaveBeenCalledTimes(2);
        expect(global.Howl).not.toHaveBeenCalled();
        expect(audioManager.soundCache.size).toBe(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith("API error searching for \"cat meow\":", "API Error");
        expect(consoleWarnSpy).toHaveBeenCalledWith("API error searching for \"cat purr\":", "API Error");
        
        consoleWarnSpy.mockRestore();
    });

    test('should handle no sound results from Openverse API', async () => {
        global.window.openverseClient.mockResolvedValueOnce({ data: { results: [] } });
        global.window.openverseClient.mockResolvedValueOnce({ data: { results: [] } });
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.loadAnimalSounds(catData);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(global.window.openverseClient).toHaveBeenCalledTimes(2);
        expect(global.Howl).not.toHaveBeenCalled();
        expect(audioManager.soundCache.size).toBe(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith('No sound results found for "cat meow"');
        expect(consoleWarnSpy).toHaveBeenCalledWith('No sound results found for "cat purr"');

        consoleWarnSpy.mockRestore();
    });

    test('playSound should attempt to play a cached sound', async () => {
        // Pre-load a sound into the cache for testing playSound
        const mockSoundUrl = 'http://example.com/cat_meow.mp3';
        global.window.openverseClient.mockResolvedValueOnce({
            data: { results: [{ download_url: mockSoundUrl }] }
        });
        
        const catData = mockAnimalData.find(a => a.name === 'Cat');
        await audioManager.searchAndLoadSound(catData.searchTerms[0], 'Cat_appear');
        await new Promise(resolve => setTimeout(resolve, 0)); // Ensure loading completes

        expect(audioManager.soundCache.has('Cat_appear')).toBe(true);
        const mockHowlInstance = audioManager.soundCache.get('Cat_appear');
        
        audioManager.playSound('Cat_appear');
        expect(mockHowlInstance.play).toHaveBeenCalled();
        expect(mockHowlInstance.volume).toHaveBeenCalledWith(0.5); // Ensure volume is set before playing
    });

    test('playSound should attempt to load a sound on demand if not cached', async () => {
        const mockApiResponse = {
            data: {
                results: [{ download_url: 'http://example.com/dog_bark.mp3' }]
            }
        };
        global.window.openverseClient.mockResolvedValue(mockApiResponse);

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        audioManager.playSound('Dog_appear'); // Dog_appear is not in cache initially
        
        // Check that a log message indicates on-demand loading
        expect(consoleLogSpy).toHaveBeenCalledWith("Sound Dog_appear not ready, attempting to load on demand...");
        
        // Allow time for the async loadAnimalSounds to be called
        await new Promise(resolve => setTimeout(resolve, 50)); 

        // Verify Openverse client was called for the on-demand load
        expect(global.window.openverseClient).toHaveBeenCalledWith("GET v1/audio/", expect.objectContaining({
            params: expect.objectContaining({ q: 'dog bark' })
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
        global.window.openverseClient.mockResolvedValueOnce({
            data: { results: [{ download_url: 'http://example.com/bad_sound.mp3' }] }
        });

        // Make Howl simulate an error
        global.Howl.mockImplementationOnce(options => ({
            play: jest.fn(),
            volume: jest.fn(),
            on: jest.fn((event, callback) => {
                if (options.onloaderror && event === 'loaderror') {
                    setTimeout(() => options.onloaderror(123, 'Simulated load error'), 0);
                }
            }),
        }));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const catData = mockAnimalData.find(a => a.name === 'Cat');
        // We expect this to log an error, but not throw, due to .catch in AudioManager
        await expect(audioManager.searchAndLoadSound(catData.searchTerms[0], 'Cat_appear')).resolves.toBeUndefined();
        
        await new Promise(resolve => setTimeout(resolve, 50)); // Allow async operations and error logging

        expect(audioManager.soundCache.has('Cat_appear')).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Howler.js failed to load sound from http://example.com/bad_sound.mp3:',
            'Simulated load error'
        );
        // Also check the warning from searchAndLoadSound about the specific failure
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'Failed to load sound from http://example.com/bad_sound.mp3:',
            expect.any(Error) // Error: Failed to load sound from http://example.com/bad_sound.mp3: Simulated load error
        );

        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

});
