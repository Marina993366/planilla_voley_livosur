import { state } from './state.js';
import { render } from './ui.js';
import { 
    logStat, 
    updateScoreAfterStat, 
    getPlayersOnCourt, 
    logEvent 
} from './events.js';

// --- REFERENCIAS AL DOM ---
const playerModal = document.getElementById('player-modal');
const liberoModal = document.getElementById('libero-modal');
const subsModal = document.getElementById('subs-modal');
const statsModal = document.getElementById('stats-modal');
const statsSummaryModal = document.getElementById('stats-summary-modal');
const serveModal = document.getElementById('serve-modal');
const lineupModal = document.getElementById('lineup-modal');

// ===================================================================================
// --- MODAL DE JUGADORES (Cargar Plantilla) ---
// ===================================================================================

/**
 * Abre el modal para editar la plantilla de jugadores y cuerpo técnico.
 * @param {string} teamId - 'A' o 'B' para identificar al equipo.
 */
export function openPlayerModal(teamId) {
    state.editingTeamId = teamId; 
    const team = state[teamId === 'A' ? 'teamA' : 'teamB']; 

    const content = `
        <h2 class="text-xl sm:text-2xl font-bold mb-4 text-center">
            Cargar Plantilla - ${team.name}
        </h2>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="px-2 py-2">Número</th>
                        <th class="px-2 py-2">Apellido y Nombre</th>
                        <th class="px-2 py-2">Rol</th>
                    </tr>
                </thead>
                <tbody id="roster-table-body"></tbody>
            </table>
        </div>
        <div class="border-t pt-4 mt-6">
            <h3 class="text-lg font-semibold text-center mb-2">Cuerpo Técnico</h3>
            <table class="w-full text-sm text-left">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="px-2 py-2">Función</th>
                        <th class="px-2 py-2">N° Carnet</th>
                        <th class="px-2 py-2">Apellido y Nombre</th>
                    </tr>
                </thead>
                <tbody id="staff-table-body"></tbody>
            </table>
        </div>
        <div class="flex justify-end space-x-2 sm:space-x-4 mt-6">
            <button type="button" 
                    class="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm" 
                    id="cancel-player-modal">Cancelar</button>
            <button type="button" 
                    class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm" 
                    id="save-player-modal">Guardar</button>
        </div>`;
    document.getElementById('player-modal-content').innerHTML = content;
    
    const rosterBody = document.getElementById('roster-table-body');
    team.roster.forEach((player) => {
        const row = rosterBody.insertRow();
        row.innerHTML = `
            <td class="px-2 py-1"><input type="number" value="${player.number || ''}" class="table-input w-16 text-center"></td>
            <td class="px-2 py-1"><input type="text" value="${player.name || ''}" class="table-input"></td>
            <td class="px-2 py-1">
                <select class="table-input">
                    <option value="player" ${!player.isCaptain && !player.isLibero ? 'selected' : ''}>Jugador</option>
                    <option value="captain" ${player.isCaptain ? 'selected' : ''}>Capitán</option>
                    <option value="libero" ${player.isLibero ? 'selected' : ''}>Líbero</option>
                </select>
            </td>`;
    });

    document.getElementById('staff-table-body').innerHTML = `
        <tr><td class="px-2 py-1 font-semibold">Entrenador</td><td class="px-2 py-1"><input type="text" id="coach-id" value="${team.staff.coach.id}" class="table-input"></td><td class="px-2 py-1"><input type="text" id="coach-name" value="${team.staff.coach.name}" class="table-input"></td></tr>
        <tr><td class="px-2 py-1 font-semibold">Asistente</td><td class="px-2 py-1"><input type="text" id="assistant-id" value="${team.staff.assistant.id}" class="table-input"></td><td class="px-2 py-1"><input type="text" id="assistant-name" value="${team.staff.assistant.name}" class="table-input"></td></tr>
        <tr><td class="px-2 py-1 font-semibold">Auxiliar</td><td class="px-2 py-1"><input type="text" id="auxiliary-id" value="${team.staff.auxiliary.id}" class="table-input"></td><td class="px-2 py-1"><input type="text" id="auxiliary-name" value="${team.staff.auxiliary.name}" class="table-input"></td></tr>`;
    
    document.getElementById('cancel-player-modal').addEventListener('click', closePlayerModal);
    document.getElementById('save-player-modal').addEventListener('click', savePlayers);

    playerModal.classList.remove('hidden');
    setTimeout(() => playerModal.classList.remove('opacity-0'), 10);
}

export function closePlayerModal() { 
    playerModal.classList.add('opacity-0'); 
    setTimeout(() => { 
        playerModal.classList.add('hidden'); 
        state.editingTeamId = null; 
    }, 300); 
}

export function savePlayers() { 
    if (!state.editingTeamId) return; 

    const team = state[state.editingTeamId === 'A' ? 'teamA' : 'teamB'];
    const rosterRows = document.getElementById('roster-table-body').rows;
    let captainCount = 0;
    let liberoCount = 0;
    const tempRoster = []; 

    for (let row of rosterRows) {
        const role = row.querySelector('select').value;
        if (role === 'captain') captainCount++;
        if (role === 'libero') liberoCount++;
        tempRoster.push({
            number: row.querySelector('[type="number"]').value, 
            name: row.querySelector('[type="text"]').value, 
            isCaptain: role === 'captain', 
            isLibero: role === 'libero', 
            subPartnerRosterIndex: null 
        });
    }

    if (captainCount > 1) { alert("Solo puede haber un capitán."); return; }
    if (liberoCount > 2) { alert("Solo puede haber dos líberos."); return; }

    team.roster = tempRoster;
    
    team.staff.coach = { id: document.getElementById('coach-id').value, name: document.getElementById('coach-name').value };
    team.staff.assistant = { id: document.getElementById('assistant-id').value, name: document.getElementById('assistant-name').value };
    team.staff.auxiliary = { id: document.getElementById('auxiliary-id').value, name: document.getElementById('auxiliary-name').value };
    
    closePlayerModal(); 
    render(); 
}

// ===================================================================================
// --- MODAL DE LÍBERO ---
// ===================================================================================

export function openLiberoModal(teamId) { 
    state.editingTeamId = teamId;
    const team = state[teamId === 'A' ? 'teamA' : 'teamB'];
    const liberoModalContent = document.getElementById('libero-modal-content');
    
    let content = `<h2 class="text-xl sm:text-2xl font-bold mb-4 text-center">Gestión de Líbero</h2>`;
    const designatedLiberos = team.roster
        .map((p, i) => ({...p, rosterIndex: i})) 
        .filter(p => p.isLibero && p.number); 
    
    content += `<p class="text-center mb-4">Selecciona los líberos activos para este set:</p><div class="space-y-3" id="libero-buttons">`;
    if(designatedLiberos.length > 0) {
        designatedLiberos.forEach(libero => {
            const isActive = team.liberoState.activeLiberoRosterIndices.includes(libero.rosterIndex);
            content += `
                <button data-roster-index="${libero.rosterIndex}" 
                        class="w-full font-bold py-2 px-4 rounded-lg ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}">
                    ${isActive ? '✅ Activado' : 'Activar'} Líbero ${libero.number} - ${libero.name}
                </button>`;
        });
    } else {
        content += `<p class="text-center text-gray-500">No hay líberos designados en la plantilla.</p>`;
    }
    content += `</div>`;
    content += `<div class="flex justify-end mt-6"><button id="close-libero-modal" class="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cerrar</button></div>`;
    
    liberoModalContent.innerHTML = content;
    
    document.getElementById('close-libero-modal').addEventListener('click', closeLiberoModal);
    liberoModalContent.querySelector('#libero-buttons').addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON') {
            toggleLiberoActive(teamId, parseInt(e.target.dataset.rosterIndex));
        }
    });
    
    liberoModal.classList.remove('hidden');
    setTimeout(() => liberoModal.classList.remove('opacity-0'), 10);
}

export function closeLiberoModal() { 
    liberoModal.classList.add('opacity-0'); 
    setTimeout(() => { 
        liberoModal.classList.add('hidden'); 
        state.editingTeamId = null; 
    }, 300); 
}

export function toggleLiberoActive(teamId, rosterIndex) { 
    const team = state[teamId === 'A' ? 'teamA' : 'teamB'];
    const activeLiberos = team.liberoState.activeLiberoRosterIndices;
    const indexInActive = activeLiberos.indexOf(rosterIndex);

    if (indexInActive > -1) { 
        activeLiberos.splice(indexInActive, 1);
    } else { 
        activeLiberos.push(rosterIndex);
    }
    openLiberoModal(teamId); 
    render(); 
}

// ===================================================================================
// --- MODAL DE SUSTITUCIONES ---
// ===================================================================================

export function openSubsModal(teamId) {
    state.substitutionState = { teamId: teamId, playerInRosterIndex: null, playerOutRosterIndex: null };
    const team = state[teamId === 'A' ? 'teamA' : 'teamB'];
    if (team.subs >= state.config.maxSubs) {
        alert("Límite de sustituciones alcanzado.");
        return;
    }
    renderSubsModal(); 
    subsModal.classList.remove('hidden');
    setTimeout(() => subsModal.classList.remove('opacity-0'), 10);
}

function renderSubsModal() {
    const team = state[state.substitutionState.teamId === 'A' ? 'teamA' : 'teamB'];
    const playersOnCourtIndices = new Set(team.startingSix);
    const courtPlayers = team.startingSix
        .map((rosterIndex, courtIndex) => ({ ...team.roster[rosterIndex], rosterIndex, courtIndex }))
        .filter(p => p.number); 
    const benchPlayers = team.roster
        .filter((p, index) => p.number && p.name && !p.isLibero && !playersOnCourtIndices.has(index));

    let benchHTML = benchPlayers.map(p => {
        const rosterIndex = team.roster.findIndex(pl => pl.number === p.number);
        const canEnter = !p.subPartnerRosterIndex || playersOnCourtIndices.has(p.subPartnerRosterIndex);
        return `
            <button data-type="in" data-roster-index="${rosterIndex}" 
                    class="sub-player-button ${state.substitutionState.playerInRosterIndex === rosterIndex ? 'selected-in' : ''}" 
                    ${!canEnter ? 'disabled' : ''}>
                <b>${p.number}</b> - ${p.name}
            </button>`;
    }).join('');

    let courtHTML = courtPlayers.map(p => {
        let canExit = true;
        if (state.substitutionState.playerInRosterIndex !== null) {
            const playerIn = team.roster[state.substitutionState.playerInRosterIndex];
            if (playerIn.subPartnerRosterIndex !== null) {
                canExit = playerIn.subPartnerRosterIndex === p.rosterIndex;
            } else { 
                canExit = p.subPartnerRosterIndex === null;
            }
        }
        return `
            <button data-type="out" data-roster-index="${p.rosterIndex}" 
                    class="sub-player-button ${state.substitutionState.playerOutRosterIndex === p.rosterIndex ? 'selected-out' : ''}" 
                    ${!canExit ? 'disabled' : ''}>
                <b>${p.number}</b> - ${p.name}
            </button>`;
    }).join('');

    const canConfirm = state.substitutionState.playerInRosterIndex !== null && state.substitutionState.playerOutRosterIndex !== null;
    const content = `
        <h2 class="text-xl font-bold mb-4 text-center">Realizar Sustitución (${team.name})</h2>
        <div class="grid grid-cols-2 gap-4">
            <div id="bench-players">
                <h3 class="font-semibold text-center border-b pb-2 mb-2">En Banco</h3>
                <div class="space-y-1">${benchHTML || '<p class="text-xs text-gray-500 text-center">No hay jugadores.</p>'}</div>
            </div>
            <div id="court-players">
                <h3 class="font-semibold text-center border-b pb-2 mb-2">En Cancha</h3>
                <div class="space-y-1">${courtHTML}</div>
            </div>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
            <button id="close-subs-modal" class="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancelar</button>
            <button id="confirm-subs-button" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg" ${!canConfirm ? 'disabled' : ''}>Confirmar</button>
        </div>`;
        
    document.getElementById('subs-modal-content').innerHTML = content;
    
    document.getElementById('close-subs-modal').addEventListener('click', closeSubsModal);
    document.getElementById('confirm-subs-button').addEventListener('click', confirmSubstitution);
    document.getElementById('bench-players').addEventListener('click', (e) => { 
        const button = e.target.closest('button'); 
        if(button) handleSubSelection(button.dataset.type, parseInt(button.dataset.rosterIndex)); 
    });
    document.getElementById('court-players').addEventListener('click', (e) => { 
        const button = e.target.closest('button'); 
        if(button) handleSubSelection(button.dataset.type, parseInt(button.dataset.rosterIndex)); 
    });
}

export function handleSubSelection(type, rosterIndex) { 
    if (type === 'in') {
        state.substitutionState.playerInRosterIndex = state.substitutionState.playerInRosterIndex === rosterIndex ? null : rosterIndex;
        state.substitutionState.playerOutRosterIndex = null; 
    } else {
        state.substitutionState.playerOutRosterIndex = state.substitutionState.playerOutRosterIndex === rosterIndex ? null : rosterIndex;
    }
    renderSubsModal(); 
}

export function confirmSubstitution() { 
    const { teamId, playerInRosterIndex, playerOutRosterIndex } = state.substitutionState;
    if (playerInRosterIndex === null || playerOutRosterIndex === null) return;
    
    const team = state[teamId === 'A' ? 'teamA' : 'teamB'];
    const courtIndex = team.startingSix.indexOf(playerOutRosterIndex); 
    
    if (courtIndex > -1) { 
        const playerIn = team.roster[playerInRosterIndex];
        const playerOut = team.roster[playerOutRosterIndex];

        if (playerIn.subPartnerRosterIndex === playerOutRosterIndex) {
            team.roster[playerInRosterIndex].subPartnerRosterIndex = null;
            team.roster[playerOutRosterIndex].subPartnerRosterIndex = null;
        } else { 
            team.roster[playerInRosterIndex].subPartnerRosterIndex = playerOutRosterIndex;
            team.roster[playerOutRosterIndex].subPartnerRosterIndex = playerInRosterIndex;
        }

        team.startingSix[courtIndex] = playerInRosterIndex;
        team.subs++; 
        logEvent(`Sustitución ${team.name}: Entra ${playerIn.number} - ${playerIn.name}, Sale ${playerOut.number} - ${playerOut.name}.`);
        closeSubsModal(); 
        render(); 
    }
}

export function closeSubsModal() { 
    subsModal.classList.add('opacity-0'); 
    setTimeout(() => { 
        subsModal.classList.add('hidden'); 
        state.substitutionState = { teamId: null, playerInRosterIndex: null, playerOutRosterIndex: null }; 
    }, 300); 
}

// ===================================================================================
// --- MODAL DE ESTADÍSTICAS (Asistente de Puntos) ---
// ===================================================================================

function getTaggablePlayers(team) {
    const playersOnCourt = getPlayersOnCourt(team);
    const taggablePlayerSet = new Set(playersOnCourt.filter(p => p)); // Filtra undefined si startingSix no está lleno
    if (team.liberoState.activeLiberoRosterIndices.length > 0) {
        team.liberoState.activeLiberoRosterIndices.forEach(rosterIndex => {
            const activeLibero = team.roster[rosterIndex];
            if (activeLibero) {
                taggablePlayerSet.add(activeLibero);
            }
        });
    }
    return Array.from(taggablePlayerSet);
}


export function openStatsModal(teamId) {
    const team = state[teamId === 'A' ? 'teamA' : 'teamB'];
    state.statEntry = { teamId: team.id, type: null, action: null, playerRosterIndex: null, step: 1 };
    renderStatsModal();
    statsModal.classList.remove('hidden');
    setTimeout(() => statsModal.classList.remove('opacity-0'), 10);
}

function renderStatsModal() {
    if (!state.statEntry) return;

    const team = state[state.statEntry.teamId === 'A' ? 'teamA' : 'teamB'];
    const otherTeam = state[state.statEntry.teamId === 'A' ? 'teamB' : 'teamA'];
    let stepContainer = document.createElement('div');

    switch (state.statEntry.step) {
        case 1:
            stepContainer.innerHTML = `
                <h2 class="text-xl font-bold mb-4 text-center">Punto para ${team.name}</h2>
                <p class="text-center text-gray-600 mb-4">¿Cómo finalizó el punto?</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button data-type="acierto" class="stat-button">✅ Acierto de ${team.name}</button>
                    <button data-type="error" class="stat-button">❌ Error de ${otherTeam.name}</button>
                </div>`;
            stepContainer.querySelectorAll('button').forEach(b => 
                b.addEventListener('click', () => selectStatOption('type', b.dataset.type))
            );
            break;
        case 2:
            const actions = state.statEntry.type === 'acierto' 
                ? { 'saque': 'Saque Directo', 'ataque': 'Ataque Ganador', 'bloqueo': 'Punto de Bloqueo' } 
                : { 'saque': 'Error de Saque', 'recepcion': 'Error de Recepción', 'ataque': 'Ataque Fallido / Bloqueado', 'defensa': 'Error de Defensa' };
            let actionButtons = Object.entries(actions)
                .map(([key, text]) => `<button data-action="${key}" class="stat-button">${text}</button>`)
                .join('');
            stepContainer.innerHTML = `
                <h2 class="text-xl font-bold mb-4 text-center">${state.statEntry.type === 'acierto' ? 'Acierto' : 'Error'}</h2>
                <p class="text-center text-gray-600 mb-4">Selecciona la acción:</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${actionButtons}</div>`;
            stepContainer.querySelectorAll('button').forEach(b => 
                b.addEventListener('click', () => selectStatOption('action', b.dataset.action))
            );
            break;
        case 3:
            const responsibleTeam = state.statEntry.type === 'acierto' ? team : otherTeam;
            const taggablePlayers = getTaggablePlayers(responsibleTeam);
            let playerButtons = taggablePlayers.map(p => {
                const rosterIndex = responsibleTeam.roster.findIndex(pl => pl && pl.number === p.number);
                if (rosterIndex === -1) return ''; 
                return `<button data-roster-index="${rosterIndex}" class="stat-button"><b>${p.number}</b> - ${p.name}</button>`
            }).join('');
            stepContainer.innerHTML = `
                <h2 class="text-xl font-bold mb-4 text-center">Jugador</h2>
                <p class="text-center text-gray-600 mb-4">¿Quién realizó la acción?</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${playerButtons}</div>`;
            stepContainer.querySelectorAll('button').forEach(b => 
                b.addEventListener('click', () => selectStatPlayer(parseInt(b.dataset.rosterIndex)))
            );
            break;
    }

    const finalContent = document.createElement('div');
    finalContent.appendChild(stepContainer);
    const cancelButton = document.createElement('div');
    cancelButton.className = 'flex justify-end mt-6';
    cancelButton.innerHTML = `<button class="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancelar</button>`;
    cancelButton.firstElementChild.addEventListener('click', closeStatsModal);
    finalContent.appendChild(cancelButton);

    const modalContent = document.getElementById('stats-modal-content');
    modalContent.innerHTML = ''; 
    modalContent.appendChild(finalContent);
}


export function selectStatOption(field, value) { 
    if (!state.statEntry) return; 
    state.statEntry[field] = value; 
    state.statEntry.step++; 
    renderStatsModal(); 
}

export function selectStatPlayer(playerRosterIndex) { 
    if (!state.statEntry) return; 
    state.statEntry.playerRosterIndex = playerRosterIndex; 
    commitStat(); 
}

function commitStat() { 
    if (!state.statEntry) return; 
    const currentSetIndex = state.teamA.sets + state.teamB.sets; 
    const responsibleTeamId = state.statEntry.type === 'acierto' ? state.statEntry.teamId : (state.statEntry.teamId === 'A' ? 'B' : 'A');
    const statObject = { 
        type: state.statEntry.type, 
        action: state.statEntry.action, 
        playerRosterIndex: state.statEntry.playerRosterIndex, 
        responsibleTeamId: responsibleTeamId, 
        score: `${state.teamA.score + (state.statEntry.teamId === 'A' ? 1:0)}-${state.teamB.score + (state.statEntry.teamId === 'B' ? 1:0)}` 
    };
    const responsibleTeam = state[responsibleTeamId === 'A' ? 'teamA' : 'teamB'];
    responsibleTeam.statsBySet[currentSetIndex].push(statObject);
    logStat(statObject); 
    updateScoreAfterStat(state.statEntry.teamId); 
    closeStatsModal(); 
}

export function closeStatsModal() { 
    statsModal.classList.add('opacity-0'); 
    setTimeout(() => { 
        statsModal.classList.add('hidden'); 
        state.statEntry = null; 
    }, 300); 
}

// --- LÓGICA DE MODAL DE RESUMEN DE ESTADÍSTICAS ---
export function openStatsSummaryModal() { 
    let content = `<h2 class="text-xl font-bold mb-6 text-center">Resumen de Estadísticas</h2><div class="space-y-8">`;
    for (let i = 0; i <= state.setScores.length; i++) {
        const isCurrentSet = i === state.setScores.length;
        if (isCurrentSet && (state.teamA.statsBySet[i] || []).length === 0 && (state.teamB.statsBySet[i] || []).length === 0) continue;
        content += `
            <div class="border-t pt-4">
                <h3 class="text-lg font-bold mb-2 text-center">${isCurrentSet ? `Set Actual (Set ${i+1})` : `Set ${i+1}`}</h3>
                <div class="flex flex-col lg:flex-row gap-6">
                    <div class="flex-1">${generateStatsTableHTML(state.teamA, i)}</div>
                    <div class="flex-1">${generateStatsTableHTML(state.teamB, i)}</div>
                </div>
            </div>`;
    }
    content += `
        <div class="border-t pt-4">
            <h3 class="text-lg font-bold mb-2 text-center">Totales del Partido</h3>
            <div class="flex flex-col lg:flex-row gap-6">
                <div class="flex-1">${generateStatsTableHTML(state.teamA, -1)}</div> 
                <div class="flex-1">${generateStatsTableHTML(state.teamB, -1)}</div>
            </div>
        </div>`;
    content += `</div><div class="flex justify-end mt-6"><button id="close-stats-summary-modal" class="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cerrar</button></div>`;
    
    document.getElementById('stats-summary-modal-content').innerHTML = content;
    document.getElementById('close-stats-summary-modal').addEventListener('click', closeStatsSummaryModal);
    
    statsSummaryModal.classList.remove('hidden');
    setTimeout(() => statsSummaryModal.classList.remove('opacity-0'), 10);
}

export function closeStatsSummaryModal() { 
    statsSummaryModal.classList.add('opacity-0'); 
    setTimeout(() => statsSummaryModal.classList.add('hidden'), 300); 
}

function generateStatsTableHTML(team, setIndex) { 
    const summary = {}; 
    team.roster.forEach((player, pIndex) => { 
        if (player.number) { 
            summary[pIndex] = { name: player.name, number: player.number, aciertos: { saque: 0, ataque: 0, bloqueo: 0 }, errores: { saque: 0, recepcion: 0, ataque: 0, defensa: 0 } }; 
        } 
    });
    const allStats = [...(state.teamA.statsBySet || []), ...(state.teamB.statsBySet || [])].flat();
    const relevantStats = setIndex === -1 ? allStats : [...(state.teamA.statsBySet[setIndex] || []), ...(state.teamB.statsBySet[setIndex] || [])];
    relevantStats.forEach(stat => { 
        if (summary[stat.playerRosterIndex] && stat.responsibleTeamId === team.id) { 
            if (stat.type === 'acierto') { 
                summary[stat.playerRosterIndex].aciertos[stat.action]++; 
            } else { 
                summary[stat.playerRosterIndex].errores[stat.action]++; 
            } 
        } 
    }); 
    let tableRows = Object.values(summary).map(playerStats => { 
        const totalStats = Object.values(playerStats.aciertos).reduce((a, b) => a + b, 0) + Object.values(playerStats.errores).reduce((a, b) => a + b, 0); 
        if (totalStats === 0) return ''; 
        return `
            <tr class="text-center">
                <td class="px-2 py-2 border-b text-left"><b>${playerStats.number}</b> - ${playerStats.name}</td>
                <td class="px-2 py-2 border-b">${playerStats.aciertos.saque}</td>
                <td class="px-2 py-2 border-b">${playerStats.aciertos.ataque}</td>
                <td class="px-2 py-2 border-b">${playerStats.aciertos.bloqueo}</td>
                <td class="px-2 py-2 border-b">${playerStats.errores.saque}</td>
                <td class="px-2 py-2 border-b">${playerStats.errores.recepcion}</td>
                <td class="px-2 py-2 border-b">${playerStats.errores.ataque}</td>
                <td class="px-2 py-2 border-b">${playerStats.errores.defensa}</td>
            </tr>`; 
    }).join(''); 
    return `
        <div>
            <h4 class="font-bold text-md mb-2">${team.name}</h4>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left whitespace-nowrap">
                    <thead class="bg-gray-100 text-xs">
                        <tr>
                            <th rowspan="2" class="px-2 py-2 align-bottom">Jugador</th>
                            <th colspan="3" class="px-2 py-2 text-center border-l border-b">Aciertos</th>
                            <th colspan="4" class="px-2 py-2 text-center border-l border-b">Errores</th>
                        </tr>
                        <tr>
                            <th class="px-2 py-2 text-center border-l font-semibold">S</th>
                            <th class="px-2 py-2 text-center font-semibold">A</th>
                            <th class="px-2 py-2 text-center font-semibold">B</th>
                            <th class="px-2 py-2 text-center border-l font-semibold">S</th>
                            <th class="px-2 py-2 text-center font-semibold">R</th>
                            <th class="px-2 py-2 text-center font-semibold">A</th>
                            <th class="px-2 py-2 text-center font-semibold">D</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows || `<tr><td colspan="8" class="text-center py-4 text-gray-500">Sin datos.</td></tr>`}
                    </tbody>
                </table>
            </div>
            <div class="text-right text-xs text-gray-500 mt-1 pr-2">
                <b>Aciertos/Errores:</b> S: Saque, A: Ataque, B: Bloqueo, R: Recepción, D: Defensa
            </div>
        </div>`; 
}


// --- LÓGICA DE MODAL DE SAQUE INICIAL ---
export function openServeModal() {
    const content = `
        <h2 class="text-xl font-bold mb-4 text-center">Saque Inicial</h2>
        <p class="text-center text-gray-600 mb-6">¿Qué equipo saca primero?</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="serve-buttons">
            <button data-team-id="A" class="stat-button">${state.teamA.name}</button>
            <button data-team-id="B" class="stat-button">${state.teamB.name}</button>
        </div>`;
    document.getElementById('serve-modal-content').innerHTML = content;
    
    document.getElementById('serve-buttons').addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON') setInitialServe(e.target.dataset.teamId);
    });
    
    serveModal.classList.remove('hidden');
    setTimeout(() => serveModal.classList.remove('opacity-0'), 10);
}

export function setInitialServe(teamId) {
    state.initialServeTeamId = teamId; 
    state.firstServeOfSetId = teamId; 
    state.teamA.serving = teamId === 'A';
    state.teamB.serving = teamId === 'B';
    serveModal.classList.add('opacity-0');
    setTimeout(() => {
        serveModal.classList.add('hidden');
        openLineupModal(); 
    }, 300);
}

// --- LÓGICA DE MODAL DE FORMACIÓN INICIAL ---
export function openLineupModal() {
    const modalContent = document.getElementById('lineup-modal-content');
    
    const teamA = state.teamA;
    const teamB = state.teamB;

    let teamAOptions = teamA.roster
        .filter(p => p.number && p.name && !p.isLibero)
        .map(p => `<option value="${teamA.roster.indexOf(p)}">${p.number} - ${p.name}</option>`)
        .join('');
    let teamBOptions = teamB.roster
        .filter(p => p.number && p.name && !p.isLibero)
        .map(p => `<option value="${teamB.roster.indexOf(p)}">${p.number} - ${p.name}</option>`)
        .join('');

    let teamALineup = '';
    for (let i = 0; i < 6; i++) {
        teamALineup += `
            <div class="text-center">
                <label class="font-semibold block mb-1 text-sm">Pos ${i+1}</label>
                <select id="lineup-a-pos-${i}" class="table-input">
                    <option value="-1">Elegir...</option>
                    ${teamAOptions}
                </select>
            </div>`;
    }

    let teamBLineup = '';
    for (let i = 0; i < 6; i++) {
        teamBLineup += `
            <div class="text-center">
                <label class="font-semibold block mb-1 text-sm">Pos ${i+1}</label>
                <select id="lineup-b-pos-${i}" class="table-input">
                    <option value="-1">Elegir...</option>
                    ${teamBOptions}
                </select>
            </div>`;
    }

    const content = `
        <h2 class="text-xl font-bold mb-4 text-center">Formación Inicial del Set ${state.setScores.length + 1}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 class="font-semibold text-lg text-center mb-2">${teamA.name}</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">${teamALineup}</div>
            </div>
            <div>
                <h3 class="font-semibold text-lg text-center mb-2">${teamB.name}</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">${teamBLineup}</div>
            </div>
        </div>
        <div class="flex justify-end mt-6">
            <button id="save-lineup-button" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Comenzar Set</button>
        </div>`;
    
    modalContent.innerHTML = content;
    document.getElementById('save-lineup-button').addEventListener('click', saveLineup);

    lineupModal.classList.remove('hidden');
    setTimeout(() => lineupModal.classList.remove('opacity-0'), 10);
}

function saveLineup() {
    const newStartingSixA = [];
    for (let i = 0; i < 6; i++) {
        newStartingSixA.push(parseInt(document.getElementById(`lineup-a-pos-${i}`).value, 10));
    }

    const newStartingSixB = [];
    for (let i = 0; i < 6; i++) {
        newStartingSixB.push(parseInt(document.getElementById(`lineup-b-pos-${i}`).value, 10));
    }
    
    const uniqueStartersA = new Set(newStartingSixA);
    const uniqueStartersB = new Set(newStartingSixB);

    if (uniqueStartersA.size !== 6 || uniqueStartersB.size !== 6 || newStartingSixA.includes(-1) || newStartingSixB.includes(-1)) {
        alert("Debe seleccionar 6 jugadores únicos para cada equipo.");
        return;
    }

    state.teamA.startingSix = newStartingSixA;
    state.teamB.startingSix = newStartingSixB;

    closeLineupModal(); 
    render(); 
}

function closeLineupModal() {
    lineupModal.classList.add('opacity-0');
    setTimeout(() => lineupModal.classList.add('hidden'), 300);
}

