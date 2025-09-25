// HTML 요소 가져오기
const inputElement = document.querySelector('#word-input'); // 입력 필드
const buttonElement = document.querySelector('#submit-btn'); // 입력 버튼
const playersAreaElement = document.querySelector('#players-area'); // 플레이어 영역
const wordRecordList = document.querySelector('#word-record-list'); // 단어 기록 목록
// 점수판이 플레이어 카드에 통합되어 별도 요소가 필요 없음

// 게임 정보 UI 요소
const modeDisplay = document.querySelector('#mode-display');
const currentPlayerDisplay = document.querySelector('#current-player-display');
const timerDisplay = document.querySelector('#timer-display');
const timerValue = document.querySelector('#timer-value');
const currentWordElement = document.querySelector('#current-word');

// 사이드바 관련 요소
const rulesBtn = document.querySelector('#rules-btn');
const sidebar = document.querySelector('#sidebar');
const sidebarToggle = document.querySelector('#sidebar-toggle');
const sidebarHeader = document.querySelector('.sidebar-header h3');
const rulesSection = document.querySelector('.rules-section ul');

// 게임 상태 변수
let currentWord = ''; // 현재 제시어
let currentPlayer = ''; // 현재 참가자 이름
let totalPlayers = 0; // 총 참가자 수 (사용자 입력)
let playerNames = []; // 참가자 이름 목록
let activePlayers = []; // 현재 게임에 남아있는 참가자 목록
let usedWords = []; // 사용된 단어 목록
let timer; // 타이머 변수
let timeLimit = 10; // 제한 시간 (초), 기본값
let timeRemaining = timeLimit; // 남은 시간
let gameHistory = []; // 게임 기록 저장 (누가 어떤 단어를 입력했는지, 탈락 정보 포함)
let playerScores = {}; // 플레이어 점수
let gameMode = 'elimination'; // 게임 모드: 'elimination' 또는 'score'

// 게임 설정 함수
function setupGame() {
    console.log('게임 설정 함수가 호출되었습니다.');
    
    // 게임 모드 선택
    const modeChoice = confirm('게임 모드를 선택하세요:\n확인 - 점수 모드 (점수가 높은 사람이 승리)\n취소 - 탈락 모드 (마지막 남은 사람이 승리)');
    gameMode = modeChoice ? 'score' : 'elimination';
    console.log('선택된 게임 모드:', gameMode);
    
    // 모드에 따른 게임 규칙 업데이트
    updateGameRules();

    // 참가자 수 입력받기
    totalPlayers = parseInt(prompt('참가자 수를 입력하세요:'), 10);
    while (isNaN(totalPlayers) || totalPlayers <= 1) {
        alert('참가자는 최소 2명 이상이어야 합니다!');
        totalPlayers = parseInt(prompt('참가자 수를 입력하세요:'), 10);
    }

    // 참가자 이름 입력받기
    for (let i = 1; i <= totalPlayers; i++) {
        let playerName = prompt(`${i}번째 참가자 이름을 입력하세요:`);
        while (!playerName || playerName.trim() === '') {
            alert('이름을 입력해주세요!');
            playerName = prompt(`${i}번째 참가자 이름을 입력하세요:`);
        }
        // 중복 이름 체크
        while (playerNames.includes(playerName.trim())) {
            alert('이미 등록된 이름입니다. 다른 이름을 입력해주세요!');
            playerName = prompt(`${i}번째 참가자 이름을 입력하세요:`);
        }
        playerNames.push(playerName.trim());
        activePlayers.push(playerName.trim());
        playerScores[playerName.trim()] = 0; // 점수 초기화
    }

    // 첫 번째 참가자로 시작
    currentPlayer = activePlayers[0];
    
    // 게임 설정 완료 후 다음 단계 호출
    completeGameSetup();
}

// 플레이어 캐릭터들을 동적으로 생성하는 함수
function createPlayerCards() {
    playersAreaElement.innerHTML = ''; // 기존 카드 제거
    
    // 캐릭터 이모지 목록
    const characters = ['🏎️', '🚗', '🚙', '🚕', '🚐', '🚛', '🚚', '🏍️', '🛵', '🚲'];
    
    playerNames.forEach((player, index) => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.id = `player-${player}`;
        
        // 현재 플레이어 강조
        if (player === currentPlayer) {
            playerCard.classList.add('active');
        }
        
        // 탈락한 플레이어 표시
        if (!activePlayers.includes(player)) {
            playerCard.classList.add('eliminated');
        }
        
        const characterEmoji = characters[index % characters.length];
        
        playerCard.innerHTML = `
            <div class="player-character">${characterEmoji}</div>
            <div class="player-name">${player}</div>
            <div class="player-score">${playerScores[player] || 0}점</div>
        `;
        
        playersAreaElement.appendChild(playerCard);
    });
}

// 플레이어 상태 업데이트 함수
function updatePlayerCards() {
    playerNames.forEach(player => {
        const playerCard = document.getElementById(`player-${player}`);
        if (playerCard) {
            // 모든 상태 클래스 제거
            playerCard.classList.remove('active', 'eliminated', 'leader');
            
            // 현재 플레이어 강조
            if (player === currentPlayer) {
                playerCard.classList.add('active');
            }
            
            // 탈락한 플레이어 표시
            if (!activePlayers.includes(player)) {
                playerCard.classList.add('eliminated');
            }
            
            // 점수 업데이트
            const scoreElement = playerCard.querySelector('.player-score');
            if (scoreElement) {
                scoreElement.textContent = `${playerScores[player] || 0}점`;
            }
        }
    });
    
    // 점수 순으로 플레이어 카드 재정렬
    sortPlayerCards();
}

// 플레이어 카드를 점수 순으로 정렬하는 함수
function sortPlayerCards() {
    const playersContainer = document.getElementById('players-area');
    const playerCards = Array.from(playersContainer.children);
    
    // 점수 순으로 정렬 (높은 점수부터)
    playerCards.sort((a, b) => {
        const playerA = a.id.replace('player-', '');
        const playerB = b.id.replace('player-', '');
        return (playerScores[playerB] || 0) - (playerScores[playerA] || 0);
    });
    
    // 재정렬된 순서로 DOM에 다시 추가
    playerCards.forEach((card, index) => {
        playersContainer.appendChild(card);
        
        // 1등에게 리더 클래스 추가
        if (index === 0 && !card.classList.contains('eliminated')) {
            const playerName = card.id.replace('player-', '');
            if (playerScores[playerName] > 0) {
                card.classList.add('leader');
            }
        }
    });
}

// 점수판은 이제 플레이어 카드에 통합되어 별도 함수가 필요 없음

// 점수 업데이트 함수
function updateScore(player, points) {
    playerScores[player] += points;
    updatePlayerCards();
}

// 현재 플레이어 정보 업데이트 함수
function updateCurrentPlayer() {
    updatePlayerCards();
    updateGameInfo(); // 게임 정보 UI 업데이트 추가
    
    // 플레이어 변경 애니메이션
    animatePlayerChange();
}

// 텍스트 입력창에 포커스 설정
inputElement.focus(); // 화면 로드 시 입력창에 포커스

// 입력창 포커스 애니메이션
inputElement.addEventListener('focus', animateInputFocus);

// 현재 제시어 업데이트 함수
function updateCurrentWord() {
    if (currentWordElement) {
        if (currentWord) {
            currentWordElement.textContent = currentWord;
        } else {
            currentWordElement.textContent = '';
        }
    }
}

// 모드별 게임 규칙 업데이트 함수
function updateGameRules() {
    if (!sidebarHeader || !rulesSection) return;
    
    if (gameMode === 'score') {
        // 점수 모드 규칙
        sidebarHeader.innerHTML = '🏆 점수 모드 규칙';
        rulesSection.innerHTML = `
            <li>✅ 제시된 단어의 마지막 글자로 시작하는 단어를 입력하세요</li>
            <li>✅ 이미 사용한 단어와 한 글자 단어, 공백은 사용할 수 없습니다</li>
            <li>📊 단어 길이만큼 점수를 획득합니다 (2글자=2점, 3글자=3점...)</li>
            <li>⚠️ 규칙을 어기거나 시간 초과 시 탈락합니다</li>
            <li>🏆 최종적으로 점수가 가장 높은 플레이어가 승리합니다</li>
            <li>👥 탈락해도 점수는 유지되며, 동점자는 공동 승리입니다</li>
        `;
    } else {
        // 탈락 모드 규칙
        sidebarHeader.innerHTML = '⚔️ 탈락 모드 규칙';
        rulesSection.innerHTML = `
            <li>✅ 제시된 단어의 마지막 글자로 시작하는 단어를 입력하세요</li>
            <li>✅ 이미 사용한 단어와 한 글자 단어, 공백은 사용할 수 없습니다</li>
            <li>📊 단어 길이만큼 점수를 획득합니다 (기록용)</li>
            <li>❌ 규칙을 어기거나 시간 초과 시 즉시 탈락합니다</li>
            <li>⏰ 제한 시간 내에 단어를 입력해야 합니다</li>
            <li>🏆 마지막까지 살아남은 플레이어가 승리합니다</li>
            <li>💀 탈락한 플레이어는 다시 참가할 수 없습니다</li>
        `;
    }
}

// setupGame 함수 계속
function completeGameSetup() {
    // 시간 제한 입력받기 (점수 모드에서만)
    if (gameMode === 'score') {
        timeLimit = parseInt(prompt('시간 제한(초)을 입력하세요 (기본값: 30):'), 10);
        if (isNaN(timeLimit) || timeLimit <= 0) {
            alert('올바른 시간 제한을 입력하세요! 기본값(30초)으로 설정됩니다.');
            timeLimit = 30;
        }
    } else {
        timeLimit = parseInt(prompt('시간 제한(초)을 입력하세요 (기본값: 10):'), 10);
        if (isNaN(timeLimit) || timeLimit <= 0) {
            alert('올바른 시간 제한을 입력하세요! 기본값(10초)으로 설정됩니다.');
            timeLimit = 10;
        }
    }
    timeRemaining = timeLimit; // 남은 시간을 초기화

    // 설정값 확인
    const participantsList = playerNames.join(', ');
    const modeText = gameMode === 'score' ? 
        '🏆 점수 모드 (점수가 가장 높은 사람이 승리)' : 
        '⚔️ 탈락 모드 (규칙 위반 시 탈락, 마지막 남은 사람이 승리)';
    const confirmSettings = confirm(
        `설정값을 확인하세요:\n게임 모드: ${modeText}\n참가자: ${participantsList}\n시간 제한: ${timeLimit}초\n\n📋 게임 규칙:\n- 두음 법칙 미적용\n- 단어는 2글자 이상\n- 점수는 1글자당 1점\n- 규칙 위반 시 ${gameMode === 'score' ? '점수 차감' : '탈락'}\n\n이 설정으로 게임을 시작하시겠습니까?`
    );
    if (!confirmSettings) {
        alert('게임 설정을 취소했습니다. 페이지를 새로고침합니다.');
        location.reload(); // 설정 취소 시 페이지 새로고침
        return;
    }
    
    // 게임 초기화 및 시작
    initializeGame();
    
    // 단어 기록 플레이스홀더 표시
    showRecordPlaceholder();
}

// 엔터키로 단어 등록 기능 추가
inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        buttonElement.click(); // 버튼 클릭 이벤트 트리거
    }
});

// 게임 초기화 및 시작
function initializeGame() {
    // 플레이어 카드 생성 (점수 포함)
    createPlayerCards();
    
    // 게임 정보 UI 업데이트
    updateGameInfo();
    
    // 제시어 초기화
    updateCurrentWord();
    
    // 게임 규칙 업데이트
    updateGameRules();
    
    // 첫 번째 타이머 시작
    timer = setInterval(updateTimer, 1000);
    
    // 입력창 포커스
    inputElement.focus();
}

// 게임 UI 업데이트 함수
function updateGameInfo() {
    console.log('updateGameInfo 호출됨 - 현재 플레이어:', currentPlayer);
    
    // 모드 표시 업데이트
    const modeText = gameMode === 'score' ? '🏆 점수 모드' : '⚔️ 탈락 모드';
    if (modeDisplay) modeDisplay.textContent = modeText;
    
    // 현재 플레이어 표시 업데이트
    if (currentPlayerDisplay) {
        currentPlayerDisplay.textContent = `현재 차례: ${currentPlayer}`;
        console.log('현재 플레이어 UI 업데이트됨:', currentPlayerDisplay.textContent);
    } else {
        console.log('currentPlayerDisplay 요소를 찾을 수 없음');
    }
    
    // 타이머 표시 업데이트
    if (timerValue) {
        timerValue.textContent = timeRemaining;
        
        // 시간이 5초 이하일 때 경고 효과
        if (timeRemaining <= 5) {
            timerDisplay.classList.add('timer-warning');
        } else {
            timerDisplay.classList.remove('timer-warning');
        }
    }
}

// 타이머 업데이트 함수
function updateTimer() {
    timeRemaining -= 1;
    updateGameInfo(); // UI 업데이트
    
    if (timeRemaining <= 0) {
        // 타이머 중지
        clearInterval(timer);
        
        // 시간 초과 기록 추가
        addWordRecord(null, `⏰ ${currentPlayer} (시간초과)`, true);
        
        // 모든 게임 모드에서 시간 초과 시 탈락 처리
        alert(`${currentPlayer}님이 시간 초과로 탈락했습니다!`);
        eliminatePlayer(currentPlayer);
    }
}

// 참가자 탈락 처리 함수 (모든 모드에서 동작)
function eliminatePlayer(player) {
    console.log('eliminatePlayer 호출됨 - 탈락자:', player);
    
    // 탈락 기록 추가
    const lastWord = inputElement.value.trim();
    gameHistory.push({
        event: 'elimination',
        player: player,
        word: lastWord,
        reason: '탈락 (규칙 위반 또는 시간 초과)'
    }); 

    // 참가자 탈락
    activePlayers = activePlayers.filter((p) => p !== player);

    // 게임 종료 조건 확인
    if (activePlayers.length === 0) {
        // 모든 플레이어가 탈락한 경우
        if (gameMode === 'score') {
            const winner = getTopScorer();
            let winnerMessage = '';
            if (winner.names.length > 1) {
                winnerMessage = `모든 플레이어가 탈락했습니다!\n🏆 공동 승자: ${winner.names.join(', ')} (${winner.score}점)`;
            } else {
                winnerMessage = `모든 플레이어가 탈락했습니다!\n🏆 최종 승자: ${winner.name} (${winner.score}점)`;
            }
            alert(winnerMessage);
        } else {
            alert('모든 플레이어가 탈락했습니다! 게임을 다시 시작하세요.');
        }
        resetGame();
        return;
    } else if (activePlayers.length === 1) {
        if (gameMode === 'elimination') {
            // 탈락 모드: 마지막 남은 사람이 승리
            alert(`${activePlayers[0]}님이 승리했습니다!`);
            resetGame();
            return;
        } else {
            // 점수 모드: 한 명만 남으면 게임 종료하고 승자 결정
            const winner = getTopScorer();
            
            // 모든 플레이어가 0점이면 마지막 생존자가 승리
            if (winner.score === 0) {
                alert(`모든 플레이어가 탈락했습니다!\n🏆 최종 승자: ${activePlayers[0]} (마지막 생존자)`);
            } else {
                let winnerMessage = '';
                if (winner.names.length > 1) {
                    winnerMessage = `모든 플레이어가 탈락했습니다!\n🏆 공동 승자: ${winner.names.join(', ')} (${winner.score}점)`;
                } else {
                    winnerMessage = `모든 플레이어가 탈락했습니다!\n🏆 최종 승자: ${winner.name} (${winner.score}점)`;
                }
                alert(winnerMessage);
            }
            resetGame();
            return;
        }
    }

    // 다음 참가자로 이동
    if (activePlayers.length > 0) {
        // 탈락한 플레이어가 있던 자리의 다음 플레이어로 이동
        // 만약 마지막 플레이어가 탈락했다면 첫 번째 플레이어로
        const originalIndex = playerNames.indexOf(player);
        let nextIndex = 0;
        
        // 탈락한 플레이어 다음 순서부터 찾기
        for (let i = 0; i < playerNames.length; i++) {
            const checkIndex = (originalIndex + 1 + i) % playerNames.length;
            const nextCandidate = playerNames[checkIndex];
            if (activePlayers.includes(nextCandidate)) {
                currentPlayer = nextCandidate;
                break;
            }
        }
        
        // 혹시 못 찾았다면 첫 번째 활성 플레이어로
        if (!activePlayers.includes(currentPlayer)) {
            currentPlayer = activePlayers[0];
        }
    }
    updateCurrentPlayer(); // HTML에 표시되는 참가자 이름 업데이트

    // 타이머 초기화
    timeRemaining = timeLimit;
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
}

// 다음 플레이어로 이동 (점수 모드용)
function nextPlayer() {
    console.log('nextPlayer 함수 호출됨');
    console.log('현재 활성 플레이어 목록:', activePlayers);
    console.log('현재 플레이어:', currentPlayer);
    
    const currentIndex = activePlayers.indexOf(currentPlayer);
    console.log('현재 플레이어 인덱스:', currentIndex);
    
    currentPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];
    console.log('새로운 현재 플레이어:', currentPlayer);
    
    updateCurrentPlayer();
    
    // 타이머 초기화
    timeRemaining = timeLimit;
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
}

// 게임 종료 확인 (현재는 사용하지 않음)
function checkGameEnd() {
    // 점수 모드에서는 자동으로 게임 종료되지 않음
    // 모든 플레이어가 탈락하거나 수동으로 게임을 종료해야 함
    return false;
}

// 최고 득점자 찾기 (동점자 포함)
function getTopScorer() {
    let topScore = Math.max(...playerNames.map(player => playerScores[player] || 0));
    let topPlayers = playerNames.filter(player => (playerScores[player] || 0) === topScore);
    
    return { 
        names: topPlayers, 
        score: topScore,
        name: topPlayers[0] // 기존 코드와의 호환성을 위해
    };
}

// 게임 초기화 함수 
function resetGame() {
    clearInterval(timer); // 타이머 정지
    inputElement.disabled = true; // 입력 비활성화
    buttonElement.disabled = true; // 버튼 비활성화
    
    // 로그 저장 여부 확인
    const saveLog = confirm('게임 로그를 저장하시겠습니까?\n(게임 진행 기록과 결과가 JSON 파일로 저장됩니다)');
    if (saveLog) {
        saveGameData(); // 게임 데이터 저장
        alert('게임 로그가 저장되었습니다!');
    }
    
    // 게임 재시작 여부 확인
    const restart = confirm('게임이 종료되었습니다.\n새 게임을 시작하시겠습니까?');
    if (restart) {
        location.reload(); // 페이지 새로고침으로 게임 재시작
    }
}

// JSON 파일로 저장하는 함수 (게임 결과 정보 추가)
function saveGameData() {
    const gameEndTime = new Date().toLocaleString('ko-KR');
    const winner = activePlayers.length > 0 ? activePlayers[0] : '없음';
    
    const gameData = {
        gameInfo: {
            endTime: gameEndTime,
            winner: winner,
            totalPlayers: totalPlayers,
            timeLimit: timeLimit,
            totalWordsUsed: usedWords.length
        },
        participants: {
            original: playerNames,
            final: activePlayers
        },
        gameProgress: {
            usedWords: usedWords,
            lastWord: currentWord,
            gameHistory: gameHistory
        },
        statistics: {
            eliminatedPlayers: playerNames.filter(name => !activePlayers.includes(name)),
            gameRounds: usedWords.length
        }
    };
    
    const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `끝말잇기_게임로그_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 사이드바 토글 기능 (규칙 버튼으로만 제어)
rulesBtn.addEventListener('click', () => {
    // 사이드바가 열려있으면 닫고, 닫혀있으면 열기
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    } else {
        sidebar.classList.add('active');
        document.body.classList.add('sidebar-open');
    }
});

// 단어 기록 추가 함수
function addWordRecord(previousWord, newWord, isError = false) {
    // 플레이스홀더 제거
    removeRecordPlaceholder();
    
    const recordElement = document.createElement('div');
    recordElement.className = 'word-record';
    
    if (isError) {
        recordElement.classList.add('error');
        recordElement.textContent = `❌ ${newWord}`;
    } else {
        recordElement.textContent = previousWord ? `${previousWord} → ${newWord}` : newWord;
    }
    
    // 새 기록을 맨 앞에 추가 (왼쪽)
    wordRecordList.insertBefore(recordElement, wordRecordList.firstChild);
    
    // 자동 스크롤 (새 단어가 보이도록 왼쪽으로)
    setTimeout(() => {
        wordRecordList.scrollLeft = 0;
    }, 100);
    
    // 기록이 너무 많으면 오래된 것부터 제거 (최대 15개, 오른쪽 끝부터)
    const records = wordRecordList.querySelectorAll('.word-record');
    if (records.length > 15) {
        records[records.length - 1].remove();
    }
}

// 기록 플레이스홀더 제거
function removeRecordPlaceholder() {
    const placeholder = wordRecordList.querySelector('.record-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
}

// 기록 플레이스홀더 표시
function showRecordPlaceholder() {
    if (wordRecordList.children.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'record-placeholder';
        placeholder.textContent = '아직 입력된 단어가 없습니다';
        wordRecordList.appendChild(placeholder);
    }
}

// 파티클 생성 함수
function createParticles(element, count = 8) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const rect = element.getBoundingClientRect();
        particle.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 100) + 'px';
        particle.style.top = (rect.top + rect.height / 2 + (Math.random() - 0.5) * 50) + 'px';
        
        // 랜덤 색상
        const colors = ['#ffd43b', '#22c55e', '#3b82f6', '#7c3aed', '#f97316'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

// 반짝임 효과 함수
function createSparkles(element, count = 6) {
    for (let i = 0; i < count; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        
        const rect = element.getBoundingClientRect();
        sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
        sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
        
        document.body.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 800);
    }
}

// 단어 입력 시 시각적 효과 추가
function showWordEffect(word, isCorrect = true) {
    const wordElement = document.querySelector('#word');
    const inputArea = document.querySelector('.input-area');
    const buttonElement = document.querySelector('#submit-btn');
    
    if (isCorrect) {
        // 정답일 때 효과들
        if (wordElement) {
            wordElement.style.animation = 'correctAnswer 0.6s ease, wordGlow 0.8s ease';
        }
        if (inputArea) {
            inputArea.style.animation = 'successFlash 0.5s ease';
        }
        if (buttonElement) {
            buttonElement.style.animation = 'buttonSuccess 0.6s ease';
        }
        
        // 파티클 및 반짝임 효과 (요소가 있을 때만)
        if (wordElement) {
            createParticles(wordElement, 10);
            createSparkles(wordElement, 8);
            
            // 타이핑 효과
            const originalText = wordElement.textContent;
            wordElement.textContent = '';
            wordElement.classList.add('typing-effect');
            
            let charIndex = 0;
            const typeInterval = setInterval(() => {
                wordElement.textContent += originalText[charIndex];
                charIndex++;
                
                if (charIndex >= originalText.length) {
                    clearInterval(typeInterval);
                    wordElement.classList.remove('typing-effect');
                }
            }, 50);
        }
        
        setTimeout(() => {
            if (wordElement) wordElement.style.animation = '';
            if (inputArea) inputArea.style.animation = '';
            if (buttonElement) buttonElement.style.animation = '';
        }, 600);
    } else {
        // 오답일 때 효과들
        if (wordElement) {
            wordElement.style.animation = 'wrongAnswer 0.8s ease';
        }
        if (inputArea) {
            inputArea.style.animation = 'errorFlash 0.5s ease';
        }
        if (buttonElement) {
            buttonElement.style.animation = 'buttonError 0.6s ease';
        }
        
        // 입력창 흔들림
        const inputElement = document.querySelector('input[type="text"]');
        if (inputElement) {
            inputElement.style.animation = 'wrongAnswer 0.5s ease';
        }
        
        setTimeout(() => {
            if (wordElement) wordElement.style.animation = '';
            if (inputArea) inputArea.style.animation = '';
            if (buttonElement) buttonElement.style.animation = '';
            if (inputElement) inputElement.style.animation = '';
        }, 800);
    }
}

// 플레이어 변경 시 애니메이션
function animatePlayerChange() {
    const currentPlayerCard = document.querySelector('.player-card.active');
    if (currentPlayerCard) {
        const character = currentPlayerCard.querySelector('.player-character');
        character.style.animation = 'bounce 0.8s ease';
        setTimeout(() => {
            character.style.animation = '';
        }, 800);
    }
}

// 입력창 포커스 애니메이션
function animateInputFocus() {
    const inputElement = document.querySelector('input[type="text"]');
    inputElement.style.animation = 'inputFocus 0.5s ease';
    setTimeout(() => {
        inputElement.style.animation = '';
    }, 500);
}

// 타이머 경고 애니메이션
function animateTimerWarning() {
    const timerBox = timerElement.closest('.info-box');
    if (timerBox) {
        timerBox.style.animation = 'timerPulse 0.5s ease infinite';
    }
}

// 타이머 정상 상태로 복구
function resetTimerAnimation() {
    const timerBox = timerElement.closest('.info-box');
    if (timerBox) {
        timerBox.style.animation = '';
    }
}

// 초기 기록 플레이스홀더 표시
function showHistoryPlaceholder() {
    if (wordHistoryList.children.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'word-history-placeholder';
        placeholder.textContent = '게임이 시작되면 단어 기록이 여기에 표시됩니다';
        wordHistoryList.appendChild(placeholder);
    }
}

// 플레이스홀더 제거
function removeHistoryPlaceholder() {
    const placeholder = wordHistoryList.querySelector('.word-history-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
}

// 단어 유효성 검사 함수
function validateWord(word) {
    // 빈 단어 체크
    if (!word) {
        return { valid: false, message: '단어를 입력하세요!' };
    }
    
    // 한글자 체크
    if (word.length < 2) {
        return { valid: false, message: '단어는 2글자 이상 입력해야 합니다!' };
    }
    
    // 중복 단어 체크
    if (usedWords.includes(word)) {
        return { valid: false, message: '이미 사용된 단어입니다!' };
    }
    
    // 끝말잇기 규칙 체크 (첫 번째 단어가 아닌 경우)
    if (currentWord && currentWord[currentWord.length - 1] !== word[0]) {
        return { valid: false, message: '끝말잇기 규칙에 맞지 않습니다!' };
    }
    
    return { valid: true, message: '' };
}

// 끝말잇기 게임 로직
buttonElement.addEventListener('click', () => {
    const newWord = inputElement.value.trim(); // 사용자가 입력한 단어
    console.log('버튼 클릭됨 - 입력된 단어:', newWord);
    console.log('현재 단어:', currentWord);
    
    // 단어 유효성 검사
    const validation = validateWord(newWord);
    console.log('유효성 검사 결과:', validation);
    if (!validation.valid) {
        // 오류 단어를 기록에 추가
        addWordRecord(null, `❌ ${currentPlayer}: ${newWord}`, true);
        
        // 시각적 효과 표시
        showWordEffect(newWord, false);
        
        // 모든 게임 모드에서 규칙 위반 시 탈락 처리
        alert(`${currentPlayer}님이 ${validation.message.replace('!', '')}으로 탈락했습니다!`);
        eliminatePlayer(currentPlayer);
        return;
    }

    // 단어가 유효하면 게임 진행
    const previousWord = currentWord;
    currentWord = newWord;
    
    // 제시어 업데이트
    updateCurrentWord();

    // 점수 계산 및 업데이트 (1글자당 1점)
    const points = newWord.length;
    console.log(`점수 계산: ${currentPlayer}가 "${newWord}" (${points}글자) 입력 - ${points}점 획득`);
    console.log(`점수 업데이트 전 ${currentPlayer}의 점수:`, playerScores[currentPlayer]);
    updateScore(currentPlayer, points);
    console.log(`점수 업데이트 후 ${currentPlayer}의 점수:`, playerScores[currentPlayer]);

    // 단어 기록 추가
    addWordRecord(previousWord, `${newWord} (+${points}점)`, false);
    
    // 시각적 효과 표시
    showWordEffect(newWord, true);

    // 사용된 단어 목록에 추가
    usedWords.push(newWord);

    // 게임 기록 추가
    gameHistory.push({
        event: 'word_submission',
        player: currentPlayer,
        word: newWord,
        points: points
    });

    // 게임 종료 확인
    if (checkGameEnd()) return;

    // 다음 플레이어로 이동
    console.log('다음 플레이어로 이동 전 - 현재 플레이어:', currentPlayer);
    nextPlayer();
    console.log('다음 플레이어로 이동 후 - 현재 플레이어:', currentPlayer);

    // 입력 필드 초기화
    inputElement.value = '';
    inputElement.focus();
});

// 페이지 로드 시 게임 설정 시작
document.addEventListener('DOMContentLoaded', () => {
    // 게임 설정 시작 (약간의 지연 추가)
    setTimeout(() => {
        setupGame();
    }, 100);
});
