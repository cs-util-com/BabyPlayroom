// Baby Playroom - Tummy Time Motivator
// Main application logic

class BabyPlayroom {
    constructor() {
        this.animals = [];
        this.maxAnimals = 10;
        this.spawnInterval = 10000; // 10 seconds
        this.sessionLength = 10 * 60 * 1000; // 10 minutes default
        this.sessionStartTime = null;
        this.sessionTimer = null;
        this.spawnTimer = null;
        this.gameRunning = false;
        // this.volume = 0.5; // Moved to AudioManager
        // this.soundCache = new Map(); // Moved to AudioManager
        // this.soundLoading = new Set(); // Moved to AudioManager
        // this.soundsEnabled = true; // Moved to AudioManager
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Animal data from specification (now with search terms for Openverse)
        this.animalData = [
            { name: 'Cat', emoji: '🐱', codePoint: 'U+1F431', searchTerms: ['cat meow', 'cat purr', 'kitten'] },
            { name: 'Dog', emoji: '🐶', codePoint: 'U+1F436', searchTerms: ['dog bark', 'dog woof', 'puppy'] },
            { name: 'Sheep', emoji: '🐑', codePoint: 'U+1F411', searchTerms: ['sheep baa', 'lamb bleat', 'sheep'] },
            { name: 'Cow', emoji: '🐄', codePoint: 'U+1F404', searchTerms: ['cow moo', 'cattle moo', 'cow'] },
            { name: 'Bird', emoji: '🐦', codePoint: 'U+1F426', searchTerms: ['bird chirp', 'bird tweet', 'bird song'] },
            { name: 'Chick', emoji: '🐤', codePoint: 'U+1F424', searchTerms: ['chick peep', 'baby bird', 'chicken chick'] },
            { name: 'Duck', emoji: '🦆', codePoint: 'U+1F986', searchTerms: ['duck quack', 'mallard quack', 'duck'] },
            { name: 'Frog', emoji: '🐸', codePoint: 'U+1F438', searchTerms: ['frog ribbit', 'frog croak', 'toad'] },
            { name: 'Rabbit', emoji: '🐰', codePoint: 'U+1F430', searchTerms: ['rabbit hop', 'bunny', 'rabbit sound'] },
            { name: 'Penguin', emoji: '🐧', codePoint: 'U+1F427', searchTerms: ['penguin call', 'penguin waddle', 'penguin'] }
        ];
        
        // Tap effect IDs from specification
        this.tapEffects = [
            'fade-out', 'shrink-fade', 'sparkle-burst', 'confetti-pop', 'bounce-drop',
            'particle-dissolve', 'pulse-glow', 'wiggle-spin', 'slide-away', 'star-trail'
        ];
        
        this.gameContainer = document.getElementById('gameContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        this.audioManager = new AudioManager(this.animalData, 0.5); // Initialize AudioManager

        this.init();
    }
    
    async init() {
        await this.setupOrientation();
        await this.enterFullscreen();
        this.setupEventListeners();
        
        // Start the game immediately without waiting for sounds
        this.hideLoading();
        this.startGame();
        
        // Load sounds in the background using AudioManager
        this.audioManager.initializeSounds();
    }
    
    async setupOrientation() {
        // Lock to landscape orientation after first user gesture
        if ('orientation' in screen && 'lock' in screen.orientation) {
            try {
                await screen.orientation.lock('landscape');
            } catch (error) {
                console.log('Orientation lock not supported or failed:', error);
            }
        }
    }
    
    async enterFullscreen() {
        // Enter fullscreen as early as permitted
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                await document.documentElement.msRequestFullscreen();
            }
        } catch (error) {
            console.log('Fullscreen request failed:', error);
        }
    }
    
    setupEventListeners() {
        // Escape icon
        const escapeIcon = document.getElementById('escapeIcon');
        escapeIcon.addEventListener('click', this.showSettings.bind(this));
        escapeIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showSettings();
            }
        });
        
        // Volume slider
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        volumeSlider.addEventListener('input', (e) => {
            const newVolume = e.target.value / 100;
            this.audioManager.setVolume(newVolume); // Use AudioManager to set volume
            volumeValue.textContent = e.target.value + '%';
            e.target.setAttribute('aria-valuenow', e.target.value);
            // if (window.Howler) { // Howler interaction moved to AudioManager
            // Howler.volume(this.volume);
            // }
        });
        
        // Session length buttons
        const sessionButtons = document.querySelectorAll('.session-btn');
        sessionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                sessionButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                e.target.classList.add('active');
                e.target.setAttribute('aria-pressed', 'true');
                this.sessionLength = parseInt(e.target.dataset.minutes) * 60 * 1000;
            });
        });
        
        // Close settings
        const closeSettings = document.getElementById('closeSettings');
        closeSettings.addEventListener('click', this.hideSettings.bind(this));
        
        // Padlock swipe gesture
        this.setupPadlockGesture();
        
        // Session pause controls
        const resumeSession = document.getElementById('resumeSession');
        const openSettingsFromPause = document.getElementById('openSettingsFromPause');
        
        resumeSession.addEventListener('click', this.resumeSession.bind(this));
        openSettingsFromPause.addEventListener('click', () => {
            this.hideSessionPause();
            this.showSettings();
        });
        
        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!document.getElementById('settingsOverlay').classList.contains('hidden')) {
                    this.hideSettings();
                } else if (!document.getElementById('sessionPauseOverlay').classList.contains('hidden')) {
                    // Don't allow escape from session pause - parent must make decision
                } else {
                    this.showSettings();
                }
            }
        });
    }
    
    setupPadlockGesture() {
        const padlockTarget = document.getElementById('padlockTarget');
        let startTime = 0;
        let startPos = { x: 0, y: 0 };
        let hasCrossedPadlock = false;
        
        const startGesture = (e) => {
            startTime = Date.now();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            startPos = { x: clientX, y: clientY };
            hasCrossedPadlock = false;
        };
        
        const checkGesture = (e) => {
            if (startTime === 0) return;
            
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            const rect = padlockTarget.getBoundingClientRect();
            const padlockCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            
            // Check if pointer crosses over padlock
            const crossesX = (startPos.x < padlockCenter.x && clientX > padlockCenter.x) ||
                           (startPos.x > padlockCenter.x && clientX < padlockCenter.x);
            const crossesY = (startPos.y < padlockCenter.y && clientY > padlockCenter.y) ||
                           (startPos.y > padlockCenter.y && clientY < padlockCenter.y);
            
            if (crossesX || crossesY) {
                hasCrossedPadlock = true;
            }
        };
        
        const endGesture = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed <= 3000 && hasCrossedPadlock) {
                this.unlockSettings();
            }
            startTime = 0;
            hasCrossedPadlock = false;
        };
        
        // Mouse events
        padlockTarget.addEventListener('mousedown', startGesture);
        document.addEventListener('mousemove', checkGesture);
        document.addEventListener('mouseup', endGesture);
        
        // Touch events
        padlockTarget.addEventListener('touchstart', startGesture);
        document.addEventListener('touchmove', checkGesture);
        document.addEventListener('touchend', endGesture);
        
        // Keyboard accessibility for padlock
        padlockTarget.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.unlockSettings();
            }
        });
    }
    
    playSound(soundKey) { // Delegated to AudioManager
        this.audioManager.playSound(soundKey);
    }
    
    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }
    
    startGame() {
        this.gameRunning = true;
        this.sessionStartTime = Date.now();
        this.startSpawnLoop();
        this.startSessionTimer();
    }
    
    pauseGame() {
        this.gameRunning = false;
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
        }
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
    }
    
    resumeGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.startSpawnLoop();
            // Adjust session timer for remaining time
            const elapsed = Date.now() - this.sessionStartTime;
            const remaining = this.sessionLength - elapsed;
            if (remaining > 0) {
                this.startSessionTimer(remaining);
            }
        }
    }
    
    startSpawnLoop() {
        // Initial spawn
        this.checkAndSpawn();
        
        // Regular spawn interval
        this.spawnTimer = setInterval(() => {
            if (this.gameRunning) { // Corrected syntax: added parentheses
                this.checkAndSpawn();
            }
        }, this.spawnInterval);
    }
    
    checkAndSpawn() {
        if (this.animals.length < this.maxAnimals) {
            this.spawnAnimal();
        }
    }
    
    spawnAnimal() {
        const animalData = this.animalData[Math.floor(Math.random() * this.animalData.length)];
        const size = 60 + Math.random() * 60; // 60-120px as specified
        
        const animal = document.createElement('div');
        animal.className = 'animal';
        animal.textContent = animalData.emoji;
        animal.style.fontSize = size + 'px';
        animal.dataset.name = animalData.name;
        animal.dataset.size = size;
        
        // Random position ensuring animal is fully visible
        const maxX = window.innerWidth - size;
        const maxY = window.innerHeight - size;
        const x = Math.random() * Math.max(0, maxX);
        const y = Math.random() * Math.max(0, maxY);
        
        animal.style.left = x + 'px';
        animal.style.top = y + 'px';
        
        // Random velocity for movement (max 5°/s as specified)
        animal.velocity = {
            x: (Math.random() - 0.5) * 2, // pixels per frame
            y: (Math.random() - 0.5) * 2
        };
        
        // Touch/click handler
        animal.addEventListener('click', (e) => this.handleAnimalTap(e, animal, animalData));
        animal.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleAnimalTap(e, animal, animalData);
        });
        
        // Keyboard accessibility
        animal.setAttribute('tabindex', '0');
        animal.setAttribute('role', 'button');
        animal.setAttribute('aria-label', `${animalData.name} - tap to hear sound`);
        animal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleAnimalTap(e, animal, animalData);
            }
        });
        
        this.gameContainer.appendChild(animal);
        this.animals.push(animal);
        
        // Play appear sound
        this.playSound(`${animalData.name}_appear`);
        
        // Start movement
        this.animateAnimal(animal);
    }
    
    animateAnimal(animal) {
        if (!this.reducedMotion && this.gameRunning) {
            const animate = () => {
                if (!animal.parentNode || !this.gameRunning) return;
                
                const rect = animal.getBoundingClientRect();
                const size = parseFloat(animal.dataset.size);
                
                let newX = rect.left + animal.velocity.x;
                let newY = rect.top + animal.velocity.y;
                
                // Edge wrapping as specified - wrap to opposite edge
                if (newX + size < 0) {
                    newX = window.innerWidth;
                } else if (newX > window.innerWidth) {
                    newX = -size;
                }
                
                if (newY + size < 0) {
                    newY = window.innerHeight;
                } else if (newY > window.innerHeight) {
                    newY = -size;
                }
                
                animal.style.left = newX + 'px';
                animal.style.top = newY + 'px';
                
                // Organic random-walk: slight random variation in movement
                animal.velocity.x += (Math.random() - 0.5) * 0.1;
                animal.velocity.y += (Math.random() - 0.5) * 0.1;
                
                // Keep velocity within bounds (max ~5°/s visual comfort zone)
                const maxVel = 2.5; // Reduced for smoother, more gentle movement
                animal.velocity.x = Math.max(-maxVel, Math.min(maxVel, animal.velocity.x));
                animal.velocity.y = Math.max(-maxVel, Math.min(maxVel, animal.velocity.y));
                
                requestAnimationFrame(animate);
            };
            animate();
        }
    }
    
    handleAnimalTap(event, animal, animalData) {
        event.stopPropagation();
        
        // Play tap sound
        this.playSound(`${animalData.name}_tap`);
        
        // Apply random effect
        const effect = this.tapEffects[Math.floor(Math.random() * this.tapEffects.length)];
        animal.classList.add(effect);
        
        // Remove animal after animation completes
        setTimeout(() => {
            this.removeAnimal(animal);
        }, 1000);
    }
    
    removeAnimal(animal) {
        const index = this.animals.indexOf(animal);
        if (index > -1) {
            this.animals.splice(index, 1);
        }
        if (animal.parentNode) {
            animal.parentNode.removeChild(animal);
        }
    }
    
    startSessionTimer(duration = this.sessionLength) {
        this.sessionTimer = setTimeout(() => {
            this.pauseSession();
        }, duration);
    }
    
    pauseSession() {
        this.pauseGame();
        this.showSessionPause();
    }
    
    resumeSession() {
        this.hideSessionPause();
        this.sessionStartTime = Date.now(); // Reset session timer
        this.resumeGame();
    }
    
    showSettings() {
        this.pauseGame();
        document.getElementById('settingsOverlay').classList.remove('hidden');
        document.getElementById('settingsOverlay').focus();
    }
    
    hideSettings() {
        document.getElementById('settingsOverlay').classList.add('hidden');
        document.getElementById('settingsPanel').classList.add('hidden');
        this.resumeGame();
    }
    
    unlockSettings() {
        document.getElementById('padlockTarget').style.display = 'none';
        document.getElementById('settingsPanel').classList.remove('hidden');
        document.getElementById('volumeSlider').focus();
    }
    
    showSessionPause() {
        document.getElementById('sessionPauseOverlay').classList.remove('hidden');
        document.getElementById('resumeSession').focus();
    }
    
    hideSessionPause() {
        document.getElementById('sessionPauseOverlay').classList.add('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for user gesture to start (required for audio and fullscreen)
    const startApp = () => {
        new BabyPlayroom();
        document.removeEventListener('click', startApp);
        document.removeEventListener('touchstart', startApp);
        document.removeEventListener('keydown', startApp);
    };
    
    // Show a start prompt
    const startPrompt = document.createElement('div');
    startPrompt.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    startPrompt.innerHTML = `
        <h2 style="margin-bottom: 15px; color: #333;">Baby Playroom</h2>
        <p style="margin-bottom: 20px; color: #666;">Tap anywhere to start the tummy time fun!</p>
        <div style="font-size: 40px;">🐱🐶🐸🐧</div>
    `;
    document.body.appendChild(startPrompt);
    
    const startHandler = (e) => {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        
        // Remove event listeners to prevent multiple calls
        document.removeEventListener('click', startHandler);
        document.removeEventListener('touchstart', startHandler);
        document.removeEventListener('keydown', startHandler);
        
        // Only remove if the element is still in the document
        if (startPrompt.parentNode) {
            document.body.removeChild(startPrompt);
        }
        
        startApp();
    };
    
    document.addEventListener('click', startHandler);
    document.addEventListener('touchstart', startHandler);
    document.addEventListener('keydown', startHandler);
});