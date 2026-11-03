// Utilitários de DOM e segurança.

// Escapa texto para interpolação segura em innerHTML, evitando XSS.
// Converte os cinco caracteres que têm significado em HTML.
export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// Seleciona todos os elementos focáveis dentro de um container.
// Usado pelo focus trap do modal.
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null); // ignora elementos ocultos
}
