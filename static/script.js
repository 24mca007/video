class SocialDownloader {
    constructor() {
        this.currentPlatform = null;
        this.currentData = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupPlatformSelection();
    }

    bindEvents() {
        // Platform selection
        document.querySelectorAll('.platform-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectPlatform(e));
        });

        // Back button
        document.getElementById('back-btn').addEventListener('click', () => this.goBack());

        // Fetch button
        document.getElementById('fetch-btn').addEventListener('click', () => this.fetchMedia());

        // URL input enter key
        document.getElementById('url-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchMedia();
        });

        // Quality buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quality-btn')) {
                this.downloadQuality(e.target.closest('.quality-btn'));
            }
        });

        // Download buttons
        document.getElementById('download-video')?.addEventListener('click', () => this.downloadSingle());
        document.getElementById('download-audio')?.addEventListener('click', () => this.downloadAudio());
    }

    setupPlatformSelection() {
        // Add staggered animation to platform cards
        document.querySelectorAll('.platform-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }

    selectPlatform(e) {
        const card = e.currentTarget;
        const platform = card.dataset.platform;
        
        // Add selection animation
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
            this.showDownloadInterface(platform);
        }, 150);
    }

    showDownloadInterface(platform) {
        this.currentPlatform = platform;
        
        // Update platform header
        const platformData = this.getPlatformData(platform);
        document.getElementById('selected-icon').className = platformData.icon;
        document.getElementById('selected-name').textContent = platformData.name;
        document.getElementById('url-input').placeholder = platformData.placeholder;
        
        // Apply platform theme
        this.applyPlatformTheme(platform);
        
        // Show download interface
        document.getElementById('platform-selection').classList.add('hidden');
        document.getElementById('download-interface').classList.remove('hidden');
        
        // Focus on input
        setTimeout(() => {
            document.getElementById('url-input').focus();
        }, 300);
    }

    getPlatformData(platform) {
        const data = {
            instagram: {
                name: 'Instagram',
                icon: 'fab fa-instagram',
                placeholder: 'Paste Instagram post/reel/story URL here...'
            },
            facebook: {
                name: 'Facebook',
                icon: 'fab fa-facebook-f',
                placeholder: 'Paste Facebook video URL here...'
            },
            tiktok: {
                name: 'TikTok',
                icon: 'fab fa-tiktok',
                placeholder: 'Paste TikTok video URL here...'
            },
            youtube: {
                name: 'YouTube',
                icon: 'fab fa-youtube',
                placeholder: 'Paste YouTube video/shorts URL here...'
            },
            twitter: {
                name: 'Twitter',
                icon: 'fab fa-twitter',
                placeholder: 'Paste Twitter video URL here...'
            }
        };
        return data[platform] || data.instagram;
    }

    applyPlatformTheme(platform) {
        // Remove existing theme classes
        document.body.classList.remove('theme-instagram', 'theme-facebook', 'theme-tiktok', 'theme-youtube', 'theme-twitter');
        
        // Add new theme class
        document.body.classList.add(`theme-${platform}`);
        
        // Update CSS custom properties for platform colors
        const colors = {
            instagram: ['#e1306c', '#f09433'],
            facebook: ['#1877f2', '#42a5f5'],
            tiktok: ['#ff0050', '#000000'],
            youtube: ['#ff0000', '#ff4444'],
            twitter: ['#1da1f2', '#42a5f5']
        };
        
        if (colors[platform]) {
            document.documentElement.style.setProperty('--platform-primary', colors[platform][0]);
            document.documentElement.style.setProperty('--platform-secondary', colors[platform][1]);
        }
    }

    goBack() {
        document.getElementById('download-interface').classList.add('hidden');
        document.getElementById('platform-selection').classList.remove('hidden');
        document.getElementById('results-section').classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');
        document.getElementById('url-input').value = '';
        this.currentPlatform = null;
        this.currentData = null;
    }

    async fetchMedia() {
        const url = document.getElementById('url-input').value.trim();
        
        if (!url) {
            this.showError('Please enter a valid URL');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showError('Please enter a valid URL');
            return;
        }

        this.showLoading(true);
        this.hideError();

        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (data.error) {
                this.showError(data.message || 'Failed to fetch media');
                return;
            }

            this.currentData = data;
            this.displayResults(data);

        } catch (error) {
            console.error('Fetch error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showLoading(show) {
        const fetchBtn = document.getElementById('fetch-btn');
        const btnText = fetchBtn.querySelector('.btn-text');
        const loader = fetchBtn.querySelector('.loader');

        if (show) {
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
            fetchBtn.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            fetchBtn.disabled = false;
        }
    }

    displayResults(data) {
        // Update media info
        document.getElementById('thumbnail').src = data.thumbnail || '';
        document.getElementById('media-title').textContent = data.title || 'No title available';
        document.getElementById('media-author').textContent = `@${data.author || 'Unknown'}`;
        
        // Format duration
        if (data.duration) {
            const duration = this.formatDuration(data.duration);
            document.getElementById('media-duration').textContent = `Duration: ${duration}`;
        }

        // Handle download options
        this.setupDownloadOptions(data);

        // Show results
        document.getElementById('results-section').classList.remove('hidden');
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }

    setupDownloadOptions(data) {
        const qualityOptions = document.getElementById('quality-options');
        const singleDownload = document.getElementById('single-download');
        const audioDownload = document.getElementById('audio-download');

        // Reset all options
        qualityOptions.classList.add('hidden');
        singleDownload.classList.add('hidden');
        audioDownload.classList.add('hidden');

        // Get video and audio medias
        const videoMedias = data.medias ? data.medias.filter(m => m.type === 'video') : [];
        const audioMedias = data.medias ? data.medias.filter(m => m.type === 'audio') : [];

        if (videoMedias.length > 1) {
            // Multiple quality options
            this.setupQualityButtons(videoMedias);
            qualityOptions.classList.remove('hidden');
        } else if (videoMedias.length === 1) {
            // Single video option
            singleDownload.classList.remove('hidden');
        }

        // Show audio option if available
        if (audioMedias.length > 0) {
            audioDownload.classList.remove('hidden');
        }
    }

    setupQualityButtons(videoMedias) {
        const qualityButtons = document.querySelectorAll('.quality-btn');
        
        // Map medias to quality buttons
        const qualityMap = this.mapQualities(videoMedias);

        qualityButtons.forEach(btn => {
            const quality = btn.dataset.quality;
            const media = qualityMap[quality];

            if (media) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.dataset.url = media.url;
                
                // Update file size
                const sizeElement = btn.querySelector('.file-size');
                if (media.data_size) {
                    sizeElement.textContent = this.formatFileSize(media.data_size);
                } else {
                    sizeElement.textContent = '';
                }
            } else {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.querySelector('.file-size').textContent = 'Not available';
            }
        });
    }

    mapQualities(videoMedias) {
        const qualityMap = {
            '380p': null,
            '720p': null,
            '1080p': null
        };

        videoMedias.forEach(media => {
            const quality = media.quality?.toLowerCase() || '';
            
            // Map to standard qualities
            if (quality.includes('hd') || quality.includes('1080') || quality.includes('high')) {
                if (!qualityMap['1080p']) qualityMap['1080p'] = media;
            } else if (quality.includes('720') || quality.includes('medium') || quality.includes('no_watermark')) {
                if (!qualityMap['720p']) qualityMap['720p'] = media;
            } else if (quality.includes('380') || quality.includes('480') || quality.includes('low') || quality.includes('watermark')) {
                if (!qualityMap['380p']) qualityMap['380p'] = media;
            } else {
                // Fallback assignment
                for (const res of ['1080p', '720p', '380p']) {
                    if (!qualityMap[res]) {
                        qualityMap[res] = media;
                        break;
                    }
                }
            }
        });

        return qualityMap;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    downloadQuality(button) {
        const url = button.dataset.url;
        const quality = button.dataset.quality;
        
        if (url) {
            this.initiateDownload(url, `video_${quality}_${Date.now()}.mp4`);
            this.showSuccessAnimation(button);
        }
    }

    downloadSingle() {
        if (this.currentData && this.currentData.medias) {
            const videoMedia = this.currentData.medias.find(m => m.type === 'video');
            if (videoMedia) {
                this.initiateDownload(videoMedia.url, `video_${Date.now()}.mp4`);
                this.showSuccessAnimation(document.getElementById('download-video'));
            }
        }
    }

    downloadAudio() {
        if (this.currentData && this.currentData.medias) {
            const audioMedia = this.currentData.medias.find(m => m.type === 'audio');
            if (audioMedia) {
                this.initiateDownload(audioMedia.url, `audio_${Date.now()}.mp3`);
                this.showSuccessAnimation(document.getElementById('download-audio'));
            }
        }
    }

    initiateDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    showSuccessAnimation(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        button.style.background = 'linear-gradient(45deg, #10b981, #34d399)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        document.getElementById('error-message').classList.add('hidden');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SocialDownloader();
});

// Add some additional animations and effects
document.addEventListener('DOMContentLoaded', () => {
    // Add particle effect to background
    createParticles();
    
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    particlesContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;
    
    document.body.appendChild(particlesContainer);
    
    // Create floating particles
    for (let i = 0; i < 50; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: linear-gradient(45deg, #8b5cf6, #ec4899);
        border-radius: 50%;
        opacity: 0.6;
        animation: float ${Math.random() * 10 + 10}s linear infinite;
    `;
    
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 10 + 's';
    
    container.appendChild(particle);
    
    // Add floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.6;
            }
            90% {
                opacity: 0.6;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}