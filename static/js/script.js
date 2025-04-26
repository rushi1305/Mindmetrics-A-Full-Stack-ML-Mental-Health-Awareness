$(document).ready(function() {
  try {
    console.log("Script loaded and document ready");
    var current_fs, next_fs, previous_fs;
    var opacity;
    var current = 1;
    var steps = $("fieldset").length;

    function validateStep(currentFieldset) {
      let isValid = true;
      let firstInvalidField = null;

      console.log("Validating fieldset:", currentFieldset);
      $(currentFieldset).find('input[required], select[required]').each(function() {
        if ($(this).val() === '' || $(this).val() === null) {
          isValid = false;
          $(this).addClass('error');
          console.log("Invalid field:", $(this).attr('name'));
          if (!firstInvalidField) {
            firstInvalidField = this;
          }
        } else {
          $(this).removeClass('error');
        }
      });

      if (!isValid && firstInvalidField) {
        console.log("Scrolling to first invalid field:", firstInvalidField);
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      console.log("Validation result:", isValid);
      return isValid;
    }

    setProgressBar(current);

    const stepTitles = {
      1: "💜 Hey There! 💙",
      2: "Let's get to know you better! 💖",
      3: "Tell us about your awesome lifestyle 🍁",
      4: "How are you feeling? Let's talk about stress 🌼",
      5: "Almost there! You're doing great! 🎉"
    };
    const stepDescriptions = {
      1: "Time for a little self-care check-in! ✨ This fun and friendly test will help you reflect on how you're feeling.💖",
      2: "Tell us a bit about yourself, we’re here to listen! 🌼",
      3: "Share a few details about how you live your life. We want to know all the good stuff! ✨",
      4: "Stress happens to everyone, and we’re here to understand it better together 🌈.",
      5: "Yay! You’ve made it to the end 🌙."
    };
    const updateStepText = (step) => {
      document.getElementById('step-title').innerText = stepTitles[step];
      document.getElementById('step-description').innerText = stepDescriptions[step];
    };

    $(".next").click(function() {
      current_fs = $(this).parent();
      next_fs = $(this).parent().next();

      if (!validateStep(current_fs)) {
        alert('Please fill out all required fields before proceeding.');
        return;
      }

      $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
      next_fs.show();
      current_fs.animate({opacity: 0}, {
        step: function(now) {
          opacity = 1 - now;
          current_fs.css({'display': 'none', 'position': 'relative'});
          next_fs.css({'opacity': opacity});
        },
        duration: 500
      });
      setProgressBar(++current);
      updateStepText(current);
    });

    $(".previous").click(function() {
      current_fs = $(this).parent();
      previous_fs = (current === steps) ? $("fieldset").first() : $(this).parent().prev();
      $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");
      previous_fs.show();
      current_fs.animate({opacity: 0}, {
        step: function(now) {
          opacity = 1 - now;
          current_fs.css({'display': 'none', 'position': 'relative'});
          previous_fs.css({'opacity': opacity});
        },
        duration: 500
      });
      setProgressBar(--current);
      updateStepText(current);
    });

    function setProgressBar(curStep) {
      var percent = (100 / steps) * curStep;
      $(".progress-bar").css("width", percent.toFixed() + "%");
    }

    $(".submit").click(function() {
      return false;
    });

    // Star background animation
    var stars = 800;
    var $stars = $(".stars");
    var r = 800;
    for (var i = 0; i < stars; i++) {
      $stars.append($("<div/>").addClass("star"));
    }
    $(".star").each(function() {
      var cur = $(this);
      var s = 0.2 + (Math.random() * 1);
      var curR = r + (Math.random() * 300);
      cur.css({ 
        transformOrigin: "0 0 " + curR + "px",
        transform: "translate3d(0,0,-" + curR + "px) rotateY(" + (Math.random() * 360) + "deg) rotateX(" + (Math.random() * -50) + "deg) scale(" + s + "," + s + ")"
      });
    });

    document.getElementById("submitBtn").addEventListener("click", function() {
      console.log("Submit button clicked!");
      if (!validateStep($('fieldset').last())) {
        console.log("Validation failed");
        alert('🔴 Please fill out all required fields 🔴');
        return;
      }
      console.log("Validation passed, showing overlay");
      document.querySelector(".glass-box").style.display = "none";
      document.getElementById("overlayBox").style.display = "block";

      const facts = [
        "Your brain can shrink from depression—but it can grow back with care! 🧠✨",
        "Dolphins get depressed and can even refuse to eat! 🐬😢",
        "Laughing for 10 minutes can ease depression symptoms! 😂👍",
        "The shortest war in history lasted 38 minutes—depression can feel longer! ⏰⚡",
        "Blue light from screens can mess with your mood—dim it! 📱🌙",
        "Petting a dog boosts your happy hormones by 300%! 🐾❤️",
        "Depression can make you forget where you parked—literally! 🚗🤔",
        "Chocolate can lift your mood faster than you can eat it! 🍫😋",
        "Crying releases stress toxins—tears are tiny superheroes! 😭🦸‍♂️",
        "Hugging someone for 20 seconds fights depression! 🤗⏳"
      ];

      document.getElementById("factText").textContent = facts[Math.floor(Math.random() * facts.length)];
      const loadingGif = document.createElement("img");
      loadingGif.src = "/static/images/loading.gif"; 
      loadingGif.alt = "Loading";
      loadingGif.className = "loading-gif";
  loadingGif.style.width = "120px";         // increased size
  loadingGif.style.display = "block";       // forces it onto a new line
  loadingGif.style.margin = "10px auto";    // adds spacing + centers it
      document.getElementById("overlayBox").appendChild(loadingGif);
      setTimeout(function() {
        console.log("Starting AJAX call");
        document.getElementById("overlayBox").style.display = "none";

        const formData = {
          "Gender": $("[name='Gender']").val(),
          "Location": $("[name='Location']").val(),
          "Working Professional or Student": $("[name='Working Professional or Student']").val(),
          "Dietary Habits": $("[name='Dietary Habits']").val(),
          "Have you ever had suicidal thoughts ?": $("[name='Have you ever had suicidal thoughts ?']").val(),
          "Degree": $("[name='Degree']").val(),
          "Financial Difficulty": $("[name='Financial Difficulty']").val(),
          "Family History of Mental Illness": $("[name='Family History of Mental Illness']").val(),
          "Age Range": $("[name='Age Range']").val(),
          "GPA": $("[name='GPA']").val(),
          "Sleep Duration": $("[name='Sleep Duration']").val(),
          "Academic Stress": $("[name='Academic Stress']").val(),
          "Academic Satisfaction": $("[name='Academic Satisfaction']").val(),
          "Job Satisfaction": $("[name='Job Satisfaction']").val(),
          "Work Stress": $("[name='Work Stress']").val(),
          "Work/Study Hours": $("[name='Work/Study Hours']").val(),
          "Sector": $("[name='Sector']").val()
        };

        $.ajax({
          type: "POST",
          url: "/predict",
          contentType: "application/json",
          data: JSON.stringify(formData),
          success: function(response) {
            console.log("AJAX success:", response);
            const fname = $("[name='fname']").val() || "there";
            const resultText = `
              <div style="text-align: center; font-family: 'playball', sans-serif; line-height: 1.4;">
                <span style="font-size: 24px; color:rgb(128, 10, 128);">
                  Hey ${fname}, Mindmetrics has analyzed your inputs and here’s what we found:
                </span>
                <br>
                <strong style="font-size: 27px; color: ${response.prediction === 'Yes' ? '#ff6666' : '#66cc66'};">
                  ${response.prediction === 'Yes' ? 'You might be feeling some signs of depression 💙' : 'You’re likely not showing signs of depression! ✨'}
                </strong>
                <br>
                <span style="font-size: 22px; color: #555;">
                  There’s a ${response.probability} chance based on your answers.
                </span>
              </div>
            `;
            document.getElementById("resultText").innerHTML = resultText;

            const tipsBox = document.getElementById("tipsBox");
            if (response.prediction === "Yes") {
              tipsBox.className = "depressed";
              tipsBox.innerHTML = `
                <h4 style="color: #ff6666; text-align: center;">You Might Need Some Support 💙</h4>
                <ul style="list-style-type: none; padding-left: 0; text-align: left;">
                  <li style="display: flex;"> <span style="margin-left: 60px;">🌿 Talk to Someone – Share your feelings with a friend or therapist.</span></li>
                  <li style="display: flex;"> <span style="margin-left: 60px;">🏃 Move a Little – Even a short walk can boost your mood.</span></li>
                  <li style="display: flex;"> <span style="margin-left: 60px;">😴 Sleep Well – Aim for 7-8 hours to recharge your mind.</span></li>
                  <li style="display: flex;"> <span style="margin-left: 60px;">🍎 Eat Healthy – Nutritious food can lift your spirits.</span></li>
                  <li style="display: flex;"> <span style="margin-left: 60px;">🧘 Relax – Try deep breathing or meditation for calm.</span></li>
                  <li style="display: flex;"> <span style="margin-left: 60px;">📞 Seek Help – Contact a helpline if you feel overwhelmed.</span></li>
                </ul>
              `;
            } else {
              tipsBox.className = "not-depressed";
              tipsBox.innerHTML = `
                <h4 style="color: #66cc66; text-align: center;">Keep Up the Good Vibes! 😊</h4>
                <ul style="list-style-type: none; padding-left: 0; text-align: left;">
                  <li style="display: flex;"><span>🌞</span> <span style="margin-left: 60px;">Stay Active – Keep exercising to maintain energy.</span></li>
                  <li style="display: flex;"><span>🥗</span> <span style="margin-left: 60px;">Balanced Diet – Eat well to fuel your happiness.</span></li>
                  <li style="display: flex;"><span>💤</span> <span style="margin-left: 60px;">Rest Up – Good sleep keeps you sharp.</span></li>
                  <li style="display: flex;"><span>🤗</span> <span style="margin-left: 60px;">Connect – Spend time with loved ones.</span></li>
                  <li style="display: flex;"><span>🎨</span> <span style="margin-left: 60px;">Enjoy Hobbies – Do what makes you smile.</span></li>
                </ul>
              `;
            }

            const improvementBox = document.getElementById("improvementBox");
            let improvements = [];
            if (formData["Dietary Habits"] === "Unhealthy") improvements.push("🍔 Your diet is unhealthy—try adding more fruits and veggies!");
if (formData["Academic Stress"] >= "4" || formData["Work Stress"] >= "4") improvements.push("😰 High stress levels—consider relaxation techniques like deep breathing or yoga.");
if (formData["GPA"] === "1-5") improvements.push("📚 Low GPA—seek study support or tutoring to boost your confidence!");
if (formData["Sleep Duration"] === "1-3 hours") improvements.push("💤 Very little sleep—aim for at least 6 hours to recharge your mind.");
if (formData["Work/Study Hours"] === "8-12+ hours") improvements.push("⏰ Long hours—balance work/study with short breaks to stay fresh.");
if (formData["Have you ever had suicidal thoughts ?"] === "Yes") improvements.push("🧠 Suicidal thoughts—please talk to someone you trust or a professional.");
if (["Delhi", "Maharashtra", "Telangana", "Tamil Nadu", "West Bengal", "Karnataka"].includes(formData["Location"])) improvements.push("🏙️ Living in a bustling metro area—take time to care for yourself and unwind!");
if (formData["Family History of Mental Illness"] === "Yes") improvements.push("🩺 Family history of mental illness—consider consulting a doctor for personalized guidance.");
if (["IT & Software", "Healthcare & Medicine", "Banking & Investment", "Data Science & AI"].includes(formData["Sector"])) improvements.push("💼 Working in a high-pressure sector—don’t take stress personally, stay cool and prioritize self-care!");
if (["Engineering & Technology", "Pharmacy & Medicine", "Law & Judiciary"].includes(formData["Degree"])) improvements.push("🎓 Challenging degree like Engineering—focus on learning and growth, not stress!");
            improvementBox.innerHTML = `
              <h4 style="color: #666; text-align: center;">Areas to Focus On:</h4>
              ${improvements.length > 0 ? `<ul style="list-style-type: none; padding-left: 0; text-align: left;">${improvements.map(i => `<li>${i}</li>`).join('')}</ul>` : '<p style="text-align: left;">Everything looks good—keep it up!</p>'}
            `;

            console.log("Showing resultBox");
            document.getElementById("resultBox").style.display = "flex";
          },
          error: function(xhr, status, error) {
            console.error("AJAX error:", status, error, xhr.responseText);
            document.getElementById("resultText").innerHTML = "Oops! Something went wrong. Please try again. 😔";
            console.log("Showing resultBox on error");
            document.getElementById("resultBox").style.display = "flex";
          }
        });
      }, 4000);
    });

  } catch (error) {
    console.error("Error in document.ready:", error);
  }
});