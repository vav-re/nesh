// academic.js - Funções para artigos acadêmicos

// Inicializar o leitor acadêmico
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos em uma página de artigo acadêmico
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Inicializar funcionalidades específicas para artigos acadêmicos
    initTableOfContents();
    enhanceCitations();
    initReferences();
    initBackToTop();
    
    // Gerar índice do artigo
    function initTableOfContents() {
        const tocContainer = document.querySelector('.table-of-contents');
        if (!tocContainer) return;
        
        const headings = document.querySelectorAll('h2, h3');
        if (!headings.length) return;
        
        const tocList = document.createElement('ul');
        
        // Processar cada título para criar o índice
        headings.forEach((heading, index) => {
            // Garantir que cada título tenha um ID
            if (!heading.id) {
                let id = heading.textContent.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
                heading.id = `section-${id}-${index}`;
            }
            
            // Criar o item da lista para o índice
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent;
            listItem.appendChild(link);
            
            // Adicionar classe especial para H3 (subitens)
            if (heading.tagName === 'H3') {
                listItem.classList.add('toc-level-2');
            }
            
            tocList.appendChild(listItem);
            
            // Adicionar evento de clique suave para rolagem
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector(`#${heading.id}`).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
        
        // Adicionar a lista ao container
        tocContainer.appendChild(tocList);
    }
    
    // Melhorar as citações 
    function enhanceCitations() {
        const citations = document.querySelectorAll('em');
        
        citations.forEach(citation => {
            // Adicionar tooltip para mostrar a referência
            citation.title = "Citação";
            citation.classList.add('citation');
        });
    }
    
    // Inicializar referências
    function initReferences() {
        const referenceLinks = document.querySelectorAll('.reference-link');
        
        referenceLinks.forEach(link => {
            // Prevenir navegação real
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Destacar a referência clicada
                const parentLi = link.closest('li');
                if (parentLi) {
                    parentLi.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.1)';
                    setTimeout(() => {
                        parentLi.style.backgroundColor = '';
                    }, 2000);
                }
            });
        });
    }
    
    // Adicionar botão "voltar ao topo"
    function initBackToTop() {
        // Verificar se o botão já existe
        if (document.querySelector('.back-to-top')) return;
        
        // Criar o botão
        const backToTopButton = document.createElement('button');
        backToTopButton.className = 'back-button back-to-top';
        backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTopButton.title = 'Voltar ao topo';
        
        // Adicionar o botão ao corpo do documento
        document.body.appendChild(backToTopButton);
        
        // Ocultar o botão inicialmente
        backToTopButton.style.display = 'none';
        
        // Mostrar o botão quando rolar para baixo
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });
        
        // Evento de clique para rolar para o topo
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});