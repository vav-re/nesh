// reader.js - Funções para o leitor de conteúdo de ficção Shem

// Configurações padrão do leitor
const defaultReaderSettings = {
    fontSize: 18,
    lineSpacing: 1.8,
    theme: 'dark',
    lastBook: null,
    lastChapter: 0,
    lastPage: 0
};

// Estado atual do leitor
let currentBook = null;
let currentChapterIndex = 0;
let currentPageIndex = 0;
let totalPages = 1;
let pages = [];
let synth = window.speechSynthesis;
let utterance = null;
let isSpeaking = false;

// DOM Elements (serão inicializados quando o DOM estiver pronto)
let readerElement, readerTitle, readerContent, readerPage;
let closeReaderBtn, prevChapterBtn, nextChapterBtn, prevPageBtn, nextPageBtn;
let toggleSettingsBtn, readerSettings;
let increaseFontSizeBtn, decreaseFontSizeBtn;
let increaseLineSpacingBtn, decreaseLineSpacingBtn;
let lightThemeBtn, sepiaThemeBtn, darkThemeBtn;
let toggleTTSBtn, playTTSBtn, pauseTTSBtn, stopTTSBtn;

// Inicializar o leitor de ficção
function initFictionReader() {
    // Verificar se estamos em uma página de leitor de ficção
    if (!document.getElementById('reader')) {
        return; // Não estamos na página do leitor
    }
    
    // Inicializar referências aos elementos DOM
    initDOMReferences();
    
    // Carregar preferências do usuário
    loadUserPreferences();
    
    // Adicionar event listeners
    setupEventListeners();
    
    // Obter informações do livro e capítulo da URL
    const bookId = getBookIdFromURL();
    const chapterId = getChapterIdFromURL();
    
    if (bookId) {
        openBook(bookId, chapterId);
    }
}

// Inicializar referências aos elementos DOM
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
    
    increaseFontSizeBtn = document.getElementById('increaseFontSize');
    decreaseFontSizeBtn = document.getElementById('decreaseFontSize');
    increaseLineSpacingBtn = document.getElementById('increaseLineSpacing');
    decreaseLineSpacingBtn = document.getElementById('decreaseLineSpacing');
    
    lightThemeBtn = document.getElementById('lightTheme');
    sepiaThemeBtn = document.getElementById('sepiaTheme');
    darkThemeBtn = document.getElementById('darkTheme');
    
    toggleTTSBtn = document.getElementById('toggleTTS');
    playTTSBtn = document.getElementById('playTTS');
    pauseTTSBtn = document.getElementById('pauseTTS');
    stopTTSBtn = document.getElementById('stopTTS');
}

// Carregar preferências do usuário do localStorage
function loadUserPreferences() {
    // Obter as preferências salvas ou usar as padrão
    const savedPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
    
    // Aplicar preferências
    if (readerContent && readerPage) {
        // Aplicar tamanho da fonte
        readerContent.style.fontSize = `${savedPrefs.fontSize}px`;
        
        // Aplicar espaçamento entre linhas
        readerPage.style.lineHeight = savedPrefs.lineSpacing;
        
        // Aplicar tema
        setTheme(savedPrefs.theme);
        
        // Atualizar botões de tema
        updateThemeButtons(savedPrefs.theme);
    }
}

// Atualizar os botões de tema para refletir o tema atual
function updateThemeButtons(theme) {
    if (lightThemeBtn && sepiaThemeBtn && darkThemeBtn) {
        lightThemeBtn.classList.remove('active');
        sepiaThemeBtn.classList.remove('active');
        darkThemeBtn.classList.remove('active');
        
        switch (theme) {
            case 'light':
                lightThemeBtn.classList.add('active');
                break;
            case 'sepia':
                sepiaThemeBtn.classList.add('active');
                break;
            case 'dark':
            default:
                darkThemeBtn.classList.add('active');
                break;
        }
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botão de fechar o leitor
    if (closeReaderBtn) {
        closeReaderBtn.addEventListener('click', () => {
            stopSpeech();
            readerElement.style.display = 'none';
            // Redirecionar para a página principal do livro
            const bookId = getBookIdFromURL();
            if (bookId) {
                window.location.href = `/fiction/${bookId}/`;
            }
        });
    }
    
    // Navegação entre capítulos
    if (prevChapterBtn) {
        prevChapterBtn.addEventListener('click', () => {
            if (currentChapterIndex > 0) {
                navigateToChapter(currentChapterIndex - 1);
            }
        });
    }
    
    if (nextChapterBtn) {
        nextChapterBtn.addEventListener('click', () => {
            // Lógica para determinar o número máximo de capítulos
            const maxChapters = currentBook?.chapters?.length || 1;
            if (currentChapterIndex < maxChapters - 1) {
                navigateToChapter(currentChapterIndex + 1);
            }
        });
    }
    
    // Navegação entre páginas
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPageIndex > 0) {
                showPage(currentPageIndex - 1);
            } else if (currentChapterIndex > 0) {
                // Ir para o último página do capítulo anterior
                navigateToChapter(currentChapterIndex - 1, 'last');
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPageIndex < totalPages - 1) {
                showPage(currentPageIndex + 1);
            } else {
                // Verificar se há próximo capítulo
                const maxChapters = currentBook?.chapters?.length || 1;
                if (currentChapterIndex < maxChapters - 1) {
                    navigateToChapter(currentChapterIndex + 1, 'first');
                }
            }
        });
    }
    
    // Botão de configurações
    if (toggleSettingsBtn && readerSettings) {
        toggleSettingsBtn.addEventListener('click', () => {
            readerSettings.classList.toggle('active');
        });
    }
    
    // Controles de tamanho da fonte
    if (increaseFontSizeBtn) {
        increaseFontSizeBtn.addEventListener('click', () => {
            const currentPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
            currentPrefs.fontSize = Math.min(currentPrefs.fontSize + 1, 32);
            readerContent.style.fontSize = `${currentPrefs.fontSize}px`;
            saveUserPreferences('shemReaderPreferences', currentPrefs);
            paginateContent();
        });
    }
    
    if (decreaseFontSizeBtn) {
        decreaseFontSizeBtn.addEventListener('click', () => {
            const currentPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
            currentPrefs.fontSize = Math.max(currentPrefs.fontSize - 1, 12);
            readerContent.style.fontSize = `${currentPrefs.fontSize}px`;
            saveUserPreferences('shemReaderPreferences', currentPrefs);
            paginateContent();
        });
    }
    
    // Controles de espaçamento entre linhas
    if (increaseLineSpacingBtn) {
        increaseLineSpacingBtn.addEventListener('click', () => {
            const currentPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
            currentPrefs.lineSpacing = Math.min(parseFloat(currentPrefs.lineSpacing) + 0.1, 3.0).toFixed(1);
            readerPage.style.lineHeight = currentPrefs.lineSpacing;
            saveUserPreferences('shemReaderPreferences', currentPrefs);
            paginateContent();
        });
    }
    
    if (decreaseLineSpacingBtn) {
        decreaseLineSpacingBtn.addEventListener('click', () => {
            const currentPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
            currentPrefs.lineSpacing = Math.max(parseFloat(currentPrefs.lineSpacing) - 0.1, 1.0).toFixed(1);
            readerPage.style.lineHeight = currentPrefs.lineSpacing;
            saveUserPreferences('shemReaderPreferences', currentPrefs);
            paginateContent();
        });
    }
    
    // Controles de tema
    if (lightThemeBtn) {
        lightThemeBtn.addEventListener('click', () => {
            setTheme('light');
            updateThemeButtons('light');
        });
    }
    
    if (sepiaThemeBtn) {
        sepiaThemeBtn.addEventListener('click', () => {
            setTheme('sepia');
            updateThemeButtons('sepia');
        });
    }
    
    if (darkThemeBtn) {
        darkThemeBtn.addEventListener('click', () => {
            setTheme('dark');
            updateThemeButtons('dark');
        });
    }
    
    // Controles de text-to-speech
    if (toggleTTSBtn) {
        toggleTTSBtn.addEventListener('click', () => {
            if (!isSpeaking) {
                startSpeech();
            } else {
                stopSpeech();
            }
        });
    }
    
    if (playTTSBtn) {
        playTTSBtn.addEventListener('click', startSpeech);
    }
    
    if (pauseTTSBtn) {
        pauseTTSBtn.addEventListener('click', pauseSpeech);
    }
    
    if (stopTTSBtn) {
        stopTTSBtn.addEventListener('click', stopSpeech);
    }
    
    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
        if (readerElement.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                prevPageBtn.click();
            } else if (e.key === 'ArrowRight') {
                nextPageBtn.click();
            } else if (e.key === 'Escape') {
                closeReaderBtn.click();
            }
        }
    });
}

// Obter o ID do livro da URL
function getBookIdFromURL() {
    const path = window.location.pathname;
    const matches = path.match(/\/fiction\/([^\/]+)/);
    return matches ? matches[1] : null;
}

// Obter o ID do capítulo da URL
function getChapterIdFromURL() {
    const path = window.location.pathname;
    const matches = path.match(/\/fiction\/[^\/]+\/([^\/]+)/);
    return matches ? matches[1] : null;
}

// Abrir um livro
function openBook(bookId, chapterId = null) {
    // Aqui você faria uma requisição para obter os metadados do livro
    // Por exemplo, em uma implementação real, você poderia fazer uma requisição fetch
    // fetch(`/api/books/${bookId}`).then(...)
    
    // Por enquanto, vamos simular com dados locais
    getBookData(bookId).then(bookData => {
        currentBook = bookData;
        
        // Determinar qual capítulo abrir
        let chapterIndex = 0;
        
        if (chapterId) {
            // Encontrar o índice do capítulo pelo ID
            const index = bookData.chapters.findIndex(ch => ch.id === chapterId);
            if (index !== -1) {
                chapterIndex = index;
            }
        } else {
            // Verificar se há uma posição salva para este livro
            const savedPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
            if (savedPrefs.lastBook === bookId && savedPrefs.lastChapter !== undefined) {
                chapterIndex = savedPrefs.lastChapter;
            }
        }
        
        // Abrir o capítulo
        navigateToChapter(chapterIndex);
    }).catch(error => {
        console.error('Erro ao carregar o livro:', error);
    });
}

// Navegar para um capítulo específico
function navigateToChapter(chapterIndex, pagePosition = null) {
    if (!currentBook || !currentBook.chapters) return;
    
    // Validar o índice do capítulo
    if (chapterIndex < 0 || chapterIndex >= currentBook.chapters.length) {
        console.error('Índice de capítulo inválido:', chapterIndex);
        return;
    }
    
    // Parar qualquer narração em andamento
    stopSpeech();
    
    // Atualizar o índice do capítulo atual
    currentChapterIndex = chapterIndex;
    
    // Obter informações do capítulo
    const chapter = currentBook.chapters[chapterIndex];
    
    // Atualizar o título do leitor
    if (readerTitle) {
        readerTitle.textContent = `${currentBook.title} - ${chapter.title}`;
    }
    
    // Carregar o conteúdo do capítulo
    getChapterContent(currentBook.id, chapter.id).then(content => {
        // Inserir o conteúdo na página
        if (readerPage) {
            readerPage.innerHTML = content;
            
            // Mostrar o leitor se não estiver visível
            readerElement.style.display = 'block';
            
            // Paginar o conteúdo
            setTimeout(() => {
                paginateContent();
                
                // Posicionar na página adequada
                if (pagePosition === 'first') {
                    showPage(0);
                } else if (pagePosition === 'last') {
                    showPage(totalPages - 1);
                } else {
                    // Restaurar última posição se for o mesmo livro e capítulo
                    const savedPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
                    if (savedPrefs.lastBook === currentBook.id && 
                        savedPrefs.lastChapter === currentChapterIndex &&
                        savedPrefs.lastPage < totalPages) {
                        showPage(savedPrefs.lastPage);
                    } else {
                        showPage(0);
                    }
                }
            }, 100);
            
            // Salvar a posição de leitura
            saveReadingPosition();
        }
    }).catch(error => {
        console.error('Erro ao carregar o conteúdo do capítulo:', error);
    });
}

// Paginar o conteúdo
function paginateContent() {
    // Resetar a paginação
    pages = [];
    
    if (!readerContent || !readerPage) return;
    
    // Criar um elemento temporário para medir o conteúdo
    const tempElement = document.createElement('div');
    tempElement.innerHTML = readerPage.innerHTML;
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.width = `${readerContent.clientWidth - 40}px`; // Considerar o padding
    document.body.appendChild(tempElement);
    
    // Obter todos os parágrafos
    const paragraphs = tempElement.querySelectorAll('p');
    let currentPage = '';
    let currentHeight = 0;
    const maxHeight = readerContent.clientHeight - 40; // Considerar o padding
    
    // Agrupar parágrafos em páginas
    paragraphs.forEach(paragraph => {
        const clone = paragraph.cloneNode(true);
        const height = paragraph.offsetHeight;
        
        if (currentHeight + height > maxHeight) {
            // Iniciar uma nova página
            pages.push(currentPage);
            currentPage = clone.outerHTML;
            currentHeight = height;
        } else {
            // Adicionar à página atual
            currentPage += clone.outerHTML;
            currentHeight += height;
        }
    });
    
    // Adicionar a última página se tiver conteúdo
    if (currentPage) {
        pages.push(currentPage);
    }
    
    // Cleanup
    document.body.removeChild(tempElement);
    
    totalPages = pages.length || 1;
    
    // Atualizar botões de paginação
    updatePaginationButtons();
}

// Mostrar uma página específica
function showPage(pageIndex) {
    if (!pages.length || pageIndex < 0 || pageIndex >= pages.length) return;
    
    // Adicionar animação
    if (pageIndex > currentPageIndex) {
        readerPage.classList.add('slide-left-out');
        setTimeout(() => {
            currentPageIndex = pageIndex;
            readerPage.innerHTML = pages[pageIndex];
            readerPage.classList.remove('slide-left-out');
            readerPage.classList.add('slide-right-in');
            setTimeout(() => {
                readerPage.classList.remove('slide-right-in');
            }, 300);
        }, 300);
    } else if (pageIndex < currentPageIndex) {
        readerPage.classList.add('slide-right-out');
        setTimeout(() => {
            currentPageIndex = pageIndex;
            readerPage.innerHTML = pages[pageIndex];
            readerPage.classList.remove('slide-right-out');
            readerPage.classList.add('slide-left-in');
            setTimeout(() => {
                readerPage.classList.remove('slide-left-in');
            }, 300);
        }, 300);
    } else {
        currentPageIndex = pageIndex;
        readerPage.innerHTML = pages[pageIndex];
    }
    
    // Rolar para o topo
    readerPage.scrollTop = 0;
    
    // Salvar posição de leitura
    saveReadingPosition();
    
    // Atualizar botões de paginação
    updatePaginationButtons();
}

// Atualizar estado dos botões de paginação
function updatePaginationButtons() {
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPageIndex === 0 && currentChapterIndex === 0;
    }
    
    if (nextPageBtn) {
        const isLastChapter = currentChapterIndex === (currentBook?.chapters?.length - 1) || 0;
        const isLastPage = currentPageIndex === (totalPages - 1);
        nextPageBtn.disabled = isLastChapter && isLastPage;
    }
    
    if (prevChapterBtn) {
        prevChapterBtn.disabled = currentChapterIndex === 0;
    }
    
    if (nextChapterBtn) {
        const isLastChapter = currentChapterIndex === (currentBook?.chapters?.length - 1) || 0;
        nextChapterBtn.disabled = isLastChapter;
    }
}

// Salvar posição de leitura
function saveReadingPosition() {
    if (!currentBook) return;
    
    const currentPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
    currentPrefs.lastBook = currentBook.id;
    currentPrefs.lastChapter = currentChapterIndex;
    currentPrefs.lastPage = currentPageIndex;
    
    saveUserPreferences('shemReaderPreferences', currentPrefs);
}

// Definir o tema do leitor
function setTheme(theme) {
    if (!readerContent) return;
    
    // Remover classes de tema existentes
    readerContent.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
    
    // Adicionar a classe do tema selecionado
    readerContent.classList.add(`theme-${theme}`);
    
    // Salvar a preferência
    const currentPrefs = getUserPreferences('shemReaderPreferences', defaultReaderSettings);
    currentPrefs.theme = theme;
    saveUserPreferences('shemReaderPreferences', currentPrefs);
}

// Text-to-speech: iniciar narração
function startSpeech() {
    if (isSpeaking || !window.speechSynthesis) return;
    
    // Obter o texto da página atual
    const textToRead = readerPage.innerText;
    
    utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'pt-BR'; // Definir idioma para português
    
    // Evento quando a narração terminar
    utterance.onend = () => {
        isSpeaking = false;
        
        // Ir para a próxima página automaticamente se disponível
        if (currentPageIndex < totalPages - 1) {
            showPage(currentPageIndex + 1);
            setTimeout(() => startSpeech(), 500);
        } else if (currentChapterIndex < currentBook.chapters.length - 1) {
            // Ir para o próximo capítulo
            navigateToChapter(currentChapterIndex + 1);
            setTimeout(() => startSpeech(), 1000);
        }
    };
    
    synth.speak(utterance);
    isSpeaking = true;
}

// Text-to-speech: pausar narração
function pauseSpeech() {
    if (!window.speechSynthesis) return;
    
    if (synth.speaking) {
        if (synth.paused) {
            synth.resume();
        } else {
            synth.pause();
        }
    }
}

// Text-to-speech: parar narração
function stopSpeech() {
    if (!window.speechSynthesis) return;
    
    synth.cancel();
    isSpeaking = false;
}

// Funções de simulação para obter dados (em uma implementação real, usaria fetch para API ou arquivos)

// Simular obtenção de dados do livro
function getBookData(bookId) {
    // Em uma implementação real, você faria uma requisição para obter esses dados
    return new Promise((resolve) => {
        // Simular um livro
        resolve({
            id: 'ensaio-sobre-tempo',
            title: 'Ensaio sobre o Tempo',
            author: 'Seu Nome',
            description: 'Uma exploração ficcional das camadas do tempo...',
            chapters: [
                { id: 'capitulo1', title: 'Capítulo 1: O Início' },
                { id: 'capitulo2', title: 'Capítulo 2: Desvendando o Tempo' },
                { id: 'capitulo3', title: 'Capítulo 3: Além do Horizonte' }
                // Adicione mais capítulos conforme necessário
            ]
        });
    });
}

// Simular obtenção do conteúdo do capítulo
function getChapterContent(bookId, chapterId) {
    // Em uma implementação real, você faria uma requisição para obter o conteúdo
    return new Promise((resolve) => {
        // Simular conteúdo de capítulo
        if (chapterId === 'capitulo1') {
            resolve(`
                <p>Era uma tarde de outono quando percebi pela primeira vez que o tempo não é linear. As folhas caíam em uma dança circular, suspensas por um momento entre a árvore e o chão, como se hesitassem entre passado e futuro.</p>
                <p>O professor Eridano havia me alertado sobre isso anos antes, mas só agora eu compreendia verdadeiramente o que ele queria dizer. "O tempo", ele dizia, enquanto ajustava seus óculos redondos, "não é um rio que flui em uma única direção, mas um oceano em que estamos todos imersos, ondulando em múltiplas dimensões".</p>
                <p>Foi com essa reflexão que iniciei minha jornada de exploração pelo tecido temporal, sem saber que isso mudaria para sempre minha percepção da realidade.</p>
                <!-- Mais parágrafos de conteúdo -->
            `);
        } else if (chapterId === 'capitulo2') {
            resolve(`
                <p>As primeiras experiências foram desastrosas. O aparelho que construí no porão de minha casa, baseado nos esboços deixados pelo professor Eridano, oscilava entre momentos estáveis e colapsos energéticos que deixavam todo o quarteirão sem eletricidade.</p>
                <p>"Você está tentando domar o tempo com tecnologia crua", disse Elisa, minha colega de pesquisa e a única pessoa que não me considerava completamente insano. "O tempo responde melhor à consciência do que à matéria."</p>
                <p>Foi quando percebi que o instrumento verdadeiro não era a máquina, mas o observador. O tempo se comporta diferentemente quando é percebido.</p>
                <!-- Mais parágrafos de conteúdo -->
            `);
        } else {
            resolve(`
                <p>Conteúdo simulado para o capítulo ${chapterId}. Em uma implementação real, este conteúdo seria carregado de um arquivo HTML ou de um banco de dados.</p>
                <p>Você pode criar arquivos HTML separados para cada capítulo do seu livro e carregá-los dinamicamente.</p>
                <!-- Mais parágrafos de conteúdo -->
            `);
        }
    });
}

// Export as funções necessárias para uso externo
window.initFictionReader = initFictionReader;