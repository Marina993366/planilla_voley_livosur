import { state, resetMatch, clearState } from './state.js';
import { render } from './ui.js';
import * as events from './events.js';
import * as modals from './modals.js';

/**
 * Asigna manejadores de eventos a los elementos de la UI.
 * Este enfoque centralizado es más robusto y fácil de mantener que los 'onclick' en el HTML.
 */
function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const teamId = button.closest('[data-team-id]')?.dataset.teamId;

        // Comprobación previa para acciones que requieren plantillas cargadas
        if (['open-serve-modal', 'open-lineup-modal'].includes(action) && !events.checkRostersComplete()) {
            alert("Por favor, carga las plantillas completas (mínimo 6 jugadores y 1 capitán por equipo) antes de continuar.");
            return;
        }

        const actionMap = {
            'add-point': () => events.applyScoreChange(teamId, 1),
            'subtract-point': () => events.applyScoreChange(teamId, -1),
            'timeout': () => events.useControl(teamId, 'timeout'),
            'substitution': () => modals.openSubsModal(teamId),
            'edit-players': () => modals.openPlayerModal(teamId),
            'libero': () => modals.openLiberoModal(teamId),
            'open-serve-modal': modals.openServeModal,
            'swap-sides': events.swapSides,
            'open-stats-summary': modals.openStatsSummaryModal,
            'export-pdf': events.exportPDF,
            'reset-match': resetMatch,
            'clear-data': clearState, // Añadido para manejar el botón Limpiar Datos
        };

        if (actionMap[action]) {
            actionMap[action]();
        }
    });
}

/**
 * Función de inicialización de la aplicación.
 */
function init() {
    setupEventListeners();
    render();
    
    // Comprobaciones iniciales al cargar la página:
    if (!events.checkRostersComplete()) {
        console.warn("Plantillas incompletas. Por favor, carga los jugadores.");
        // Opcional: Mostrar un mensaje al usuario o abrir directamente el modal de jugadores.
        // modals.openPlayerModal('A'); // Ejemplo: Abrir modal para equipo A
    } else if (!state.initialServeTeamId) {
        // Si las plantillas están completas pero no se ha definido el saque, abre el modal.
        modals.openServeModal();
    } else if (state.teamA.startingSix.includes(-1) || state.teamB.startingSix.includes(-1)) {
        // Si ya se definió el saque pero la formación inicial no está cargada, abre el modal de formación.
        modals.openLineupModal();
    }
}

document.addEventListener('DOMContentLoaded', init);

