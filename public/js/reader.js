// reader.js - Enhanced fiction reader with Markdown support

// Reader settings & state
const readerSettings = {
    fontSize: 18,
    lineSpacing: 1.8,
    theme: 'dark',
    lastBook: null,
    lastChapter: null,
    lastPosition: 0
};

// State management
let currentBook = null;
let currentChapter = null;
let currentPageIndex = 0;
let totalPages = 1;
let pages = [];
let isSpeaking = false;
let synth = window.speechSynthesis;
let utterance = null;

// DOM Elements
let readerElement, readerTitle, readerContent, readerPage;
let closeReaderBtn, prevChapterBtn, nextChapterBtn, prevPageBtn, nextPageBtn;
let toggleSettingsBtn, readerSettings;
let fontSizeControls, lineSpacingControls, themeControls;
let toggleTTSBtn;

// Initialize the reader
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on a reader page
    if (!document.getElementById('reader')) return;
    
    initDOMReferences();
    initEventListeners();
    loadUserPreferences();
    applyUserPreferences();
    
    // Get book and chapter from URL
    const urlParams = parseUrlParams();
    
    if (urlParams.bookId) {
        loadBook(urlParams.bookId, urlParams.chapterId);
    }
});

// Initialize DOM references
function initDOMReferences() {
    readerElement = document.getElementById('reader');
    readerTitle = document.getElementById('readerTitle');
    readerContent = document.getElementById('readerContent');
    readerPage = document.getElementById('readerPage');
    
    closeReaderBtn = document.getElementById('closeReader');
    prevChapterBtn = document.getElementById('prevChapter');
    nextChapterBtn = document.getElementById('nextChapter');
    prevPageBtn = document.getElementById('prevPage');
    nextPageBtn = document.getElementById('nextPage');
    
    toggleSettingsBtn = document.getElementById('toggleSettings');
    readerSettings = document.getElementById('readerSettings');
    
    // Font size controls
    if (document.getElementById('increaseFontSize')) {
        fontSizeControls = {
            increase: document.getElementById('increaseFontSize'),
            decrease: document.getElementById('decreaseFontSize')
        };
    }
    
    // Line spacing controls
    if (document.getElementById('increaseLineSpacing')) {
        lineSpacingControls = {
            increase: document.getElementById('increaseLineSpacing'),
            decrease: document.getElementById('decreaseLineSpacing')
        };
    }
    
    // Theme controls
    if (document.getElementById('lightTheme')) {
        themeControls = {
            light: document.getElementById('lightTheme'),
            sepia: document.getElementById('sepiaTheme'),
            dark: document.getElementById('darkTheme')
        };
    }
    
    toggleTTSBtn = document.getElementById('toggleTTS');
}

// Initialize event listeners
function initEventListeners() {
    // Close button
    if (closeReaderBtn) {
        closeReaderBtn.addEventListener('click', function() {
            saveReadingPosition();
            goToBookIndex();
        });
    }
    
    // Chapter navigation
    if (prevChapterBtn) {
        prevChapterBtn.addEventListener('click', function() {
            if (!currentBook || !currentChapter) return;
            
            const chapters = currentBook.chapters;
            const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
            
            if (currentIndex > 0) {
                navigateToChapter(chapters[currentIndex - 1].id);
            }
        });
    }
    
    if (nextChapterBtn) {
        nextChapterBtn.addEventListener('click', function() {
            if (!currentBook || !currentChapter) return;
            
            const chapters = currentBook.chapters;
            const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
            
            if (currentIndex < chapters.length - 1) {
                navigateToChapter(chapters[currentIndex + 1].id);
            }
        });
    }
    
    // Page navigation
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPageIndex > 0) {
                showPage(currentPageIndex - 1);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            if (currentPageIndex < totalPages - 1) {
                showPage(currentPageIndex + 1);
            }
        });
    }
    
    // Settings toggle
    if (toggleSettingsBtn && readerSettings) {
        toggleSettingsBtn.addEventListener('click', function() {
            readerSettings.classList.toggle('active');
        });
    }
    
    // Font size controls
    if (fontSizeControls) {
        fontSizeControls.increase.addEventListener('click', function() {
            changeFontSize(1);
        });
        
        fontSizeControls.decrease.addEventListener('click', function() {
            changeFontSize(-1);
        });
    }
    
    // Line spacing controls
    if (lineSpacingControls) {
        lineSpacingControls.increase.addEventListener('click', function() {
            changeLineSpacing(0.1);
        });
        
        lineSpacingControls.decrease.addEventListener('click', function() {
            changeLineSpacing(-0.1);
        });
    }
    
    // Theme controls
    if (themeControls) {
        themeControls.light.addEventListener('click', function() {
            setTheme('light');
        });
        
        themeControls.sepia.addEventListener('click', function() {
            setTheme('sepia');
        });
        
        themeControls.dark.addEventListener('click', function() {
            setTheme('dark');
        });
    }
    
    // Text-to-speech
    if (toggleTTSBtn) {
        toggleTTSBtn.addEventListener('click', function() {
            toggleTextToSpeech();
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only handle if reader is active
        if (!readerElement || readerElement.style.display !== 'block') return;
        
        switch (e.key) {
            case 'ArrowLeft':
                prevPageBtn.click();
                break;
            case 'ArrowRight':
                nextPageBtn.click();
                break;
            case 'Escape':
                closeReaderBtn.click();
                break;
        }
    });
}

// Load user preferences from localStorage
function loadUserPreferences() {
    const savedPrefs = localStorage.getItem('readerSettings');
    
    if (savedPrefs) {
        try {
            const parsedPrefs = JSON.parse(savedPrefs);
            Object.assign(readerSettings, parsedPrefs);
        } catch (e) {
            console.error('Error parsing saved preferences', e);
        }
    }
}

// Apply user preferences to the reader
function applyUserPreferences() {
    if (readerContent) {
        readerContent.style.fontSize = `${readerSettings.fontSize}px`;
    }
    
    if (readerPage) {
        readerPage.style.lineHeight = readerSettings.lineSpacing;
    }
    
    setTheme(readerSettings.theme, false); // Don't save when applying initial settings
}

// Save user preferences to localStorage
function saveUserPreferences() {
    localStorage.setItem('readerSettings', JSON.stringify(readerSettings));
}

// Save current reading position
function saveReadingPosition() {
    if (!currentBook || !currentChapter) return;
    
    readerSettings.lastBook = currentBook.id;
    readerSettings.lastChapter = currentChapter.id;
    readerSettings.lastPosition = currentPageIndex;
    
    saveUserPreferences();
}

// Change font size
function changeFontSize(delta) {
    const newSize = Math.max(12, Math.min(32, readerSettings.fontSize + delta));
    readerSettings.fontSize = newSize;
    
    if (readerContent) {
        readerContent.style.fontSize = `${newSize}px`;
    }
    
    saveUserPreferences();
    paginateContent(); // Recalculate pages based on new font size
}

// Change line spacing
function changeLineSpacing(delta) {
    const newSpacing = Math.max(1.0, Math.min(3.0, 
        parseFloat(readerSettings.lineSpacing) + delta
    )).toFixed(1);
    
    readerSettings.lineSpacing = newSpacing;
    
    if (readerPage) {
        readerPage.style.lineHeight = newSpacing;
    }
    
    saveUserPreferences();
    paginateContent(); // Recalculate pages based on new spacing
}

// Set theme
function setTheme(theme, save = true) {
    readerSettings.theme = theme;
    
    if (readerContent) {
        readerContent.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
        readerContent.classList.add(`theme-${theme}`);
    }
    
    // Update theme buttons
    if (themeControls) {
        Object.values(themeControls).forEach(btn => btn.classList.remove('active'));
        themeControls[theme]?.classList.add('active');
    }
    
    if (save) {
        saveUserPreferences();
    }
}

// Toggle text-to-speech
function toggleTextToSpeech() {
    if (!window.speechSynthesis) {
        alert('Seu navegador não suporta narração por voz.');
        return;
    }
    
    if (isSpeaking) {
        stopSpeech();
    } else {
        startSpeech();
    }
}

// Start speech
function startSpeech() {
    if (isSpeaking || !window.speechSynthesis) return;
    
    const currentPageText = readerPage.textContent;
    
    utterance = new SpeechSynthesisUtterance(currentPageText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    
    // When the speech ends
    utterance.onend = function() {
        isSpeaking = false;
        
        // If there are more pages, go to next page and continue reading
        if (currentPageIndex < totalPages - 1) {
            showPage(currentPageIndex + 1);
            startSpeech();
        } else {
            // If we're at the last page, update the TTS button
            if (toggleTTSBtn) {
                toggleTTSBtn.textContent = '🔊';
                toggleTTSBtn.title = 'Iniciar Narração';
            }
        }
    };
    
    synth.speak(utterance);
    isSpeaking = true;
    
    // Update the TTS button
    if (toggleTTSBtn) {
        toggleTTSBtn.textContent = '🔇';
        toggleTTSBtn.title = 'Parar Narração';
    }
}

// Stop speech
function stopSpeech() {
    if (!isSpeaking || !window.speechSynthesis) return;
    
    synth.cancel();
    isSpeaking = false;
    
    // Update the TTS button
    if (toggleTTSBtn) {
        toggleTTSBtn.textContent = '🔊';
        toggleTTSBtn.title = 'Iniciar Narração';
    }
}

// Navigate to a chapter
function navigateToChapter(chapterId) {
    if (!currentBook) return;
    
    // Construct the URL for the chapter
    const url = `/fiction/${currentBook.id}/${chapterId}`;
    window.location.href = url;
}

// Load book data
async function loadBook(bookId, chapterId = null) {
    try {
        // Use fetch to get the book data
        const response = await fetch(`/fiction/${bookId}/book.json`);
        
        if (!response.ok) {
            throw new Error(`Failed to load book data: ${response.statusText}`);
        }
        
        currentBook = await response.json();
        
        // Determine which chapter to load
        let targetChapterId = chapterId;
        
        if (!targetChapterId) {
            // Try to resume from last position
            if (readerSettings.lastBook === bookId && readerSettings.lastChapter) {
                targetChapterId = readerSettings.lastChapter;
            } else {
                // Default to the first chapter
                targetChapterId = currentBook.chapters[0]?.id;
            }
        }
        
        if (targetChapterId) {
            loadChapter(bookId, targetChapterId);
        }
    } catch (error) {
        console.error('Error loading book:', error);
        showError(`Erro ao carregar o livro: ${error.message}`);
    }
}

// Load chapter content
async function loadChapter(bookId, chapterId) {
    try {
        // Find the chapter in the book data
        if (!currentBook || !currentBook.chapters) {
            throw new Error('Book data not loaded');
        }
        
        currentChapter = currentBook.chapters.find(ch => ch.id === chapterId);
        
        if (!currentChapter) {
            throw new Error(`Chapter ${chapterId} not found`);
        }
        
        // Update title
        if (readerTitle) {
            readerTitle.textContent = `${currentBook.title} - ${currentChapter.title}`;
        }
        
        // Load the markdown content
        const response = await fetch(`/fiction/${bookId}/content/${chapterId}.md`);
        
        if (!response.ok) {
            throw new Error(`Failed to load chapter content: ${response.statusText}`);
        }
        
        const markdown = await response.text();
        
        // Convert markdown to HTML
        let htmlContent;
        if (window.marked) {
            htmlContent = marked.parse(markdown);
        } else {
            // Fallback for simple paragraph conversion
            htmlContent = markdown.split('\n\n')
                .map(p => p.trim())
                .filter(p => p.length > 0)
                .map(p => `<p>${p}</p>`)
                .join('\n');
        }
        
        // Update the page content
        if (readerPage) {
            readerPage.innerHTML = htmlContent;
            
            // Paginate the content
            setTimeout(() => {
                paginateContent();
                
                // Try to restore position if we're returning to the same chapter
                if (readerSettings.lastBook === currentBook.id && 
                    readerSettings.lastChapter === currentChapter.id) {
                    showPage(readerSettings.lastPosition);
                } else {
                    showPage(0);
                }
            }, 100);
        }
        
        // Update chapter navigation buttons
        updateChapterNavigationButtons();
        
    } catch (error) {
        console.error('Error loading chapter:', error);
        showError(`Erro ao carregar o capítulo: ${error.message}`);
    }
}

// Update chapter navigation buttons based on current chapter
function updateChapterNavigationButtons() {
    if (!currentBook || !currentChapter) return;
    
    const chapters = currentBook.chapters;
    const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
    
    if (prevChapterBtn) {
        prevChapterBtn.disabled = currentIndex <= 0;
    }
    
    if (nextChapterBtn) {
        nextChapterBtn.disabled = currentIndex >= chapters.length - 1;
    }
}

// Paginate content into virtual pages
function paginateContent() {
    if (!readerPage || !readerContent) return;
    
    pages = [];
    currentPageIndex = 0;
    
    // Create a temporary div to measure content
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.width = `${readerContent.clientWidth - 40}px`; // Account for padding
    tempDiv.style.fontSize = `${readerSettings.fontSize}px`;
    tempDiv.style.lineHeight = readerSettings.lineSpacing;
    
    document.body.appendChild(tempDiv);
    
    // Get all paragraphs
    const paragraphs = Array.from(readerPage.querySelectorAll('p'));
    let currentPage = '';
    let currentHeight = 0;
    const maxHeight = readerContent.clientHeight - 40; // Account for padding
    
    paragraphs.forEach(paragraph => {
        // Clone the paragraph to measure its height
        tempDiv.innerHTML = paragraph.outerHTML;
        const paraHeight = tempDiv.offsetHeight;
        
        // If adding this paragraph would exceed the page height, start a new page
        if (currentHeight + paraHeight > maxHeight && currentHeight > 0) {
            pages.push(currentPage);
            currentPage = paragraph.outerHTML;
            currentHeight = paraHeight;
        } else {
            currentPage += paragraph.outerHTML;
            currentHeight += paraHeight;
        }
    });
    
    // Add the last page if it has content
    if (currentPage) {
        pages.push(currentPage);
    }
    
    // Cleanup
    document.body.removeChild(tempDiv);
    
    // Make sure we have at least one page
    if (pages.length === 0) {
        pages.push(readerPage.innerHTML);
    }
    
    totalPages = pages.length;
    
    // Update page navigation buttons
    updatePageNavigationButtons();
}

// Update page navigation buttons based on current page
function updatePageNavigationButtons() {
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPageIndex <= 0;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPageIndex >= totalPages - 1;
    }
}

// Show a specific page
function showPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    
    // Stop speech if active
    if (isSpeaking) {
        stopSpeech();
    }
    
    // Apply page transition effect
    const direction = pageIndex > currentPageIndex ? 'right' : 'left';
    applyPageTransition(direction, () => {
        currentPageIndex = pageIndex;
        readerPage.innerHTML = pages[pageIndex];
        
        // Update navigation
        updatePageNavigationButtons();
        saveReadingPosition();
    });
}

// Apply a smooth page transition effect
function applyPageTransition(direction, callback) {
    if (!readerPage) {
        callback();
        return;
    }
    
    // Add the appropriate transition class
    if (direction === 'right') {
        readerPage.classList.add('slide-left-out');
    } else {
        readerPage.classList.add('slide-right-out');
    }
    
    // Wait for the transition to complete
    setTimeout(() => {
        // Execute the callback to change content
        callback();
        
        // Remove the out transition and add the in transition
        readerPage.classList.remove('slide-left-out', 'slide-right-out');
        
        if (direction === 'right') {
            readerPage.classList.add('slide-right-in');
        } else {
            readerPage.classList.add('slide-left-in');
        }
        
        // Remove the in transition after it completes
        setTimeout(() => {
            readerPage.classList.remove('slide-right-in', 'slide-left-in');
        }, 300);
    }, 300);
}

// Go to the book index page
function goToBookIndex() {
    if (!currentBook) return;
    window.location.href = `/fiction/${currentBook.id}/`;
}

// Show an error message to the user
function showError(message) {
    if (readerPage) {
        readerPage.innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <h3>Erro</h3>
                <p>${message}</p>
                <button onclick="goToBookIndex()">Voltar</button>
            </div>
        `;
    }
}

// Parse URL parameters to get book and chapter IDs
function parseUrlParams() {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    
    if (pathParts.length >= 2 && pathParts[0] === 'fiction') {
        const bookId = pathParts[1];
        const chapterId = pathParts.length >= 3 ? pathParts[2] : null;
        
        return { bookId, chapterId };
    }
    
    return {};
}