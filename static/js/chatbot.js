document.addEventListener("DOMContentLoaded", () => {
    // Select elements
    const typingForm = document.querySelector(".typing-form");
    const chatContainer = document.querySelector(".chat-list");
    const feelings = document.querySelectorAll(".feeling");
    const themeToggleButtons = document.querySelectorAll(".theme-toggle-button");
    const deleteChatButtons = document.querySelectorAll(".delete-chat-button");
    const hamburgerIcon = document.querySelector(".hamburger-icon");
    const floatingMenu = document.querySelector(".floating-menu");
  
    // Debug: Log elements to ensure they’re found
    console.log("Theme toggle buttons:", themeToggleButtons);
    console.log("Delete chat buttons:", deleteChatButtons);
    console.log("Typing form:", typingForm);
    console.log("Chat container:", chatContainer);
    console.log("Feelings:", feelings);
    console.log("Hamburger icon:", hamburgerIcon);
    console.log("Floating menu:", floatingMenu);
  
    let userMessage = null;
    let isResponseGenerating = false;
    let awaitingFollowUp = false;
    let selectedFeelings = [];
    let userResponses = [];
    let userExplanations = [];
    let gameQuestionNumber = 0;
    let typingStartTime = null;
    let typingEndTime = null;
    let gameStartTime = null;
    let typingSpeeds = [];
    let questionStartTimes = [];
    let questionEndTimes = [];
    let questionDurations = [];
    let gameDeclined = false;
  
    // Hamburger Menu Toggle
    if (hamburgerIcon && floatingMenu) {
      hamburgerIcon.addEventListener("click", () => {
        floatingMenu.classList.toggle("active");
        console.log("Menu toggled:", floatingMenu.classList.contains("active") ? "open" : "closed");
      });
    } else {
      console.warn("Hamburger icon or floating menu not found");
    }
  
    // Theme Toggle
    if (themeToggleButtons.length > 0) {
      themeToggleButtons.forEach(button => {
        button.addEventListener("click", () => {
          try {
            const isLightMode = document.body.classList.toggle("light_mode");
            localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
            const iconName = isLightMode ? "moon-outline" : "sunny-outline";
            themeToggleButtons.forEach(btn => {
              const icon = btn.querySelector("ion-icon");
              if (icon) {
                icon.setAttribute("name", iconName);
              } else {
                console.warn("No ion-icon found in theme button:", btn);
              }
            });
            console.log("Theme toggled to:", isLightMode ? "light" : "dark");
          } catch (error) {
            console.error("Error toggling theme:", error);
          }
        });
      });
    } else {
      console.error("No theme toggle buttons found");
    }
  
    // Delete Chat
    if (deleteChatButtons.length > 0) {
      deleteChatButtons.forEach(button => {
        button.addEventListener("click", () => {
          try {
            if (confirm("Are you sure you want to delete all the chats?")) {
              localStorage.removeItem("saved-chats");
              loadDataFromLocalstorage();
              console.log("Chat cleared");
            }
          } catch (error) {
            console.error("Error clearing chat:", error);
          }
        });
      });
    } else {
      console.error("No delete chat buttons found");
    }
  
    // Existing Code (Unchanged)
    const loadDataFromLocalstorage = () => {
      const savedChats = localStorage.getItem("saved-chats");
      const isLightMode = localStorage.getItem("themeColor") === "light_mode";
      document.body.classList.toggle("light_mode", isLightMode);
      themeToggleButtons.forEach(btn => {
        const icon = btn.querySelector("ion-icon");
        if (icon) {
          icon.setAttribute("name", isLightMode ? "moon-outline" : "sunny-outline");
        }
      });
      chatContainer.innerHTML = savedChats || '';
      document.body.classList.toggle("hide-header", savedChats);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
    };
  
    const createMessageElement = (content, ...classes) => {
      const div = document.createElement("div");
      div.classList.add("message", ...classes);
      div.innerHTML = content;
      return div;
    };
  
    const copyMessage = (copyButton) => {
      const messageText = copyButton.parentElement.querySelector(".text").innerText;
      navigator.clipboard.writeText(messageText);
      copyButton.innerText = "done";
      setTimeout(() => copyButton.innerText = "content_copy", 1000);
    };
  
    const displayMessage = (message, type) => {
      const avatar = type === "incoming" 
        ? '<img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">'
        : '';
      const userAvatar = type === "outgoing" 
        ? '<img src="/static/images/user.gif" alt="User avatar" style="width: 40px; vertical-align: middle; margin-left: 5px;">'
        : '';
      const messageContent = `<div class="message-content">${type === "incoming" ? avatar : ''}<p class="text">${message}</p>${type === "outgoing" ? userAvatar : ''}</div>`;
      const messageDiv = createMessageElement(messageContent, type);
      chatContainer.appendChild(messageDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
    };
  
    const handleOutgoingChat = async () => {
      typingEndTime = new Date();
      userMessage = typingForm.querySelector(".typing-input").value.trim();
  
      if (!userMessage || isResponseGenerating) return;
  
      isResponseGenerating = true;
      const typingSpeed = typingEndTime && typingStartTime 
        ? (userMessage.length / ((typingEndTime - typingStartTime) / 1000)) * 60 
        : 0;
  
      if (typingSpeed > 0) {
        typingSpeeds.push(typingSpeed);
      }
  
      displayMessage(userMessage, "outgoing");
  
      typingForm.reset();
      document.body.classList.add("hide-header");
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      if (gameDeclined && userMessage.toLowerCase().includes("test")) {
        gameDeclined = false;
        gameQuestionNumber = 1;
        gameStartTime = new Date();
        displayMessage("Ok, let's get started!", "incoming");
        setTimeout(() => {
          handleGameQuestion1();
        }, 500);
        isResponseGenerating = false;
        return;
      }
  
      if (awaitingFollowUp) {
        await handleFollowUp(userMessage);
      } else if (gameQuestionNumber > 0) {
        await handleGameQuestionResponse(userMessage);
      } else {
        if (!gameStartTime) {
          gameStartTime = new Date();
        }
        setTimeout(async () => {
          isResponseGenerating = false;
          localStorage.setItem("saved-chats", chatContainer.innerHTML);
          await analyzeResponseWithBackend(userMessage, typingSpeed);
        }, 500);
      }
    };
  
    const analyzeResponseWithBackend = async (userMessage, typingSpeed) => {
      if (userMessage.toLowerCase() === "ok") {
        displayMessage("Alright, keeping it chill! What's on your mind next? 😎", "incoming");
        isResponseGenerating = false;
        return;
      }
  
      const analysis = {
        typingSpeed: typingSpeed,
        emotion: detectEmotion(userMessage),
        keywords: extractKeywords(userMessage),
        message: userMessage
      };
  
      try {
        const response = await fetch("/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(analysis),
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        displayMessage(data.response, "incoming");
      } catch (error) {
        console.error("Error analyzing response:", error);
        displayMessage("Oops, something went wrong. Let's try again!", "incoming");
      }
      isResponseGenerating = false;
    };
  
    const detectEmotion = (message) => {
      const happyKeywords = [
        "happy", "delighted", "joyful", "excited", "cheerful", "elated", "ecstatic", "glad", 
        "content", "grateful", "blissful", "jubilant", "smiling", "satisfied", "sunny", 
        "radiant", "upbeat", "chill", "thrilled", "pumped", "hyped"
      ];
      
      const sadKeywords = [
        "sad", "down", "unhappy", "depressed", "gloomy", "blue", "miserable", "melancholy", 
        "tearful", "crying", "heartbroken", "sorrowful", "disheartened", "low", "hopeless", 
        "lonely", "dejected", "hurt", "moody", "grieving"
      ];
      
      const stressedKeywords = [
        "stressed", "anxious", "worried", "tense", "nervous", "pressured", "overthinking", 
        "frazzled", "panicked", "overwhelmed", "uneasy", "restless", "on edge", "burnt out", 
        "shaky", "rushed", "freaking out", "tight", "twitchy", "unsettled"
      ];
      
      const overwhelmedKeywords = [
        "overwhelmed", "panic", "anxious", "helpless", "burdened", "exhausted", "swamped", 
        "drowning", "suffocating", "trapped", "chaotic", "crushed", "lost", "confused", 
        "flooded", "frazzled", "frantic", "can't cope", "breaking down", "drained"
      ];
      
      const lowerMessage = message.toLowerCase();
      if (happyKeywords.some(kw => lowerMessage.includes(kw))) return "happy";
      if (sadKeywords.some(kw => lowerMessage.includes(kw))) return "sad";
      if (stressedKeywords.some(kw => lowerMessage.includes(kw))) return "stressed";
      if (overwhelmedKeywords.some(kw => lowerMessage.includes(kw))) return "overwhelmed";
      return "neutral";
    };
  
    const extractKeywords = (message) => {
      const words = message.split(" ");
      return words.filter(word => word.length > 3);
    };
  
    feelings.forEach(feeling => {
      feeling.addEventListener("click", () => {
        const feelingText = feeling.querySelector(".text").innerText.toLowerCase().split(" ")[0];
        if (!selectedFeelings.includes(feelingText)) {
          if (selectedFeelings.length < 4) {
            selectedFeelings.push(feelingText);
          } else {
            selectedFeelings.shift();
            selectedFeelings.push(feelingText);
          }
        }
  
        userMessage = feeling.querySelector(".text").innerText;
        const confirmationMessage = `I see you're feeling ${feelingText}! Remember, I'm here to chat whenever you need! 😊 So do you want to tell me about it?`;
        showConfirmation(confirmationMessage);
      });
    });
  
    typingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleOutgoingChat();
    });
  
    typingForm.querySelector(".typing-input").addEventListener("keydown", () => {
      if (!typingStartTime) {
        typingStartTime = new Date();
      }
    });
  
    const showConfirmation = (message) => {
      const confirmationHtml = `<div class="message-content">
                                <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                                <p class="text">${message}</p>
                              </div>
                              <div class="confirmation-buttons" style="position: relative; z-index: 1000;">
                                <button class="confirm-yes">YES</button>
                                <button class="confirm-no">NO</button>
                              </div>`;
      const confirmationMessageDiv = createMessageElement(confirmationHtml, "incoming");
      chatContainer.appendChild(confirmationMessageDiv);
      setTimeout(() => {
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
        confirmationMessageDiv.scrollIntoView({ behavior: "smooth", block: "end" });
  
        const yesButton = confirmationMessageDiv.querySelector(".confirm-yes");
        const noButton = confirmationMessageDiv.querySelector(".confirm-no");
  
        if (yesButton && noButton) {
          yesButton.addEventListener("click", () => {
            console.log("YES button clicked");
            displayMessage("Please tell me more about it.", "incoming");
            awaitingFollowUp = true;
            confirmationMessageDiv.remove();
          });
  
          noButton.addEventListener("click", () => {
            console.log("NO button clicked");
            displayMessage("No worries! I'm here whenever you're ready. 😊", "incoming");
            confirmationMessageDiv.remove();
          });
        } else {
          console.error("Buttons not found in DOM");
        }
      }, 100);
    };
  
    const handleFollowUp = async (userResponse) => {
      if (gameQuestionNumber === 0) {
        const happyKeywords = [
          "topped", "rank", "first", "selected", "passed", "promotion", "success", "birthday", 
          "cake", "celebrating", "achievement", "won", "victory", "party", "surprise", "gift", 
          "smile", "laughing", "grateful", "blessed", "good news", "festive", "shining", 
          "goal achieved", "masti", "mazedaar", "lit", "bindaas", "josh", "full power", 
          "chill scenes", "happy feeling", "scene on hai"
        ];
        
        const sadKeywords = [
          "failed", "rejected", "sad", "lost", "hurt", "broke", "crying", "down", "hopeless", 
          "pain", "heartbroken", "tear", "disappointed", "miserable", "alone", "grief", 
          "regret", "sorrow", "blue", "abandoned", "dil toota", "rona aa gaya", "kaafi bura", 
          "dard", "kya hi bacha", "low feel ho raha hai"
        ];
        
        const stressedKeywords = [
          "stressed", "tired", "burnout", "pressure", "workload", "exhausted", "deadline", 
          "tense", "no break", "grind", "nonstop", "late night", "sleep deprived", 
          "burned out", "mental fatigue", "back-to-back", "drained", "irritated", "tension",
          "dimag kharab", "upar se kaam", "kaam ka dher", "raat bhar jagna", "exam ka tension", 
          "boss ka load", "kaafi pressure hai"
        ];
        
        const overwhelmedKeywords = [
          "overwhelmed", "panic", "anxious", "helpless", "can't handle", "drowning", "flooded", 
          "swamped", "losing control", "burdened", "too much", "stuck", "pressure cooker", 
          "crushed", "chaotic", "spiraling", "meltdown", "breaking point", "clouded", "shaky",
          "haalat kharab", "kya karein samajh nahi aa raha", "poora dimag ghoom gaya", 
          "kaise hoga", "sambhal nahi raha", "control ke bahar", "kaafi zyada ho gaya"
        ];
        const lowerResponse = userResponse.toLowerCase();
        let emotionMatched = "";
  
        const keywordMatch = (keywords) => keywords.some(kw => lowerResponse.includes(kw));
        if (selectedFeelings.some(feeling => ["happy", "delighted"].includes(feeling.toLowerCase()))) {
          if (keywordMatch(happyKeywords)) emotionMatched = "happy";
        }
        if ((selectedFeelings.includes("sad") || selectedFeelings.includes("down")) && !emotionMatched) {
          if (keywordMatch(sadKeywords)) emotionMatched = "sad";
        }
        if ((selectedFeelings.includes("stressed") || selectedFeelings.includes("anxious")) && !emotionMatched) {
          if (keywordMatch(stressedKeywords)) emotionMatched = "stressed";
        }
        if (selectedFeelings.includes("overwhelmed") && !emotionMatched) {
          if (keywordMatch(overwhelmedKeywords)) emotionMatched = "overwhelmed";
        }
  
        const followUpResponses = {
          happy: "I'm so happy for you! You did an amazing job! 🎉",
          sad: "That must be tough. Just know you're not alone. 💙",
          stressed: "Try taking a break or doing something relaxing. You've got this. 🌿",
          overwhelmed: "I hear you. One step at a time — I'm right here with you. 🦋",
          default: "Thanks for sharing that with me. I'm here for you. 😊"
        };
  
        const finalResponse = followUpResponses[emotionMatched] || followUpResponses.default;
        const gameInvite = `<div class="message-content">
                            <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                            <p class="text">Would you like to play a quick game with 9 fun questions to know yourself better? 🎲</p>
                          </div>
                          <div class="confirmation-buttons" style="position: relative; z-index: 1000;">
                            <button class="game-yes">YES</button>
                            <button class="game-no">NO</button>
                          </div>`;
  
        setTimeout(() => {
          displayMessage(finalResponse, "incoming");
          const gameInviteDiv = createMessageElement(gameInvite, "incoming");
          chatContainer.appendChild(gameInviteDiv);
          chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
          const gameYesButton = gameInviteDiv.querySelector(".game-yes");
          const gameNoButton = gameInviteDiv.querySelector(".game-no");
  
          gameYesButton.addEventListener("click", () => {
            console.log("Game YES button clicked");
            handleGameResponse("yes");
            gameInviteDiv.remove();
          });
  
          gameNoButton.addEventListener("click", () => {
            console.log("Game NO button clicked");
            handleGameResponse("no");
            gameInviteDiv.remove();
          });
        }, 500);
  
        userExplanations.push(userResponse);
        awaitingFollowUp = false;
        isResponseGenerating = false;
      } else {
        userExplanations.push(userResponse);
        displayMessage("Thankyou for sharing !😊", "incoming");
        awaitingFollowUp = false;
        isResponseGenerating = false;
  
        if (gameQuestionNumber === 1) {
          handleGameQuestion2();
        } else if (gameQuestionNumber === 2) {
          handleGameQuestion3();
        } else if (gameQuestionNumber === 3) {
          handleGameQuestion4();
        } else if (gameQuestionNumber === 4) {
          handleGameQuestion5();
        } else if (gameQuestionNumber === 5) {
          handleGameQuestion6();
        } else if (gameQuestionNumber === 6) {
          handleGameQuestion7();
        } else if (gameQuestionNumber === 7) {
          handleGameQuestion8();
        } else if (gameQuestionNumber === 8) {
          handleGameQuestion9();
        } else if (gameQuestionNumber === 9) {
          analyzePersonality();
        }
      }
    };
  
    const handleGameResponse = (userResponse) => {
      if (userResponse.toLowerCase() === "yes") {
        gameQuestionNumber = 1;
        gameStartTime = new Date();
        handleGameQuestion1();
      } else {
        gameDeclined = true;
        displayMessage("No worries! We can do that later. Just let me know when you're ready with something like 'test' or 'I'm available for the test now'! 😊", "incoming");
      }
    };
  
    const handleGameQuestion1 = () => {
      gameQuestionNumber = 1;
      questionStartTimes[gameQuestionNumber] = new Date();
      const gameQuestion1 = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q1. What’s one memory from your childhood that always makes you smile? 🏡😊</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="1">
                              <button class="game-option">Playing with friends outside</button>
                              <button class="game-option">A special family moment</button>
                              <button class="game-option">Achieving something small but memorable</button>
                              <button class="game-option">Festivals & celebrations</button>
                              <button class="game-option">Something else (Want to share more?)</button>
                            </div>`;
      const gameQuestion1Div = createMessageElement(gameQuestion1, "incoming");
      chatContainer.appendChild(gameQuestion1Div);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = gameQuestion1Div.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          askForMoreDetails(1, gameQuestion1Div);
        });
      });
    };
  
    const handleGameQuestion2 = () => {
      gameQuestionNumber = 2;
      questionStartTimes[gameQuestionNumber] = new Date();
      const secondQuestion = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q2. Personality Type<br> If you had to describe yourself in three words, what would they be? 🎭🤔</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="2">
                              <button class="game-option">Introverted, calm, and thoughtful</button>
                              <button class="game-option">Outgoing, energetic, and social</button>
                              <button class="game-option">Creative, curious, and imaginative</button>
                              <button class="game-option">Practical, logical, and analytical</button>
                              <button class="game-option">Mixed personality (Want to explain more?)</button>
                            </div>`;
      const secondQuestionDiv = createMessageElement(secondQuestion, "incoming");
      chatContainer.appendChild(secondQuestionDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = secondQuestionDiv.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          askForMoreDetails(2, secondQuestionDiv);
        });
      });
    };
  
    const handleGameQuestion3 = () => {
      gameQuestionNumber = 3;
      questionStartTimes[gameQuestionNumber] = new Date();
      const thirdQuestion = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q3. How do you usually handle stress? 😕</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="3">
                              <button class="game-option">Talking to friends or family</button>
                              <button class="game-option">Writing down my thoughts</button>
                              <button class="game-option">Keeping it to myself</button>
                              <button class="game-option">Distracting myself with movies/music</button>
                              <button class="game-option">Something else (Want to share more?)</button>
                            </div>`;
      const thirdQuestionDiv = createMessageElement(thirdQuestion, "incoming");
      chatContainer.appendChild(thirdQuestionDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = thirdQuestionDiv.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          const responseText = `Stress is like Govinda’s dance moves—unpredictable and sometimes too much to handle! 😜 Quick Tip: Deep breathing can calm your nerves, just like hitting the pause button on a chaotic scene! 🎬🧘‍♂️`;
          displayMessage(responseText, "incoming");
          askForMoreDetails(3, thirdQuestionDiv);
        });
      });
    };
  
    const handleGameQuestion4 = () => {
      gameQuestionNumber = 4;
      questionStartTimes[gameQuestionNumber] = new Date();
      const fourthQuestion = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q4. If you could do anything in life without limits, what would it be? 🚀</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="4">
                              <button class="game-option">Start my own business</button>
                              <button class="game-option">Travel the world</button>
                              <button class="game-option">Work in my dream career</button>
                              <button class="game-option">Help people & make a difference</button>
                              <button class="game-option">Not sure yet (Want to discuss it?)</button>
                            </div>`;
      const fourthQuestionDiv = createMessageElement(fourthQuestion, "incoming");
      chatContainer.appendChild(fourthQuestionDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = fourthQuestionDiv.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          const responseText = `Amazing! Dream Big: Even the tallest skyscrapers start with a single brick. What’s your first step? 🧱🏙️`;
          displayMessage(responseText, "incoming");
          askForMoreDetails(4, fourthQuestionDiv);
        });
      });
    };
  
    const handleGameQuestion5 = () => {
      gameQuestionNumber = 5;
      questionStartTimes[gameQuestionNumber] = new Date();
      const fifthQuestion = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q5. What kind of movies or books do you love the most? 🎥📚</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="5">
                              <button class="game-option">Romantic & heartwarming stories</button>
                              <button class="game-option">Thriller & suspenseful ones</button>
                              <button class="game-option">Comedy & feel-good entertainment</button>
                              <button class="game-option">Science fiction & fantasy</button>
                              <button class="game-option">Other (Want to talk more?)</button>
                            </div>`;
      const fifthQuestionDiv = createMessageElement(fifthQuestion, "incoming");
      chatContainer.appendChild(fifthQuestionDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = fifthQuestionDiv.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          const responseText = `Wah! A fellow movie/book lover! Recommendation: If you love sci-fi, try "Dune"—it’s a cosmic thrill! 🚀`;
          displayMessage(responseText, "incoming");
          askForMoreDetails(5, fifthQuestionDiv);
        });
      });
    };
  
    const handleGameQuestion6 = () => {
      gameQuestionNumber = 6;
      questionStartTimes[gameQuestionNumber] = new Date();
      const sixthQuestion = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q6. Do you usually wake up feeling refreshed or tired? 😴</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="6">
                              <button class="game-option">Always refreshed and full of energy</button>
                              <button class="game-option">Depends on the day</button>
                              <button class="game-option">Often tired, even after sleeping</button>
                              <button class="game-option">I barely sleep (Want to discuss more?)</button>
                            </div>`;
      const sixthQuestionDiv = createMessageElement(sixthQuestion, "incoming");
      chatContainer.appendChild(sixthQuestionDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = sixthQuestionDiv.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          const responseText = `Sleep is like a Sachin Tendulkar innings—miss it, and you’re off your game! 🏏 Sleep Hack: Skip screens before bed for a winning rest! 🌙📵`;
          displayMessage(responseText, "incoming");
          askForMoreDetails(6, sixthQuestionDiv);
        });
      });
    };
  
    const handleGameQuestion7 = () => {
      gameQuestionNumber = 7;
      questionStartTimes[gameQuestionNumber] = new Date();
      const seventhQuestion = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q7. If there was one thing you wish people understood about you, what would it be? 🤔</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="7">
                              <button class="game-option">My emotions & feelings</button>
                              <button class="game-option">My dreams & ambitions</button>
                              <button class="game-option">My struggles & challenges</button>
                              <button class="game-option">My personality & way of thinking</button>
                              <button class="game-option">Something else (Want to share more?)</button>
                            </div>`;
      const seventhQuestionDiv = createMessageElement(seventhQuestion, "incoming");
      chatContainer.appendChild(seventhQuestionDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = seventhQuestionDiv.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          const responseText = `That’s deep! Empathy Note: Understanding someone is like reading between the lines; it takes patience and love. 💞📝`;
          displayMessage(responseText, "incoming");
          askForMoreDetails(7, seventhQuestionDiv);
        });
      });
    };
  
    const handleGameQuestion8 = () => {
      gameQuestionNumber = 8;
      questionStartTimes[gameQuestionNumber] = new Date();
      const eighthQuestion = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q8. How much time do you usually spend on your phone daily? 📱🤔</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="8">
                              <button class="game-option">Less than 2 hours</button>
                              <button class="game-option">2-4 hours</button>
                              <button class="game-option">4-6 hours</button>
                              <button class="game-option">More than 6 hours (Want to discuss?)</button>
                            </div>`;
      const eighthQuestionDiv = createMessageElement(eighthQuestion, "incoming");
      chatContainer.appendChild(eighthQuestionDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = eighthQuestionDiv.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          const responseText = option.innerText === "Less than 2 hours"
            ? `Only 2 hours? You’re dodging the phone trap like a pro! 😜 Tip: Keep those eyes off screens for a bit—your brain deserves a chai break! ☕`
            : `Phones, huh? They’re like time magnets! 😜 Tip: Try a screen-free hour—it’s like a mini-vacation for your brain! ☕`;
          displayMessage(responseText, "incoming");
          askForMoreDetails(8, eighthQuestionDiv);
        });
      });
    };
  
    const handleGameQuestion9 = () => {
      gameQuestionNumber = 9;
      questionStartTimes[gameQuestionNumber] = new Date();
      const ninthQuestion = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Q9. Have you ever been in a relationship or experienced a tough breakup? 💔😞</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;" data-question="9">
                              <button class="game-option">Never been in a relationship</button>
                              <button class="game-option">Had a relationship, but it ended well</button>
                              <button class="game-option">Had a relationship, and the breakup was tough</button>
                              <button class="game-option">Currently in a relationship</button>
                            </div>`;
      const ninthQuestionDiv = createMessageElement(ninthQuestion, "incoming");
      chatContainer.appendChild(ninthQuestionDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const gameOptions = ninthQuestionDiv.querySelectorAll(".game-option");
      gameOptions.forEach(option => {
        option.addEventListener("click", () => {
          console.log(`Game option clicked: ${option.innerText}`);
          userResponses.push(option.innerText);
          displayMessage(`You chose: ${option.innerText}`, "outgoing");
          questionEndTimes[gameQuestionNumber] = new Date();
          questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
          gameOptions.forEach(btn => btn.disabled = true);
          let responseText = "";
          if (option.innerText.includes("Never been")) {
            responseText = `That’s cool! Relationships are like Bollywood movies—sometimes you’re just waiting for the right script! 😊`;
          } else if (option.innerText.includes("ended well")) {
            responseText = `That’s nice! Ending on good terms is like a happy song in a movie. 🎶`;
          } else if (option.innerText.includes("tough")) {
            responseText = `I’m sorry, breakups can be rough, like a sad scene in a film. I’m here if you want to talk. 💙`;
          } else {
            responseText = `Aww, that’s sweet! Being in love is like dancing in a romantic Bollywood number! 💖`;
          }
          responseText += ` Let’s Connect: Want to share more about your experiences?`;
          displayMessage(responseText, "incoming");
          askForMoreDetails(9, ninthQuestionDiv);
        });
      });
    };
  
    const askForMoreDetails = (questionNumber, questionDiv) => {
      const newMessageHtml = `<div class="message-content">
                              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
                              <p class="text">Would you like to share more about this? (YES/NO)</p>
                            </div>
                            <div class="confirmation-buttons" style="position: relative; z-index: 1000;">
                              <button class="share-more-yes">YES</button>
                              <button class="share-more-no">NO</button>
                            </div>`;
      const newMessageDiv = createMessageElement(newMessageHtml, "incoming");
      chatContainer.appendChild(newMessageDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
      const shareMoreYesButton = newMessageDiv.querySelector(".share-more-yes");
      const shareMoreNoButton = newMessageDiv.querySelector(".share-more-no");
  
      shareMoreYesButton.addEventListener("click", () => {
        console.log("Share more YES button clicked");
        displayMessage("Please tell me more about it.", "incoming");
        questionEndTimes[gameQuestionNumber] = new Date();
        questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
        awaitingFollowUp = true;
        newMessageDiv.remove();
      });
  
      shareMoreNoButton.addEventListener("click", () => {
        console.log("Share more NO button clicked");
        questionEndTimes[gameQuestionNumber] = new Date();
        questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
        newMessageDiv.remove();
        if (questionNumber === 1) {
          handleGameQuestion2();
        } else if (questionNumber === 2) {
          handleGameQuestion3();
        } else if (questionNumber === 3) {
          handleGameQuestion4();
        } else if (questionNumber === 4) {
          handleGameQuestion5();
        } else if (questionNumber === 5) {
          handleGameQuestion6();
        } else if (questionNumber === 6) {
          handleGameQuestion7();
        } else if (questionNumber === 7) {
          handleGameQuestion8();
        } else if (questionNumber === 8) {
          handleGameQuestion9();
        } else if (questionNumber === 9) {
          analyzePersonality();
        }
      });
    };
  
    const handleGameQuestionResponse = async (userMessage) => {
      userResponses.push(userMessage);
      displayMessage(userMessage, "outgoing");
      questionEndTimes[gameQuestionNumber] = new Date();
      questionDurations[gameQuestionNumber] = (questionEndTimes[gameQuestionNumber] - questionStartTimes[gameQuestionNumber]) / 1000;
      awaitingFollowUp = false;
  
      if (gameQuestionNumber === 1) {
        handleGameQuestion2();
      } else if (gameQuestionNumber === 2) {
        handleGameQuestion3();
      } else if (gameQuestionNumber === 3) {
        handleGameQuestion4();
      } else if (gameQuestionNumber === 4) {
        handleGameQuestion5();
      } else if (gameQuestionNumber === 5) {
        handleGameQuestion6();
      } else if (gameQuestionNumber === 6) {
        handleGameQuestion7();
      } else if (gameQuestionNumber === 7) {
        handleGameQuestion8();
      } else if (gameQuestionNumber === 8) {
        handleGameQuestion9();
      } else if (gameQuestionNumber === 9) {
        analyzePersonality();
      }
    };
  
    const analyzePersonality = async () => {
      const gameEndTime = new Date();
      const timeTakenMs = gameEndTime - gameStartTime;
      const timeTakenMin = Math.floor(timeTakenMs / 60000);
      const timeTakenSec = Math.floor((timeTakenMs % 60000) / 1000);
  
      const avgTypingSpeed = typingSpeeds.length > 0 
        ? (typingSpeeds.reduce((a, b) => a + b, 0) / typingSpeeds.length).toFixed(1)
        : 0;
  
      const timeDisplay = timeTakenMin > 0 
        ? `${timeTakenMin}m ${timeTakenSec}s`
        : `${timeTakenSec}s`;
  
      const questionsExplained = userExplanations.length;
  
      const analysisData = {
        responses: userResponses,
        explanations: userExplanations,
        timeTaken: timeTakenMs / 1000,
        typingSpeed: avgTypingSpeed,
        questionDurations: questionDurations.filter(d => d !== undefined),
        questionsAnswered: questionDurations.filter(d => d !== undefined).length
      };
  
      let coreTraits = [];
      const q2Response = userResponses[1] || "Mixed personality";
      if (q2Response.includes("Introverted")) {
        coreTraits = ["Introverted", "Calm", "Thoughtful"];
      } else if (q2Response.includes("Outgoing")) {
        coreTraits = ["Outgoing", "Energetic", "Social"];
      } else if (q2Response.includes("Creative")) {
        coreTraits = ["Creative", "Curious", "Imaginative"];
      } else if (q2Response.includes("Practical")) {
        coreTraits = ["Practical", "Logical", "Analytical"];
      } else {
        coreTraits = ["Balanced", "Versatile", "Unique"];
      }
  
      const q8Response = userResponses[7] || "";
      if (q8Response === "Less than 2 hours" || q8Response === "2-4 hours") {
        coreTraits = coreTraits.filter(trait => !["Balanced", "Versatile", "Unique"].includes(trait));
        coreTraits.push("Structured", "Career-oriented");
        coreTraits = coreTraits.slice(0, 3);
      }
  
      const q9Response = userResponses[8] || "";
      if (q9Response.includes("Currently in a relationship") || q9Response.includes("Had a relationship")) {
        coreTraits = coreTraits.filter(trait => !["Balanced", "Versatile", "Unique"].includes(trait));
        coreTraits.push("Romantic");
        coreTraits = coreTraits.slice(0, 3);
      }
  
      try {
        const loadingDiv = createMessageElement(
          `<div class="message-content">
              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
              <p class="text">Zapping... ✨</p>
           </div>`,
          "incoming"
        );
        chatContainer.appendChild(loadingDiv);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
  
        const response = await fetch("/analyze_personality", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(analysisData),
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("Fetch failed");
  
        setTimeout(() => loadingDiv.remove(), 200);
  
        const { personality, mood, insights } = await response.json();
        const typingDisplay = avgTypingSpeed > 0 ? `${avgTypingSpeed} chars/min` : "Chill pace";
  
        const preReportDiv = createMessageElement(
          `<div class="message-content">
              <img src="/static/images/pastel.gif" alt="Chatbot avatar" style="width: 40px; vertical-align: middle; margin-right: 5px;">
              <p class="text">Here is the report after our conversation!</p>
           </div>`,
          "incoming"
        );
        chatContainer.appendChild(preReportDiv);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
        const reportDiv = createMessageElement(
          `<div class="report-content">
              <h2 style="font-size: clamp(1.2rem, 4vw, 1.8em); font-weight: 700; text-align: center; background: linear-gradient(to right, pink, red, blue, indigo, violet); -webkit-background-clip: text; color: transparent; margin: 0 0 20px;">Your Vibe Snapshot</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: clamp(12px, 2vw, 16px); margin-bottom: 20px;">
                  <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: clamp(10px, 2vw, 15px);">
                      <p class="text" style="font-size: clamp(0.9rem, 2.5vw, 1.1em); font-weight: 600; color: #000000; margin-bottom: 8px;">Essence 🌟</p>
                      <p class="text" style="font-size: clamp(0.8rem, 2.5vw, 0.95em); color: #000000;">${personality}</p>
                  </div>
                  <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: clamp(10px, 2vw, 15px);">
                      <p class="text" style="font-size: clamp(0.9rem, 2.5vw, 1.1em); font-weight: 600; color: #000000; margin-bottom: 8px;">Mood ❤️</p>
                      <p class="text" style="font-size: clamp(0.8rem, 2.5vw, 0.95em); color: #000000;">${mood.charAt(0).toUpperCase() + mood.slice(1)} — ${insights.moodDescription}</p>
                      <img src="/static/images/robot.gif" alt="Mood Bot" style="width: clamp(100px, 25vw, 140px); margin-top: 20px;" />
                  </div>
                  <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: clamp(10px, 2vw, 15px);">
                      <p class="text" style="font-size: clamp(0.9rem, 2.5vw, 1.1em); font-weight: 600; color: #000000; margin-bottom: 8px;">Growth 🌱</p>
                      <p class="text" style="font-size: clamp(0.8rem, 2.5vw, 0.95em); color: #000000;">${insights.negativeFeedback.join('<br>')}</p>
                      <img src="/static/images/download.gif" alt="Bot" style="width: clamp(80px, 20vw, 120px); margin: 10px auto;" />
                  </div>
                  <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: clamp(10px, 2vw, 15px);">
                      <p class="text" style="font-size: clamp(0.9rem, 2.5vw, 1.1em); font-weight: 600; color: #000000; margin-bottom: 8px;">Flow ✨</p>
                      <p class="text" style="font-size: clamp(0.8rem, 2.5vw, 0.95em); color: #000000;">
                          Journey: ${insights.flowDetails}<br>
                          Typing Speed: ${typingDisplay}<br>
                          Questions Answered: ${analysisData.questionsAnswered}<br>
                          Questions Explained: ${questionsExplained}<br>
                          Total Time Taken: ${timeDisplay}
                      </p>
                  </div>
                  <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: clamp(10px, 2vw, 15px);">
                      <p class="text" style="font-size: clamp(0.9rem, 2.5vw, 1.1em); font-weight: 600; color: #000000; margin-bottom: 8px;">Your Core Traits 🎭</p>
                      <p class="text" style="font-size: clamp(0.8rem, 2.5vw, 0.95em); color: #000000;">${coreTraits.join(', ')}</p>
                  </div>
                  <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: clamp(10px, 2vw, 15px);">
                      <p class="text" style="font-size: clamp(0.9rem, 2.5vw, 1.1em); font-weight: 600; color: #000000; margin-bottom: 8px;">Stories 🎉</p>
                      <p class="text" style="font-size: clamp(0.8rem, 2.5vw, 0.95em); color: #000000;">${insights.stories}</p>
                  </div>
              </div>
              <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: clamp(10px, 2vw, 15px); text-align: center; display: flex; flex-direction: column; align-items: center;">
  <p class="text" style="font-size: clamp(0.9rem, 2.5vw, 1.1em); font-weight: 600; color: #000000; margin-bottom: 8px;">
    Final Note 💖
  </p>
  <p class="text" style="font-size: clamp(0.8rem, 2.5vw, 0.95em); color: #000000; margin-bottom: 10px;">
    ${insights.note}
  </p>
  <img src="/static/images/load.gif" alt="Bot" style="width: clamp(160px, 40vw, 240px); display: block;" />
</div>
           </div>`,
          "incoming"
        );
  
        chatContainer.appendChild(reportDiv);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
  
        gameQuestionNumber = 0;
        userResponses = [];
        userExplanations = [];
        typingSpeeds = [];
        gameStartTime = null;
        questionStartTimes = [];
        questionEndTimes = [];
        questionDurations = [];
      } catch (error) {
        loadingDiv.remove();
        displayMessage("Vibes got tangled! Retry? 😅", "incoming");
      }
    };
  
    loadDataFromLocalstorage();
  
    (function(){
      if(!window.chatbase || window.chatbase("getState") !== "initialized"){
        window.chatbase = (...arguments) => {
          if(!window.chatbase.q){
            window.chatbase.q = [];
          }
          window.chatbase.q.push(arguments);
        };
        window.chatbase = new Proxy(window.chatbase, {
          get(target, prop){
            if(prop === "q"){
              return target.q;
            }
            return (...args) => target(prop, ...args);
          }
        });
      }
      const onLoad = function(){
        const script = document.createElement("script");
        script.src = "https://www.chatbase.co/embed.min.js";
        script.id = "7xnxwB7mfrnni68JXfFIP";
        script.domain = "www.chatbase.co";
        document.body.appendChild(script);
      };
      if(document.readyState === "complete"){
        onLoad();
      } else {
        window.addEventListener("load", onLoad);
      }
    })();
  });