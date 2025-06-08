const AudioManager = require('./audioManager');
const { Howl, Howler } = require('howler'); // Import Howler

// It's important NOT to mock window.openverseClient here, as we want to test actual API calls.
// Similarly, we use the real Howler.js, though we won't be testing actual audio playback.

describe('AudioManager Integration Tests', () => {
    jest.setTimeout(60000); // Global timeout for all tests and hooks in this suite

    let audioManager;
    const mockAnimalData = [
        { name: 'Cat', emoji: '🐱', codePoint: 'U+1F431', searchTerms: ['cat meow', 'cat purr', 'kitten'] },
        { name: 'Dog', emoji: '🐶', codePoint: 'U+1F436', searchTerms: ['dog bark', 'dog woof', 'puppy'] },
    ];

    beforeAll(async () => {
        // Check if the new client constructor is already available
        if (typeof window.OpenverseApiClient === 'function') {
            console.log('TEST_LOG: beforeAll: window.OpenverseApiClient is already a function. Skipping UMD load.');
            return; 
        }
        // Check if the nested client constructor is available
        if (typeof window.OpenverseApiClient === 'object' && typeof window.OpenverseApiClient.OpenverseClient === 'function') {
            console.log('TEST_LOG: beforeAll: window.OpenverseApiClient.OpenverseClient is already a function. Hoisting and skipping UMD load.');
            // Hoist it to the expected location for AudioManager
            window.OpenverseApiClient = window.OpenverseApiClient.OpenverseClient;
            return;
        }

        console.log('TEST_LOG: beforeAll: Attempting to load local Openverse API client UMD script...');
        // Path to the locally bundled UMD file
        const openverseClientScriptURL = `file://${process.cwd()}/public/openverse-client.umd.js`;
        
        const script = window.document.createElement('script');
        script.src = openverseClientScriptURL; 
        // script.async = false; // Explicitly setting async to false, though await loadPromise is the main mechanism

        const loadPromise = new Promise((resolve, reject) => {
            script.onload = () => {
                console.log('TEST_LOG: beforeAll: UMD script.onload triggered.');
                if (typeof window.OpenverseApiClient === 'object' && typeof window.OpenverseApiClient.OpenverseClient === 'function') {
                    console.log('TEST_LOG: beforeAll: UMD loaded. Initial window.OpenverseApiClient is object. window.OpenverseApiClient.OpenverseClient is function.');
                    console.log('TEST_LOG: beforeAll: typeof window.OpenverseApiClient.OpenverseClient:', typeof window.OpenverseApiClient.OpenverseClient);
                    console.log('TEST_LOG: beforeAll: window.OpenverseApiClient.OpenverseClient.toString():', String(window.OpenverseApiClient.OpenverseClient).slice(0, 150));
                    
                    window.OpenverseApiClient = window.OpenverseApiClient.OpenverseClient; // Hoist
                    
                    console.log('TEST_LOG: beforeAll: AFTER HOISTING: typeof window.OpenverseApiClient:', typeof window.OpenverseApiClient);
                    if (typeof window.OpenverseApiClient === 'function') {
                        console.log('TEST_LOG: beforeAll: AFTER HOISTING: window.OpenverseApiClient.toString():', String(window.OpenverseApiClient).slice(0, 150));
                    }

                    // Attempt test instantiation immediately after hoisting
                    try {
                        console.log('TEST_LOG: beforeAll: Attempting test instantiation of hoisted window.OpenverseApiClient.');
                        const testInstance = window.OpenverseApiClient(); // Changed: Remove 'new' keyword
                        console.log('TEST_LOG: beforeAll: Test instantiation SUCCEEDED. Instance:', typeof testInstance);
                        console.log('TEST_LOG: beforeAll: Test instance keys:', Object.keys(testInstance || {}));
                        if (testInstance && testInstance.audio) {
                            console.log('TEST_LOG: beforeAll: Test instance.audio keys:', Object.keys(testInstance.audio));
                        }
                    } catch (e) {
                        console.error('TEST_LOG: beforeAll: Test instantiation FAILED:', e);
                        console.error('TEST_LOG: beforeAll: window.OpenverseApiClient was (at failure):', String(window.OpenverseApiClient).slice(0,300));
                    }
                    resolve();
                } else if (typeof window.OpenverseApiClient === 'function') {
                    console.log('TEST_LOG: beforeAll: UMD loaded. window.OpenverseApiClient is already a function (unexpected direct load).');
                    console.log('TEST_LOG: beforeAll: typeof window.OpenverseApiClient:', typeof window.OpenverseApiClient);
                    console.log('TEST_LOG: beforeAll: window.OpenverseApiClient.toString():', String(window.OpenverseApiClient).slice(0, 150));

                    // Attempt test instantiation
                    try {
                        console.log('TEST_LOG: beforeAll: Attempting test instantiation of direct window.OpenverseApiClient.');
                        const testInstance = window.OpenverseApiClient(); // Changed: Remove 'new' keyword
                        console.log('TEST_LOG: beforeAll: Test instantiation SUCCEEDED (direct). Instance:', typeof testInstance);
                    } catch (e) {
                        console.error('TEST_LOG: beforeAll: Test instantiation FAILED (direct):', e);
                        console.error('TEST_LOG: beforeAll: window.OpenverseApiClient was (at failure, direct):', String(window.OpenverseApiClient).slice(0,300));
                    }
                    resolve();
                } else {
                    console.error('TEST_LOG: beforeAll: UMD script loaded, but window.OpenverseApiClient is not the expected function or object.');
                    console.log('TEST_LOG: beforeAll: window.OpenverseApiClient type:', typeof window.OpenverseApiClient);
                    console.log('TEST_LOG: beforeAll: window.OpenverseApiClient value:', window.OpenverseApiClient);
                    reject(new Error('window.OpenverseApiClient not defined as expected after UMD script load.'));
                }
            };
            script.onerror = (event) => {
                console.error(`TEST_LOG: beforeAll: Failed to load Openverse API client UMD script from ${openverseClientScriptURL}.`, event);
                reject(new Error('Failed to load Openverse API client UMD script.'));
            };
        });

        window.document.head.appendChild(script);
        
        try {
            await loadPromise;
            console.log('TEST_LOG: beforeAll: Openverse API client (UMD) successfully set up.');
        } catch (error) {
            console.error('TEST_LOG: beforeAll: Failed to set up Openverse API client (UMD):', error.message);
            throw error; 
        }
    }, 60000); // Timeout for the beforeAll hook

    beforeEach(async () => { // Make beforeEach async
        // Ensure a fresh AudioManager instance for each test
        audioManager = new AudioManager(mockAnimalData, 0.5);
        audioManager.soundsEnabled = true;

        // Clear the cache to ensure tests are isolated
        audioManager.soundCache.clear();

        // Restore console spies. Tests needing to assert on these will still work.
        // Other console.warn/error calls will be silenced in test output.
        jest.spyOn(console, 'warn').mockImplementation((...args) => { /* For debugging spies: console.log('[SPY WARN]', ...args); */ });
        jest.spyOn(console, 'error').mockImplementation((...args) => { /* For debugging spies: console.log('[SPY ERROR]', ...args); */ });

        // Explicitly initialize sounds and wait for it to complete
        // This is crucial for integration tests where the client needs to be ready.
        console.log('TEST_LOG: beforeEach: Calling audioManager.initializeSounds()...');
        try {
            await audioManager.initializeSounds();
            console.log('TEST_LOG: beforeEach: audioManager.initializeSounds() completed.');
            if (!audioManager.openverseClientInstance) {
                console.error('TEST_LOG: beforeEach: audioManager.openverseClientInstance is NULL after initializeSounds!');
            } else {
                console.log('TEST_LOG: beforeEach: audioManager.openverseClientInstance is VALID after initializeSounds.');
            }
        } catch (initError) {
            console.error('TEST_LOG: beforeEach: Error during audioManager.initializeSounds():', initError);
            // Rethrow or handle as appropriate for your test setup if initialization is critical
            throw initError;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Restore all mocks, including console
    });

    test('should successfully search for and load a sound using a real API call', async () => {
        const soundKey = 'TestIntegration_CatMeow';
        const searchTerm = 'cat meow'; // A common term likely to yield results

        console.log(`TEST_LOG: Test 1: Attempting to load sound for term: "${searchTerm}" with key: ${soundKey}`);
        
        try {
            await audioManager.searchAndLoadSound(searchTerm, soundKey);
        } catch (error) {
            console.error('TEST_LOG: Test 1: Error during searchAndLoadSound:', error);
            // Fail the test if searchAndLoadSound throws an unexpected error
            throw error;
        }

        // Add a delay to allow for the asynchronous loading and Howler.js onload event
        // This is crucial for real network requests and subsequent processing.
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const cachedSound = audioManager.soundCache.get(soundKey);

        if (!cachedSound) {
            console.warn(`TEST_LOG: Test 1: Sound not found in cache for key: ${soundKey}. Cache size: ${audioManager.soundCache.size}`);
            audioManager.soundCache.forEach((value, key) => {
                console.log(`TEST_LOG: Test 1: Cache entry: ${key}`);
            });
        }
        
        expect(audioManager.soundCache.has(soundKey)).toBe(true);
        expect(cachedSound).toBeInstanceOf(Howl);
        expect(cachedSound.state()).toBe('loaded'); // Check if Howler considers the sound loaded
    }, 30000); // Individual timeout for this test: 30 seconds
});
