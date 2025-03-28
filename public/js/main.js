// main.js - Funções compartilhadas para todo o site

// Proteção contra cópia
function initCopyProtection() {
    // Adicionar a classe no-context ao body
    document.body.classList.add('no-context');
    
    // Prevenir menu de contexto
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        return false;
    });
    
    // Prevenir seleção de texto
    document.addEventListener('selectstart', (event) => {
        event.preventDefault();
        return false;
    });
    
    // Prevenir atalhos de teclado para copiar, salvar, imprimir, etc.
    document.addEventListener('keydown', (event) => {
        if (
            // Copiar: Ctrl+C, Cmd+C
            (event.ctrlKey && event.key === 'c') ||
            (event.metaKey && event.key === 'c') ||
            // Copiar especial: Ctrl+Shift+C
            (event.ctrlKey && event.shiftKey && event.key === 'C') ||
            // Salvar: Ctrl+S, Cmd+S
            (event.ctrlKey && event.key === 's') ||
            (event.metaKey && event.key === 's') ||
            // Imprimir: Ctrl+P, Cmd+P
            (event.ctrlKey && event.key === 'p') ||
            (event.metaKey && event.key === 'p') ||
            // Ferramentas de desenvolvedor: F12, Ctrl+Shift+I, Cmd+Option+I
            (event.key === 'F12') ||
            (event.ctrlKey && event.shiftKey && event.key === 'I') ||
            (event.metaKey && event.altKey && event.key === 'i')
        ) {
            event.preventDefault();
            return false;
        }
    });
}

// Atualizar o ano atual no footer
function updateYear() {
    const yearElements = document.querySelectorAll('.current-year');
    const currentYear = new Date().getFullYear();
    
    yearElements.forEach(element => {
        element.textContent = currentYear;
    });
}

// Inicializar a página
function initPage() {
    // Aplicar proteção contra cópia
    initCopyProtection();
    
    // Atualizar o ano no footer
    updateYear();
}

// Chamar inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}