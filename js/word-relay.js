// HTML 요소 가져오기
const orderElement = document.querySelector('#order'); // 참가자 순서 표시
const wordElement = document.querySelector('#word'); // 제시어 표시
const inputElement = document.querySelector('input[type="text"]'); // 입력 필드
const buttonElement = document.querySelector('button'); // 입력 버튼
const timerElement = document.querySelector('#timer'); // 남은 시간을 표시할 요소
const currentPlayerNameElement = document.querySelector('#current-player-name'); // 현재 플레이어 이름
const rankingAreaElement = document.querySelector('#ranking-area'); // 순위 표시 영역

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
}

// 첫 번째 참가자로 시작
currentPlayer = activePlayers[0];

// 순위 표시 업데이트 함수
function updateRanking() {
    rankingAreaElement.innerHTML = ''; // 기존 순위 카드 제거
    
    activePlayers.forEach((player, index) => {
        const rankCard = document.createElement('div');
        rankCard.className = 'rank-card';
        if (player === currentPlayer) {
            rankCard.style.border = '3px solid #FF5722';
            rankCard.style.background = 'rgba(255, 235, 238, 0.9)';
        }
        
        rankCard.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="rank-name">${player}</div>
        `;
        
        rankingAreaElement.appendChild(rankCard);
    });
}

// 현재 플레이어 정보 업데이트 함수
function updateCurrentPlayer() {
    orderElement.textContent = currentPlayer;
    currentPlayerNameElement.textContent = currentPlayer;
    updateRanking();
}

// 텍스트 입력창에 포커스 설정
inputElement.focus(); // 화면 로드 시 입력창에 포커스

// 엔터키로 단어 등록 기능 추가
inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        buttonElement.click(); // 버튼 클릭 이벤트 트리거
    }
});

// 시간 제한 입력받기
timeLimit = parseInt(prompt('시간 제한(초)을 입력하세요 (기본값: 10):'), 10);
if (isNaN(timeLimit) || timeLimit <= 0) {
    alert('올바른 시간 제한을 입력하세요! 기본값(10초)으로 설정됩니다.');
    timeLimit = 10;
}
timeRemaining = timeLimit; // 남은 시간을 초기화

// 설정값 확인
const participantsList = playerNames.join(', ');
const confirmSettings = confirm(
    `설정값을 확인하세요:\n참가자: ${participantsList}\n시간 제한: ${timeLimit}초\n\n이 게임은 두음 법칙이 적용되어 있지 않습니다\n단어는 2글자 이상 입력해야 합니다\n이 설정으로 게임을 시작하시겠습니까?`
);
if (!confirmSettings) {
    alert('게임 설정을 취소했습니다. 페이지를 새로고침합니다.');
    location.reload(); // 설정 취소 시 페이지 새로고침
}

// 타이머 업데이트 함수
function updateTimer() {
    timeRemaining -= 1;
    timerElement.textContent = `${timeRemaining}초`;

    if (timeRemaining <= 0) {
        alert(`${currentPlayer}님이 시간 초과로 탈락했습니다!`);
        eliminatePlayer(currentPlayer);
    }
}

// 참가자 탈락 처리 함수
function eliminatePlayer(player) {
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
    if (activePlayers.length === 1) {
        alert(`${activePlayers[0]}님이 승리했습니다!`);
        resetGame();
        return;
    }

    // 다음 참가자로 이동
    const currentIndex = activePlayers.indexOf(player);
    if (currentIndex === -1 || activePlayers.length === 0) {
        // 현재 참가자가 배열에서 제거된 경우, 다음 참가자를 첫 번째로 설정
        currentPlayer = activePlayers[0];
    } else {
        // 다음 참가자로 이동
        currentPlayer = activePlayers[(currentIndex) % activePlayers.length];
    }
    updateCurrentPlayer(); // HTML에 표시되는 참가자 이름 업데이트

    // 타이머 초기화
    timeRemaining = timeLimit;
    timerElement.textContent = `${timeRemaining}초`;
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
}

// 게임 초기화 함수
function resetGame() {
    clearInterval(timer); // 타이머 정지
    inputElement.disabled = true; // 입력 비활성화
    buttonElement.disabled = true; // 버튼 비활성화
    saveGameData(); // 게임 데이터 저장
    alert('게임이 종료되었습니다.');
}

// JSON 파일로 저장하는 함수
function saveGameData() {
    const gameData = {
        playerNames,
        totalPlayers,
        timeLimit,
        usedWords,
        lastWord: currentWord,
        activePlayers,
        gameHistory // 게임 기록 추가
    };
    const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-data.json'; // 저장될 파일 이름
    a.click();
    URL.revokeObjectURL(url); // URL 객체 해제
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
    
    // 단어 유효성 검사
    const validation = validateWord(newWord);
    if (!validation.valid) {
        alert(`${currentPlayer}님이 ${validation.message.replace('!', '')}으로 탈락했습니다!`);
        eliminatePlayer(currentPlayer);
        return;
    }

    // 단어가 유효하면 게임 진행
    currentWord = newWord;
    wordElement.textContent = currentWord;

    // 사용된 단어 목록에 추가
    usedWords.push(newWord);

    // 게임 기록 추가
    gameHistory.push({
        event: 'word_submission',
        player: currentPlayer,
        word: newWord
    });

    // 참가자 순서 업데이트
    const currentIndex = activePlayers.indexOf(currentPlayer);
    currentPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];
    updateCurrentPlayer();

    // 타이머 초기화
    clearInterval(timer);
    timeRemaining = timeLimit;
    timerElement.textContent = `${timeRemaining}초`;
    timer = setInterval(updateTimer, 1000);

    // 입력 필드 초기화
    inputElement.value = '';
    inputElement.focus();
});

// 페이지 로드 시 타이머 시작
window.addEventListener('load', () => {
    // 첫 번째 참가자 표시
    updateCurrentPlayer();
   
    // 타이머 초기화 및 시작
    timerElement.textContent = `${timeRemaining}초`;
    timer = setInterval(updateTimer, 1000);
});