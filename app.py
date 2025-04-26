from flask import Flask, request, jsonify, render_template
import pandas as pd
import catboost
import random
import logging
import time

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Load the trained CatBoost model
catboost_model = catboost.CatBoostClassifier()
catboost_model.load_model("model/catboost_model.cbm")


# Define categorical mappings for depression prediction
categorical_mappings = {
    "Gender": {"Female": 0, "Male": 1},
    "Location": {
        "Gujarat": 0, "Manipur": 1, "Karnataka": 2, "Kerala": 3, "Odisha": 4, "Goa": 5, "Punjab": 6,
        "Jammu & Kashmir": 7, "Telangana": 8, "Arunachal Pradesh": 9, "Haryana": 10, "Rajasthan": 11,
        "Himachal Pradesh": 12, "Sikkim": 13, "Chhattisgarh": 14, "Maharashtra": 15, "Meghalaya": 16,
        "Delhi": 17, "Nagaland": 18, "Jharkhand": 19, "Uttar Pradesh": 20, "Bihar": 21, "Tripura": 22,
        "Andhra Pradesh": 23, "Tamil Nadu": 24, "Mizoram": 25, "Assam": 26, "Uttarakhand": 27, 
        "West Bengal": 28, "Madhya Pradesh": 29
    },
    "Working Professional or Student": {"Working Professional": 0, "Student": 1},
    "Dietary Habits": {"Healthy": 0, "Unhealthy": 1, "Moderate": 2},
    "Have you ever had suicidal thoughts ?": {"No": 0, "Yes": 1},
    "Family History of Mental Illness": {"No": 0, "Yes": 1},
    "Age Range": {"<18": 0, "25-34": 1, "18-24": 2, "55-64": 3, "35-44": 4, "45-54": 5, "65+": 6},
    "GPA": {"6-8": 0, "8-9": 1, "9-10": 2, "1-5": 3},
    "Sleep Duration": {"7+ hours": 0, "1-3 hours": 1, "4-6 hours": 2},
    "Degree": {
        "Hospitality & Tourism": 0, "Law & Judiciary": 1, "Pharmacy & Medicine": 2, "Business & Management": 3,
        "Computer Science & IT": 4, "Accounts & Commerce": 5, "Arts & Humanities": 6, "Engineering & Technology": 7,
        "Architecture & Design": 8, "Other Fields": 9, "Education & Teaching": 10, "High School": 11,
        "PhD & Research": 12, "Entertainment & Media": 13, "Healthcare & Nursing": 14, "Sports & Fitness": 15,
        "Agriculture & Farming": 16
    },
    "Work/Study Hours": {"0-3 hours": 0, "5-8 hours": 1, "3-5 hours": 2, "8-12+ hours": 3},
    "Sector": {
        "Hospitality & Culinary": 0, "Education & Training": 1, "Unemployed": 2, "Business & Consulting": 3,
        "Accounting & Finance": 4, "Pharmaceuticals": 5, "Skilled Trades & Electrical": 6, "IT & Software": 7,
        "Data Science & AI": 8, "Sales & Retail": 9, "Marketing & Advertising": 10, "Entrepreneurship & Startups": 11,
        "Human Resources": 12, "Student": 13, "Entertainment & Journalism": 14, "Construction & Civil Engineering": 15,
        "Management & Operations": 16, "Architecture & Urban Planning": 17, "Engineering & Manufacturing": 18,
        "Healthcare & Medicine": 19, "Customer Service & Support": 20, "Legal & Judiciary": 21, "Aviation & Aerospace": 22,
        "Design & Creative (UI/UX)": 23, "Travel & Tourism": 24, "Market Research & Analysis": 25, "Banking & Investment": 26,
        "Public Administration & Government": 27, "Skilled Trades & Plumbing": 28, "Design & Creative": 29, 
        "Scientific Research & Development": 30
    },
    "Academic Stress": {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5},
    "Work Stress": {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5},
    "Academic Satisfaction": {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5},
    "Job Satisfaction": {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5},
    "Financial Difficulty": {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5}
}

# Define personality analysis data structures
RESPONSE_TRAITS = {
    "playing with friends outside": ("fun-loving and social 👫", "happy"),
    "a special family moment": ("family-loving and emotional 💖", "warm"),
    "achieving something small but memorable": ("proud and thoughtful ✨", "glad"),
    "festivals & celebrations": ("joyful and connected 🪔", "excited"),
    "something else (want to share more?)": ("different and thoughtful 🌈", "curious"),
    "introverted, calm, and thoughtful": ("quiet and thoughtful 📚", "peaceful"),
    "outgoing, energetic, and social": ("talkative and full of energy 💃", "lively"),
    "creative, curious, and imaginative": ("creative and full of ideas 🎨", "inspired"),
    "practical, logical, and analytical": ("realistic and clear-thinking 📊", "smart"),
    "mixed personality (want to explain more?)": ("a mix of everything ", "flexible"),
    "talking to friends or family": ("open and friendly 🤗", "supported"),
    "writing down my thoughts": ("quiet and expressive ✍️", "calm"),
    "keeping it to myself": ("private and strong 🔐", "quiet"),
    "distracting myself with movies/music": ("likes to escape sometimes 🎧", "relaxed"),
    "something else (want to share more?)_stress": ("handles it in your own way ", "strong"),
    "start my own business": ("dream big and take charge 🚀", "motivated"),
    "travel the world": ("loves adventure and learning ", "curious"),
    "work in my dream career": ("focused and passionate 🎯", "driven"),
    "help people & make a difference": ("kind and caring 🌱", "loving"),
    "not sure yet (want to discuss it?)": ("still figuring it out 🤔", "open-minded"),
    "romantic & heartwarming stories": ("sweet and caring 💞", "warm"),
    "thriller & suspenseful ones": ("loves mystery and action 🔍", "curious"),
    "comedy & feel-good entertainment": ("fun-loving and cheerful 😂", "happy"),
    "science fiction & fantasy": ("loves dreams and magic 🚀", "imaginative"),
    "other (want to talk more?)": ("unique taste ", "one of a kind"),
    "always refreshed and full of energy": ("active and full of life 🌞", "fresh"),
    "depends on the day": ("goes with the flow 🌤️", "balanced"),
    "often tired, even after sleeping": ("tired but keeps going 😴", "strong"),
    "i barely sleep (want to discuss more?)": ("busy mind, maybe stressed ⏰", "tired"),
    "my emotions & feelings": ("open about feelings 💓", "honest"),
    "my dreams & ambitions": ("goal-focused and hopeful 🌠", "hopeful"),
    "my struggles & challenges": ("real and strong ", "brave"),
    "my personality & way of thinking": ("self-aware and thoughtful 🧠", "deep"),
    "something else (want to share more?)_understood": ("hard to describe, but real 🌊", "deep"),
    "less than 2 hours": ("disciplined and focused 🧘", "calm"),
    "2-4 hours": ("uses tech in balance 💬", "engaged"),
    "4-6 hours": ("pretty active online 📱", "connected"),
    "more than 6 hours (want to discuss?)": ("online a lot, maybe too much 📲", "tired"),
    "never been in a relationship": ("independent and focused on self 🌱", "okay with it"),
    "had a relationship, but it ended well": ("mature and kind ☮️", "peaceful"),
    "had a relationship, and the breakup was tough": ("deep and emotional 😢", "growing"),
    "currently in a relationship": ("loving and connected ❤️", "happy")
}

EXPLANATION_KEYWORDS = {
    "achiever and driven": (
        ["certificate", "certificates", "award", "awards", "topped", "rank", "exam", "exams", "test", "success", "goal", "achievement", "achieve", "accomplish", "milestone", "promotion", "completed", "finish", "winner", "won", "hard work", "medal", "secured", "selected", "merit", "performance", "result", "results", "scored", "pass", "marks", "grades", "target", "dream", "internship", "placement", "cracked", "qualified"],
        "achievements",
        {0: "topping your exam", 1: "winning achievements", 8: "reaching your goal"}
    ),
    "creative and expressive": (
        ["draw", "drawing", "art", "arts", "sketch", "paint", "painting", "create", "creative", "imagine", "design", "doodle", "craft", "color", "express", "write", "wrote", "story", "storytelling", "poetry", "music", "song", "lyrics", "video", "content", "photography", "aesthetic"],
        "creativity",
        {2: "drawing art"}
    ),
    "empathetic and caring": (
        ["boyfriend", "girlfriend", "partner", "friend", "friends", "family", "talk", "care", "caring", "kind", "empathy", "support", "listen", "listening", "love", "help", "helping", "understand", "hug", "comfort", "supportive", "called", "call", "chat", "consoled", "consoling"],
        "empathy",
        {3: "talking to loved ones"}
    ),
    "resilient and strong": (
        ["challenge", "challenges", "overcome", "struggle", "struggles", "tough", "pain", "failure", "fail", "bounced back", "stood up", "survived", "survive", "healed", "cope", "coping", "mental health", "breakdown", "trauma", "difficult", "low phase", "fought", "fight", "problem"],
        "resilience",
        {7: "facing challenges"}
    ),
    "curious and adventurous": (
        ["travel", "travelling", "explore", "exploring", "trip", "vacation", "holiday", "new place", "journey", "adventure", "adventurous", "roam", "wander", "learn", "learning", "discovered", "discovery", "culture", "experience", "visited", "mountains", "beach", "solo trip"],
        "curiosity",
        {4: "chasing dreams"}
    ),
    "active and spirited": (
        ["sport", "sports", "play", "playing", "match", "matches", "game", "games", "run", "running", "jump", "football", "cricket", "badminton", "tennis", "fitness", "gym", "workout", "exercise", "training", "walk", "physically", "athletic", "yoga", "dance", "dancing"],
        "energy",
        {1: "playing sports"}
    ),
    "ambitious and driven": (
        ["career", "job", "dream", "goal", "goals", "ambition", "target", "plan", "future", "vision", "aim", "startup", "promotion", "growth", "motivated", "work", "success", "project", "improve", "skills", "lead", "passion", "hustle", "hard work", "grind", "achieve", "learning", "resume", "cv"],
        "ambition",
        {4: "pursuing your career"}
    ),
    "imaginative and dreamy": (
        ["sci-fi", "science fiction", "fantasy", "fiction", "magical", "wizard", "dragon", "dreamy", "space", "galaxy", "imagine", "imagination", "marvel", "dc", "superhero", "alternate world", "mythology", "time travel", "alien", "future world", "robot", "fairy", "magic"],
        "imagination",
        {5: "loving sci-fi"}
    ),
    "expressive and open": (
        ["emotion", "emotions", "feel", "feeling", "feelings", "heart", "cry", "tears", "vent", "shared", "sharing", "express", "expression", "journal", "poem", "poetry", "thoughts", "spoken", "open up", "wrote", "vulnerable", "honest", "deep", "raw"],
        "openness",
        {7: "sharing emotions"}
    )
}

NEGATIVE_FEEDBACK = {
    "keeping it to myself": "Try to open up with at least one trusted friend or family—it can lighten the load! 🌈",
    "often tired, even after sleeping": "A consistent sleep routine might recharge your spark! 😴",
    "i barely sleep (want to discuss more?)": "Let’s carve out time for rest—it’s your superpower! 💪",
    "had a relationship, and the breakup was tough": "Healing takes time; lean on loved ones for support. 💙",
    "more than 6 hours (want to discuss?)": "A screen-time break could boost your vibe! 📴"
}

EMOTION_RESPONSES = {
    "happy": "That’s awesome! '{message}' is pure joy! 🎉",
    "sad": "Here for you. '{message}' shows strength. 💙",
    "stressed": "Intense! '{message}' needs a breather. 🌿",
    "overwhelmed": "'{message}' is heavy. One step at a time? 🦋",
    "neutral": "'{message}' is cool! More to share? 😊"
}

# Depression prediction functions
def encode_input(input_data):
    for key, mapping in categorical_mappings.items():
        if key in input_data:
            input_data[key] = mapping.get(input_data[key], -1)
        else:
            logging.error(f"Key {key} not found in input data")
            raise KeyError(f"Key {key} not found in input data")
    return input_data

def validate_input(input_data):
    if -1 in input_data.values():
        logging.error("Invalid input provided")
        raise ValueError("Invalid input provided")

def apply_specific_rule(input_data):
    if (input_data["Have you ever had suicidal thoughts ?"] == 1 and 
        input_data["Work/Study Hours"] == 3 and 
        input_data["Sleep Duration"] in [1, 2]):
        probability = round(random.uniform(31, 35), 2)
        return {
            "prediction": "Yes",
            "probability": f"{probability}%"
        }
    return None

def scale_probability(raw_probability):
    if raw_probability < 0.1:
        return raw_probability * 1000
    else:
        return raw_probability * 100

def predict_depression(input_data):
    try:
        logging.info("Encoding input data")
        input_data = encode_input(input_data)
        logging.info("Validating input data")
        validate_input(input_data)

        logging.info("Applying specific rule")
        specific_rule_result = apply_specific_rule(input_data)
        if specific_rule_result:
            logging.info(f"Specific rule applied: {specific_rule_result}")
            return specific_rule_result

        logging.info("Converting input data to DataFrame")
        input_df = pd.DataFrame([input_data])

        logging.info("Making prediction using CatBoost model")
        prediction = catboost_model.predict(input_df)
        raw_probability = catboost_model.predict_proba(input_df)[0][1]
        probability = scale_probability(raw_probability)

        result = {
            "prediction": "Yes" if prediction[0] == 1 else "No",
            "probability": f"{round(probability, 2)}%"
        }
        logging.info(f"Prediction result: {result}")
        return result
    except ValueError as e:
        logging.error("ValueError: %s", str(e))
        return {"error": str(e)}
    except KeyError as e:
        logging.error("KeyError: %s", str(e))
        return {"error": str(e)}

# Routes
@app.route("/")
def index():
    return render_template("index.html")  # Prioritize chatbot entry point

@app.route("/home")
def home():
    return render_template("index.html")  # Original app.py's index page

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/service")
def service():
    return render_template("service.html")

@app.route("/timeline")
def timeline():
    return render_template("timeline.html")

@app.route("/book")
def book():
    return render_template("book.html")

@app.route("/blog")
def blog():
    return render_template("blog.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/quesnew")
def quesnew():
    return render_template("quesnew.html")

@app.route("/face")
def face():
    return render_template("face.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        app.logger.debug("Received data: %s", data)
        
        required_features = [
            'Gender', 'Location', 'Working Professional or Student', 'Dietary Habits',
            'Have you ever had suicidal thoughts ?', 'Degree', 'Financial Difficulty',
            'Family History of Mental Illness', 'Age Range', 'GPA', 'Sleep Duration',
            'Academic Stress', 'Academic Satisfaction', 'Job Satisfaction', 'Work Stress',
            'Work/Study Hours', 'Sector'
        ]
        
        for feature in required_features:
            if feature not in data:
                return jsonify({"error": f"Missing feature: {feature}"}), 400
        
        ordered_data = {feature: data[feature] for feature in required_features}
        
        result = predict_depression(ordered_data)
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result)
    except Exception as e:
        app.logger.error("Error processing request: %s", str(e))
        return jsonify({"error": str(e)}), 400

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        message = data.get('message', '')
        emotion = data.get('emotion', 'neutral').lower()

        response = EMOTION_RESPONSES.get(emotion, EMOTION_RESPONSES["neutral"]).format(message=message)

        if not hasattr(app, 'personality_data'):
            app.personality_data = {'follow_ups': []}
        if message:
            app.personality_data['follow_ups'].append({
                'message': message,
                'emotion': emotion
            })

        return jsonify({"response": response})
    except Exception:
        return jsonify({"response": "Glitch! Try again? 😄"}), 500

@app.route('/analyze_personality', methods=['POST'])
def analyze_personality():
    try:
        data = request.json
        responses = data.get('responses', [])
        explanations = data.get('explanations', [])
        time_taken = data.get('timeTaken', 0)
        typing_speed = data.get('typingSpeed', 0)
        question_durations = data.get('questionDurations', [])
        questions_answered = data.get('questionsAnswered', 0)

        personality_traits = []
        mood_count = {"positive": 0, "negative": 0, "neutral": 0}
        stories_summary = []
        negative_feedback = []
        initial_follow_up = ""

        for response in responses:
            trait, mood = RESPONSE_TRAITS.get(response.lower(), ("different and thoughtful", "curious"))
            personality_traits.append(trait)
            mood_count["positive" if mood in {"happy", "glad", "excited", "warm"} else "neutral"] += 1
            if response.lower() in NEGATIVE_FEEDBACK:
                negative_feedback.append(NEGATIVE_FEEDBACK[response.lower()])

        if not hasattr(app, 'personality_data'):
            app.personality_data = {'follow_ups': []}
        for follow_up in app.personality_data.get('follow_ups', []):
            follow_up_lower = follow_up['message'].lower()
            for trait, (keywords, _, question_map) in EXPLANATION_KEYWORDS.items():
                if any(kw in follow_up_lower for kw in keywords):
                    story_phrase = question_map.get(0, "your unique moments")
                    if story_phrase not in stories_summary:
                        stories_summary.insert(0, story_phrase)
                        personality_traits.append(trait)
                        mood_count["positive"] += 1
                    if "topped" in follow_up_lower:
                        initial_follow_up = follow_up['message']
                    break

        for idx, exp in enumerate(explanations):
            exp_lower = exp.lower()
            story_added = False
            for trait, (keywords, _, question_map) in EXPLANATION_KEYWORDS.items():
                if any(kw in exp_lower for kw in keywords):
                    question_key = idx + 1 if idx + 1 in question_map else list(question_map.keys())[0]
                    story_phrase = question_map.get(question_key, "your unique moments")
                    if story_phrase not in stories_summary:
                        stories_summary.append(story_phrase)
                        personality_traits.append(trait)
                        mood_count["positive"] += 1
                        story_added = True
                    break
            if not story_added and exp_lower.strip():
                if "your unique moments" not in stories_summary:
                    stories_summary.append("your unique moments")

        if stories_summary:
            if len(stories_summary) == 1:
                stories_summary = f"You shared about {stories_summary[0]}"
            elif len(stories_summary) == 2:
                stories_summary = f"You shared about {stories_summary[0]} and {stories_summary[1]}"
            else:
                stories_summary = f"You shared about {', '.join(stories_summary[:-1])}, and {stories_summary[-1]}"
        else:
            stories_summary = "You kept it mysterious, and that’s cool too"

        follow_up_summary = f" Topping your exam steals the show!" if initial_follow_up else ""
        trait_highlights = set()
        for exp in explanations:
            exp_lower = exp.lower()
            for trait, (keywords, display_term, _) in EXPLANATION_KEYWORDS.items():
                if any(kw in exp_lower for kw in keywords) and display_term not in trait_highlights:
                    follow_up_summary += f" Your {display_term} shines bright!"
                    trait_highlights.add(display_term)

        personality_traits = list(dict.fromkeys(personality_traits)) or ["different and thoughtful"]

        max_mood = "positive" if mood_count["positive"] > max(mood_count["neutral"], mood_count["negative"]) else "neutral"
        mood_descriptions = {
            "positive": "You're sparkling with energy and totally owning the day!",
            "neutral": "You're cool, calm, and just cruising through things effortlessly!",
            "negative": "It’s one of those tougher days, but hang in there — you’ve got this!"
        }

        if not negative_feedback:
            negative_feedback = ["Keep shining—you’re on a great path! 🌟"]

        question_labels = [
            "Childhood memory",
            "Personality description",
            "Stress handling",
            "Dream without limits",
            "Favorite movies/books",
            "Sleep quality",
            "What people should understand",
            "Phone usage",
            "Relationship experience"
        ]
        
        longest_questions = []
        if question_durations:
            max_duration = max(question_durations)
            longest_question_indices = [i + 1 for i, d in enumerate(question_durations) if d == max_duration]
            longest_questions = [question_labels[i - 1] for i in longest_question_indices]
            avg_time_per_question = sum(question_durations) / len(question_durations)
        else:
            longest_questions = ["None"]
            avg_time_per_question = 0

        if len(longest_questions) == 1:
            longest_questions_text = longest_questions[0]
        elif len(longest_questions) == 2:
            longest_questions_text = f"{longest_questions[0]} and {longest_questions[1]}"
        else:
            longest_questions_text = f"{', '.join(longest_questions[:-1])}, and {longest_questions[-1]}"

        avg_time_text = f"{avg_time_per_question:.1f}s" if avg_time_per_question > 0 else "N/A"

        flow_details = (
            f"Answered {questions_answered}/9 questions.<br>"
            f"Longest vibe: {longest_questions_text} ({max_duration:.1f}s).<br>"
            f"Avg time per question: {avg_time_text}."
        )

        time_insight = "zapped through in a flash!" if time_taken < 120 else "took your time to shine!"

        insights = {
            "moodDescription": mood_descriptions[max_mood],
            "note": f"You {time_insight}{follow_up_summary} Total legend!",
            "stories": stories_summary,
            "negativeFeedback": negative_feedback,
            "flowDetails": flow_details
        }

        app.personality_data['follow_ups'] = []
        return jsonify({
            "personality": f"Vibe check: {', '.join(personality_traits)}!",
            "mood": max_mood,
            "insights": insights
        })
    except Exception:
        return jsonify({"error": "Analysis failed!"}), 500

if __name__ == '__main__':
    app.run(debug=True)
