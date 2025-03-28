// markdown-loader.js - Handles loading and rendering markdown content for fiction chapters

// Include a lightweight markdown parser (you'll need to add this to your dependencies)
// We'll use marked.js which is a popular and lightweight option
// Add this to your HTML: <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

class FictionContentLoader {
  constructor() {
    this.templateCache = null;
    this.bookData = {};
    this.initializeParsers();
  }

  initializeParsers() {
    // Configure marked options if needed
    if (window.marked) {
      marked.setOptions({
        breaks: true,      // Convert \n to <br>
        smartLists: true,  // Use smarter list behavior
        smartypants: true  // Use "smart" typographic punctuation
      });
    }
  }

  /**
   * Load a chapter from a markdown file
   * @param {string} bookId - The book identifier
   * @param {string} chapterId - The chapter identifier
   * @returns {Promise<string>} - HTML content
   */
  async loadChapter(bookId, chapterId) {
    try {
      // Get book metadata first if we don't have it yet
      if (!this.bookData[bookId]) {
        await this.loadBookMetadata(bookId);
      }

      // Get chapter info
      const chapterInfo = this.findChapterInfo(bookId, chapterId);
      if (!chapterInfo) {
        throw new Error(`Chapter ${chapterId} not found in book ${bookId}`);
      }

      // Load the markdown content
      const mdPath = `/fiction/${bookId}/content/${chapterId}.md`;
      const response = await fetch(mdPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load markdown: ${response.statusText}`);
      }

      const markdown = await response.text();
      
      // Convert markdown to HTML
      let htmlContent;
      if (window.marked) {
        htmlContent = marked.parse(markdown);
      } else {
        // Fallback - basic paragraph wrapping if marked isn't available
        htmlContent = markdown.split('\n\n')
          .map(para => para.trim())
          .filter(para => para.length > 0)
          .map(para => `<p>${para}</p>`)
          .join('\n');
      }

      // Load template if we haven't yet
      if (!this.templateCache) {
        await this.loadTemplate();
      }

      // Fill in the template
      return this.applyTemplate(bookId, chapterInfo, htmlContent);
    } catch (error) {
      console.error("Error loading chapter:", error);
      return `<p>Error loading chapter: ${error.message}</p>`;
    }
  }

  /**
   * Load book metadata from the book.json file
   * @param {string} bookId - The book identifier
   */
  async loadBookMetadata(bookId) {
    try {
      const response = await fetch(`/fiction/${bookId}/book.json`);
      if (!response.ok) {
        throw new Error(`Failed to load book metadata: ${response.statusText}`);
      }
      
      this.bookData[bookId] = await response.json();
      return this.bookData[bookId];
    } catch (error) {
      console.error("Error loading book metadata:", error);
      throw error;
    }
  }

  /**
   * Find chapter information in the book metadata
   * @param {string} bookId - The book identifier
   * @param {string} chapterId - The chapter identifier
   * @returns {Object|null} - Chapter info or null if not found
   */
  findChapterInfo(bookId, chapterId) {
    const book = this.bookData[bookId];
    if (!book || !book.chapters) return null;
    
    return book.chapters.find(ch => ch.id === chapterId) || null;
  }

  /**
   * Load the chapter template HTML
   */
  async loadTemplate() {
    try {
      const response = await fetch('/templates/fiction-chapter.html');
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      
      this.templateCache = await response.text();
    } catch (error) {
      console.error("Error loading template:", error);
      // Create a simple fallback template
      this.templateCache = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{BOOK_TITLE}} - {{CHAPTER_TITLE}}</title>
            <link rel="stylesheet" href="/css/fiction.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;700&family=EB+Garamond:wght@400;700&family=Sora:wght@400;700&family=Josefin+Sans:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body class="no-context">
            <div id="reader" class="reader" style="display: block;">
                <div class="reader-header">
                    <div class="reader-title" id="readerTitle">{{BOOK_TITLE}} - {{CHAPTER_TITLE}}</div>
                    <div class="reader-controls">
                        <button id="toggleSettings" class="settings-btn" title="Configurações de Leitura">⚙️</button>
                        <button id="toggleTTS" class="settings-btn" title="Narração por Voz">🔊</button>
                        <button id="closeReader" title="Voltar">&times;</button>
                    </div>
                </div>
                
                <div id="readerSettings" class="reader-settings">
                    <div class="settings-group">
                        <h4>Tamanho da Fonte</h4>
                        <div class="font-size-controls">
                            <button id="decreaseFontSize" class="settings-btn">A-</button>
                            <button id="increaseFontSize" class="settings-btn">A+</button>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <h4>Espaçamento</h4>
                        <div class="line-spacing-controls">
                            <button id="decreaseLineSpacing" class="settings-btn">↕-</button>
                            <button id="increaseLineSpacing" class="settings-btn">↕+</button>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <h4>Tema</h4>
                        <div class="theme-controls">
                            <div id="lightTheme" class="theme-btn theme-light" title="Claro"></div>
                            <div id="sepiaTheme" class="theme-btn theme-sepia" title="Sépia"></div>
                            <div id="darkTheme" class="theme-btn theme-dark active" title="Escuro"></div>
                        </div>
                    </div>
                </div>
                
                <div class="reader-content" id="readerContent">
                    <div id="readerPage" class="reader-page">
                        {{CHAPTER_CONTENT}}
                    </div>
                </div>
                
                <div class="pagination">
                    <button id="prevChapter" {{PREV_CHAPTER_DISABLED}}>Capítulo Anterior</button>
                    <button id="nextChapter" {{NEXT_CHAPTER_DISABLED}}>Próximo Capítulo</button>
                </div>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <script src="/js/main.js"></script>
            <script src="/js/reader.js"></script>
        </body>
        </html>
      `;
    }
  }

  /**
   * Apply the template with the chapter content and metadata
   * @param {string} bookId - The book identifier
   * @param {Object} chapterInfo - Chapter metadata
   * @param {string} htmlContent - The HTML content for the chapter
   * @returns {string} - Completed HTML
   */
  applyTemplate(bookId, chapterInfo, htmlContent) {
    const book = this.bookData[bookId];
    const chapterIndex = book.chapters.findIndex(ch => ch.id === chapterInfo.id);
    const isFirstChapter = chapterIndex === 0;
    const isLastChapter = chapterIndex === book.chapters.length - 1;

    let result = this.templateCache
      .replace(/{{BOOK_TITLE}}/g, book.title)
      .replace(/{{CHAPTER_TITLE}}/g, chapterInfo.title)
      .replace(/{{CHAPTER_CONTENT}}/g, htmlContent)
      .replace(/{{PREV_CHAPTER_DISABLED}}/g, isFirstChapter ? 'disabled' : '')
      .replace(/{{NEXT_CHAPTER_DISABLED}}/g, isLastChapter ? 'disabled' : '');
    
    return result;
  }
}

// Initialize and expose globally for use
window.fictionLoader = new FictionContentLoader();
