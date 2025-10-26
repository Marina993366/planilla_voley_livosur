import { state, saveState, checkRostersComplete } from './state.js';
import { getPlayersOnCourt } from './events.js';

const unifiedScoreboardContainer = document.getElementById('unified-scoreboard');
const leftPlayerListContainer = document.getElementById('left-player-list');
const rightPlayerListContainer = document.getElementById('right-player-list');
const mobilePlayerListsContainer = document.getElementById('mobile-player-lists');
const setScoresDisplay = document.getElementById('set-scores-display');
const leftCourtContainer = document.getElementById('left-court');
const rightCourtContainer = document.getElementById('right-court');
const finishMatchButton = document.getElementById('finish-match-button');
const serveButton = document.getElementById('serve-button'); // Referencia al botón de saque

export function render() {
    const leftTeam = state.sidesSwapped ? state.teamB : state.teamA;
    const rightTeam = state.sidesSwapped ? state.teamA : state.teamB;
    
    renderUnifiedScoreboard(leftTeam, rightTeam);
    renderPlayerListPanel(leftPlayerListContainer, leftTeam);
    renderPlayerListPanel(rightPlayerListContainer, rightTeam);
    renderMobilePlayerLists(leftTeam, rightTeam);
    renderSetScores();
    renderCourtSide(leftCourtContainer, leftTeam);
    renderCourtSide(rightCourtContainer, rightTeam);
    
    // Habilita/deshabilita botones según el estado del juego
    finishMatchButton.disabled = state.teamA.sets < state.config.setsToWin && state.teamB.sets < state.config.setsToWin;
    serveButton.disabled = !checkRostersComplete() || state.initialServeTeamId !== null; // Deshabilitado si plantillas incompletas o saque ya definido
    
    saveState();
}

function renderPlayerListPanel(container, team) {
    container.innerHTML = `
        <h3 class="text-center font-bold text-lg text-gray-700 mb-2">${team.name}</h3>
        <div class="w-full flex-grow pt-3 border-t overflow-y-auto">
            <h4 class="text-center font-bold text-sm text-gray-500">PLANTILLA</h4>
            <div data-type="player-list" class="space-y-1 mt-2 px-1"></div>
        </div>`;
    const playerListContainer = container.querySelector('[data-type="player-list"]');
    renderPlayerList(playerListContainer, team);
}

function renderPlayerList(container, team) {
    container.innerHTML = '';
    team.roster.forEach(player => {
        if (!player.number && !player.name) return;
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-list-item grid grid-cols-[30px_1fr_30px] gap-2 items-center'; // Ajustado grid-cols
        playerDiv.innerHTML = `
            <span class="font-bold text-center text-xs">${player.number}</span>
            <span class="truncate text-xs">${player.name}</span>
            <span class="font-bold text-center text-xs">${player.isCaptain ? 'C' : ''}${player.isLibero ? ' L' : ''}</span>`;
        container.appendChild(playerDiv);
    });
}


function renderCourtSide(container, team) {
    container.innerHTML = '';
    // Si la formación inicial aún no se cargó (contiene -1), no dibuja nada.
    if (team.startingSix.includes(-1)) return; 

    const playersOnCourt = getPlayersOnCourt(team);
    const isLeft = container.id === 'left-court';
    const positionOrder = isLeft ? [4, 3, 5, 2, 0, 1] : [1, 0, 2, 5, 3, 4];

    positionOrder.forEach(playerIndex => {
        const player = playersOnCourt[playerIndex];
        const posDiv = document.createElement('div');
        posDiv.className = 'player-position';
        // Muestra número o '-' si falta jugador (aunque startingSix validado no debería pasar)
        posDiv.textContent = (player && player.number) ? player.number : '-'; 
        
        if (player) {
            const servingPlayerRosterIndex = team.startingSix[0];
            if (team.serving && team.roster[servingPlayerRosterIndex] && team.roster[servingPlayerRosterIndex].number === player.number) {
                posDiv.classList.add('serving-player');
            }
            if (player.isLibero) {
                posDiv.classList.add('libero-player');
            }
            if (player.subPartnerRosterIndex !== null && !team.startingSix.includes(player.subPartnerRosterIndex)) {
                const partner = team.roster[player.subPartnerRosterIndex];
                if (partner) { // Añadida verificación por si acaso
                    const indicator = document.createElement('div');
                    indicator.className = 'substitution-indicator';
                    indicator.textContent = partner.number;
                    indicator.title = `Entró por ${partner.number} - ${partner.name}`;
                    posDiv.appendChild(indicator);
                }
            }
        }
        container.appendChild(posDiv);
    });
}

function renderUnifiedScoreboard(teamLeft, teamRight) {
    unifiedScoreboardContainer.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div data-team-id="${teamLeft.id}" class="flex flex-col items-center p-2 rounded-lg bg-${teamLeft.color}-50 text-${teamLeft.color}-800 relative">
                <div class="serve-indicator absolute top-2 left-2 ${teamLeft.serving ? 'active' : ''}"></div>
                <input type="text" value="${teamLeft.name}" class="team-name-input text-sm mb-1">
                <div class="text-5xl font-black">${teamLeft.score}</div>
                <div class="flex items-center space-x-2 mt-1">
                    <button data-action="subtract-point" class="btn-control rounded-full w-8 h-8 text-xl font-bold flex items-center justify-center bg-${teamLeft.color}-200">-</button>
                    <button data-action="add-point" class="btn-control rounded-full w-10 h-10 text-2xl font-bold flex items-center justify-center bg-${teamLeft.color}-500 text-white">+</button>
                </div>
                <div class="w-full mt-2 pt-2 sm:mt-3 sm:pt-3 border-t grid grid-cols-3 gap-1 text-center text-xs">
                    <div><div class="font-bold">${teamLeft.sets}</div><div>Sets</div></div>
                    <div><div class="font-bold">${teamLeft.timeouts}</div><button data-action="timeout" class="font-semibold" ${teamLeft.timeouts >= state.config.maxTimeouts ? 'disabled' : ''}>Tiempos</button></div>
                    <div><div class="font-bold">${teamLeft.subs}</div><button data-action="substitution" class="font-semibold" ${teamLeft.subs >= state.config.maxSubs ? 'disabled' : ''}>Sust.</button></div>
                </div>
                <div class="w-full flex justify-around space-x-2 mt-2">
                    <button data-action="edit-players" class="border px-2 py-1 rounded-lg text-xs font-semibold">Jugadores</button>
                    <button data-action="libero" class="bg-orange-400 border-orange-500 px-2 py-1 rounded-lg text-xs font-semibold">Líbero</button>
                </div>
            </div>
            <div data-team-id="${teamRight.id}" class="flex flex-col items-center p-2 rounded-lg bg-${teamRight.color}-50 text-${teamRight.color}-800 relative">
                <div class="serve-indicator absolute top-2 left-2 ${teamRight.serving ? 'active' : ''}"></div>
                <input type="text" value="${teamRight.name}" class="team-name-input text-sm mb-1">
                <div class="text-5xl font-black">${teamRight.score}</div>
                <div class="flex items-center space-x-2 mt-1">
                    <button data-action="subtract-point" class="btn-control rounded-full w-8 h-8 text-xl font-bold flex items-center justify-center bg-${teamRight.color}-200">-</button>
                    <button data-action="add-point" class="btn-control rounded-full w-10 h-10 text-2xl font-bold flex items-center justify-center bg-${teamRight.color}-500 text-white">+</button>
                </div>
                <div class="w-full mt-2 pt-2 sm:mt-3 sm:pt-3 border-t grid grid-cols-3 gap-1 text-center text-xs">
                    <div><div class="font-bold">${teamRight.sets}</div><div>Sets</div></div>
                    <div><div class="font-bold">${teamRight.timeouts}</div><button data-action="timeout" class="font-semibold" ${teamRight.timeouts >= state.config.maxTimeouts ? 'disabled' : ''}>Tiempos</button></div>
                    <div><div class="font-bold">${teamRight.subs}</div><button data-action="substitution" class="font-semibold" ${teamRight.subs >= state.config.maxSubs ? 'disabled' : ''}>Sust.</button></div>
                </div>
                <div class="w-full flex justify-around space-x-2 mt-2">
                    <button data-action="edit-players" class="border px-2 py-1 rounded-lg text-xs font-semibold">Jugadores</button>
                    <button data-action="libero" class="bg-orange-400 border-orange-500 px-2 py-1 rounded-lg text-xs font-semibold">Líbero</button>
                </div>
            </div>
        </div>
    `;
    unifiedScoreboardContainer.querySelectorAll('.team-name-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const teamId = e.target.closest('[data-team-id]').dataset.teamId;
            state[teamId === 'A' ? 'teamA' : 'teamB'].name = e.target.value;
            render(); 
        });
    });
}

function renderMobilePlayerLists(teamLeft, teamRight) {
    mobilePlayerListsContainer.innerHTML = `
        <div>
            <h3 class="text-center font-bold text-sm text-gray-500 mb-1">${teamLeft.name}</h3>
            <div class="space-y-1" id="mobile-player-list-left"></div>
        </div>
        <div>
            <h3 class="text-center font-bold text-sm text-gray-500 mb-1">${teamRight.name}</h3>
            <div class="space-y-1" id="mobile-player-list-right"></div>
        </div>`;
    renderPlayerList(document.getElementById('mobile-player-list-left'), teamLeft);
    renderPlayerList(document.getElementById('mobile-player-list-right'), teamRight);
}

function renderSetScores() {
    setScoresDisplay.innerHTML = state.setScores.map((score, index) => {
        let finalScore = score.score;
        if ((score.winner === 'A' && state.sidesSwapped) || (score.winner === 'B' && !state.sidesSwapped)) {
            finalScore = finalScore.split('-').reverse().join('-');
        }
        return `<span><b>Set ${index + 1}:</b> ${finalScore}</span>`;
    }).join('<span class="mx-2">|</span>');
}

