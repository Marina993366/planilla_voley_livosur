import { render } from './ui.js';
import { openServeModal, openLineupModal } from './modals.js';

function createInitialPlayer(num) {
    return { number: num, name: `Jugador ${num}`, isCaptain: false, isLibero: false, subPartnerRosterIndex: null };
}

export const initialState = {
    teamA: { id: 'A', name: 'Equipo Local', score: 0, sets: 0, serving: false, timeouts: 0, subs: 0, statsBySet: [[],[],[],[],[]], roster: Array.from({length: 14}, (_, i) => createInitialPlayer(i + 1)), startingSix: [-1, -1, -1, -1, -1, -1], liberoState: { activeLiberoRosterIndices: [] }, staff: { coach: { id: '', name: ''}, assistant: { id: '', name: ''}, auxiliary: { id: '', name: ''} }, color: 'indigo' },
    teamB: { id: 'B', name: 'Equipo Visitante', score: 0, sets: 0, serving: false, timeouts: 0, subs: 0, statsBySet: [[],[],[],[],[]], roster: Array.from({length: 14}, (_, i) => createInitialPlayer(i + 15)), startingSix: [-1, -1, -1, -1, -1, -1], liberoState: { activeLiberoRosterIndices: [] }, staff: { coach: { id: '', name: ''}, assistant: { id: '', name: ''}, auxiliary: { id: '', name: ''} }, color: 'rose' },
    sidesSwapped: false, 
    setScores: [], 
    initialServeTeamId: null, 
    firstServeOfSetId: null, 
    matchLog: [], 
    config: { winThreshold: 25, setsToWin: 3, maxTimeouts: 2, maxSubs: 6 }, 
    editingTeamId: null,
    substitutionState: { teamId: null, playerInRosterIndex: null, playerOutRosterIndex: null },
    statEntry: null
};

export let state = loadState() || JSON.parse(JSON.stringify(initialState));

export function saveState() {
    localStorage.setItem('voleyMatchState', JSON.stringify(state));
}

function loadState() {
    const savedStateJSON = localStorage.getItem('voleyMatchState');
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            if (savedState && savedState.teamA && savedState.teamA.statsBySet) {
                // Asegura compatibilidad con versiones anteriores que no tenían startingSix inicializado a -1
                if (!savedState.teamA.startingSix || savedState.teamA.startingSix.length !== 6) {
                    savedState.teamA.startingSix = [-1,-1,-1,-1,-1,-1];
                }
                if (!savedState.teamB.startingSix || savedState.teamB.startingSix.length !== 6) {
                    savedState.teamB.startingSix = [-1,-1,-1,-1,-1,-1];
                }
                 // Asegura compatibilidad con versiones anteriores que no tenían matchLog
                if (!savedState.matchLog) {
                    savedState.matchLog = [];
                }
                return savedState;
            }
        } catch (e) {
            console.error("Error al cargar el estado desde localStorage:", e);
        }
    }
    return null;
}

export function clearState() {
    if (confirm('¿Estás seguro de que quieres borrar los datos guardados? Esto reiniciará la aplicación.')) {
        localStorage.removeItem('voleyMatchState');
        location.reload();
    }
}

export function resetMatch() {
    const freshState = JSON.parse(JSON.stringify(initialState));
    Object.assign(state, freshState);
    render();
    // No abre serve modal directamente, espera a que se carguen las plantillas
    alert("Partido reiniciado. Por favor, carga las plantillas de ambos equipos.");
}

/**
 * Verifica si las plantillas de ambos equipos están completas (mínimo 6 jugadores y 1 capitán).
 * @returns {boolean} - True si ambas plantillas están completas, False en caso contrario.
 */
export function checkRostersComplete() {
    const checkTeam = (team) => {
        const playersWithNameAndNumber = team.roster.filter(p => p.name && p.number).length;
        const captainCount = team.roster.filter(p => p.isCaptain).length;
        return playersWithNameAndNumber >= 6 && captainCount === 1;
    };
    return checkTeam(state.teamA) && checkTeam(state.teamB);
}

