// D-Pad Navigation Logic (Horizontal e Vertical)
document.addEventListener('keydown', (e) => {
    // Se o assistente virtual estiver aberto, fecha com qualquer tecla (ou Back)
    const vaOverlay = document.getElementById('va-overlay');
    if (!vaOverlay.classList.contains('hidden')) {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') {
            vaOverlay.classList.add('hidden');
        }
        e.preventDefault();
        return;
    }

    const focusable = Array.from(document.querySelectorAll('.focusable'));
    if (focusable.length === 0) return;

    let currentIndex = focusable.indexOf(document.activeElement);

    // Se nada estiver focado, foca no primeiro
    if (currentIndex === -1) {
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
            focusable[0].focus();
            e.preventDefault();
        }
        return;
    }

    const currentEl = focusable[currentIndex];
    
    // Simplificação de navegação para TV
    // Para simplificar a lógica espacial, vamos tentar focar no elemento visualmente próximo
    // Como os elementos estão em uma grade estruturada no HTML, a ordem do DOM (index) 
    // já é próxima da visual para Direita/Esquerda.
    
    switch(e.key) {
        case 'ArrowRight':
            e.preventDefault();
            if (currentIndex < focusable.length - 1) {
                focusable[currentIndex + 1].focus();
                focusable[currentIndex + 1].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (currentIndex > 0) {
                focusable[currentIndex - 1].focus();
                focusable[currentIndex - 1].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            // Pula da Navbar para os Posters (que estão mais no fim do DOM)
            // Lógica simples: se estiver na nav-bar, pula +6 ou +8 elementos
            const nextRowEl = focusable.find((el, idx) => idx > currentIndex && el.classList.contains('poster'));
            if (nextRowEl) {
                nextRowEl.focus();
                nextRowEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            // Se estiver nos posters, pula de volta para a nav-bar
            if (currentEl.classList.contains('poster')) {
                const prevRowEl = focusable.find(el => el.classList.contains('nav-icon') || el.classList.contains('nav-app'));
                if (prevRowEl) {
                    prevRowEl.focus();
                    prevRowEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            } else {
                // Vai para o Hero Banner
                const heroBtn = document.querySelector('.hero-button');
                if (heroBtn) heroBtn.focus();
            }
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            currentEl.click();
            break;
    }
});

// Ações de clique
document.addEventListener('click', (e) => {
    const target = e.target.closest('.focusable');
    if (!target) return;

    const action = target.getAttribute('data-action');
    
    if (action === 'assistant') {
        const vaOverlay = document.getElementById('va-overlay');
        vaOverlay.classList.remove('hidden');
        
        // Simula processamento
        setTimeout(() => {
            const p = vaOverlay.querySelector('p');
            p.textContent = "Abrindo o Navegador para você...";
            setTimeout(() => {
                vaOverlay.classList.add('hidden');
                p.textContent = "Estou ouvindo... O que deseja fazer na sua TV?";
                // Foca de volta no assistente
                target.focus();
            }, 2000);
        }, 3000);
    } 
    else if (action === 'launch') {
        const pkg = target.getAttribute('data-pkg');
        if (window.Capacitor && window.Capacitor.Plugins.AppLauncherPlugin) {
            // Emulação por enquanto, ou envio real se fosse pacote verdadeiro
            // window.Capacitor.Plugins.AppLauncherPlugin.launchApp({ packageName: pkg });
            alert(`Iniciando app nativo: ${pkg}\n(Na TV, abriria o app verdadeiro)`);
        } else {
            alert(`Iniciando app: ${pkg}`);
        }
    }
    else {
        console.log("Ação clicada:", action);
        // Animação de clique
        target.style.transform = 'scale(0.95)';
        setTimeout(() => target.style.transform = 'scale(1.05)', 150);
    }
});

// Inicialização de Foco
document.addEventListener('DOMContentLoaded', () => {
    const firstIcon = document.querySelector('.nav-icon.active');
    if (firstIcon) firstIcon.focus();
});
