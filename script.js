document.addEventListener('DOMContentLoaded', () => {
  const loggedInUser = localStorage.getItem('loggedInUser');
  if (!loggedInUser) {
    window.location.href = 'login.html';
    return;
  }

  const chatContainer = document.getElementById('chat-container');
  const journalContainer = document.getElementById('journal-container');
  const journalLog = document.getElementById('journal-log');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const toggleBtn = document.getElementById('toggle-btn');
  const STORAGE_KEY = `empathyEchoLog_${loggedInUser}`;

  loadJournal();
  greetUser();

  function greetUser() {
    const hasGreeted = sessionStorage.getItem('greetedUser');
    if (hasGreeted) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.username === loggedInUser);
    const displayName = currentUser?.username || 'there';
    const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    showTyping();
    setTimeout(() => {
      removeTyping();
      const welcomeMessage = log.length === 0
        ? `Nice to meet you, ${displayName}!! 😊 I'm Echo — your listening buddy. How are you feeling today?`
        : `Welcome back, ${displayName}! 😊 Good to see you again. What’s on your mind today?`;
      appendMessage(welcomeMessage, 'bot');
      saveToJournal(welcomeMessage, 'bot');
      if (log.length === 0) showMoodButtons();
      addPickMoodButton();
      sessionStorage.setItem('greetedUser', 'true');
    }, 1000);
  }

  function showMoodButtons() {
    const container = document.createElement('div');
    container.className = 'message bot';
    container.style.display = 'flex';
    container.style.gap = '1rem';
    container.style.justifyContent = 'flex-start';

    const moods = [
      { emoji: '😊', text: 'I feel happy!' },
      { emoji: '😐', text: 'I feel okay.' },
      { emoji: '😢', text: 'I feel a bit down.' }
    ];

    moods.forEach(mood => {
      const btn = document.createElement('button');
      btn.textContent = mood.emoji;
      btn.style.fontSize = '1.5rem';
      btn.style.cursor = 'pointer';
      btn.style.border = 'none';
      btn.style.background = 'transparent';

      btn.onclick = () => {
        appendMessage(mood.text, 'user');
        saveToJournal(mood.text, 'user');
        setTimeout(() => {
          const { mainReply, followUp } = generateBotResponse(mood.text);
          appendBotReplyInteractive(mainReply);
          setTimeout(() => appendBotReplyInteractive(followUp), 1000);
        }, 600);
        container.remove();
      };

      container.appendChild(btn);
    });

    chatContainer.appendChild(container);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function addPickMoodButton() {
    const pickMoodBtn = document.createElement('button');
    pickMoodBtn.textContent = 'Pick Mood Again';
    pickMoodBtn.style.background = '#6c63ff';
    pickMoodBtn.style.color = '#fff';
    pickMoodBtn.style.border = 'none';
    pickMoodBtn.style.padding = '0.5rem 1rem';
    pickMoodBtn.style.borderRadius = '8px';
    pickMoodBtn.style.cursor = 'pointer';
    pickMoodBtn.style.marginTop = '1rem';

    pickMoodBtn.onclick = () => {
      showMoodButtons();
    };

    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';
    wrapper.appendChild(pickMoodBtn);

    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  toggleBtn.addEventListener('click', () => {
    chatContainer.classList.toggle('hidden');
    journalContainer.classList.toggle('hidden');
    toggleBtn.textContent = journalContainer.classList.contains('hidden') ? 'View Journal' : 'Back to Chat';
  });

  sendBtn.addEventListener('click', handleUserMessage);
  userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleUserMessage();
  });

  function handleUserMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    saveToJournal(text, 'user');
    userInput.value = '';

    setTimeout(() => {
      const { mainReply, followUp } = generateBotResponse(text);
      appendBotReplyInteractive(mainReply);
      setTimeout(() => appendBotReplyInteractive(followUp), 1000);
    }, 600);
  }

  function appendMessage(txt, sndr) {
    const m = document.createElement('div');
    m.className = `message ${sndr}`;
    m.textContent = txt;
    chatContainer.appendChild(m);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function appendBotReplyInteractive(message, delay = 1000) {
    showTyping();
    setTimeout(() => {
      removeTyping();
      appendMessage(message, 'bot');
      saveToJournal(message, 'bot');
    }, delay);
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'message bot typing-indicator';
    typing.id = 'typing';
    typing.innerHTML = `
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    `;
    chatContainer.appendChild(typing);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function removeTyping() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
  }

  function analyzeSentiment(t) {
    const negativeWords = ['sad', 'angry', 'upset', 'worried', 'anxious', 'overwhelmed'];
    const positiveWords = ['happy', 'excited', 'joy', 'good', 'great', 'awesome', 'fantastic'];
    if (negativeWords.some(w => t.toLowerCase().includes(w))) return 'negative';
    if (positiveWords.some(w => t.toLowerCase().includes(w))) return 'positive';
    return 'neutral';
  }

  function generateBotResponse(input) {
    const sentiment = analyzeSentiment(input);
    let mainReply = '';
    let followUp = '';

    if (sentiment === 'negative') {
      mainReply = "It sounds like you might be feeling down. I'm here to listen—would you like to share more?";
      followUp = "Oh! I'm so sorry. That should never happen again! Remember, I'm always here for you. 💙";
    } else if (sentiment === 'positive') {
      mainReply = "That's wonderful to hear! What made you feel that way?";
      followUp = "Oh my gosh! That's great — I feel happy for you! 🌟 Keep spreading those good vibes!";
    } else {
      mainReply = `I hear you’re saying: "${input}".`;
      followUp = "That's totally fine! Sometimes it's okay to feel just okay. I'm still here with you. 😊";
    }

    return { mainReply, followUp };
  }

  function saveToJournal(text, sender) {
    const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    log.push({ text, sender, time: new Date().toLocaleString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    renderJournal(log);
  }

  function loadJournal() {
    renderJournal(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  }

  function renderJournal(log) {
    journalLog.innerHTML = '';
    log.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `[${entry.time}] ${entry.sender.toUpperCase()}: ${entry.text}`;
      journalLog.appendChild(li);
    });
  }

  function logoutUser() {
    localStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('greetedUser');
    window.location.href = 'role.html';
  }

  window.logoutUser = logoutUser;
});
