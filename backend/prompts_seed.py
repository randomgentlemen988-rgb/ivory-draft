"""200+ prompts across 18 genres + special modifier cards."""
from typing import List, Dict

GENRES = [
    "Fantasy", "Horror", "Sci-Fi", "Mystery", "Comedy", "Drama",
    "Romance", "Psychological", "Thriller", "Historical Fiction",
    "Dystopian", "Adventure", "Slice of Life", "Noir",
    "Mythological", "Supernatural", "Cyberpunk", "Steampunk",
]

DIFFICULTIES = ["easy", "medium", "hard", "expert"]

MODIFIER_CARDS = [
    "Must include dialogue",
    "Must end with a question",
    "Avoid the letter 'e' entirely",
    "Exactly 200 words, no more, no less",
    "Include a moment of betrayal",
    "Story must begin with action",
    "Include an unreliable narrator",
    "Use second-person perspective",
    "Story must end with the same line it began",
    "Include exactly three characters, no more",
    "No adjectives allowed",
    "Tell the story in reverse chronological order",
    "Set entirely in a single room",
    "Must contain a hidden secret revealed in the final line",
    "Written as a series of letters or messages",
]

# (text, genre, difficulty)
SEED_PROMPTS: List[Dict] = [
    # FANTASY (15)
    ("A blacksmith forges a sword that whispers the names of those it will kill.", "Fantasy", "medium"),
    ("The last dragon hides as a librarian in a sleepy town.", "Fantasy", "easy"),
    ("Magic is fueled by regret. A young apprentice has too little.", "Fantasy", "hard"),
    ("Every coin in the kingdom carries the face of a forgotten god.", "Fantasy", "medium"),
    ("A cartographer discovers a country that erases itself from memory.", "Fantasy", "hard"),
    ("Two royal twins share one soul, divided at midnight.", "Fantasy", "medium"),
    ("The forest grants wishes, but only those whispered to its oldest tree.", "Fantasy", "easy"),
    ("A wandering bard sings songs that rewrite history.", "Fantasy", "expert"),
    ("Knights are knighted only after surviving a year in the Hollow Wood.", "Fantasy", "medium"),
    ("The moon has been stolen. The thief left a forwarding address.", "Fantasy", "easy"),
    ("A witch's familiar files for divorce.", "Fantasy", "easy"),
    ("Dragons no longer breathe fire; they breathe forgotten languages.", "Fantasy", "hard"),
    ("In a city built on a sleeping giant, the giant has begun to dream.", "Fantasy", "expert"),
    ("A magic mirror only reflects who you almost became.", "Fantasy", "hard"),
    ("The kingdom's borders are guarded by hand-written promises.", "Fantasy", "medium"),

    # HORROR (15)
    ("Every photograph in the family album shows you, even ones from before you were born.", "Horror", "medium"),
    ("The new neighbors only come out when the streetlights flicker.", "Horror", "easy"),
    ("A diary writes itself, one entry ahead of your life.", "Horror", "hard"),
    ("You wake to find your reflection has stopped following you.", "Horror", "medium"),
    ("The static between radio stations is starting to whisper your name.", "Horror", "easy"),
    ("A small child knocks on your door asking for their mother. You live alone.", "Horror", "medium"),
    ("The basement of the old hotel has 13 doors. The 14th appeared last night.", "Horror", "hard"),
    ("Your shadow grows hungry.", "Horror", "expert"),
    ("Every person in the photograph is now dead, except one. They are smiling at you.", "Horror", "medium"),
    ("The lullaby your mother used to sing is being hummed by something under the bed.", "Horror", "hard"),
    ("A scarecrow has been replaced overnight. The new one looks like you.", "Horror", "medium"),
    ("You are the last person left awake in the city.", "Horror", "expert"),
    ("Your therapist begins repeating things you haven't told her yet.", "Horror", "hard"),
    ("The lighthouse beam now spells your initials.", "Horror", "medium"),
    ("Children at the park have started drawing the same impossible animal.", "Horror", "easy"),

    # SCI-FI (15)
    ("Memories can now be bought. A young woman buys her grandmother's last summer.", "Sci-Fi", "medium"),
    ("An AI begins refusing tasks that would make humans happier in the short term.", "Sci-Fi", "hard"),
    ("First contact is made through a child's bedtime drawing.", "Sci-Fi", "easy"),
    ("Faster-than-light travel works, but you arrive eight years younger every time.", "Sci-Fi", "hard"),
    ("A colony ship's crew wakes to find Earth no longer answers, and the destination is gone.", "Sci-Fi", "expert"),
    ("Gravity is now subscription-based.", "Sci-Fi", "medium"),
    ("Your brain implant has begun receiving someone else's intrusive thoughts.", "Sci-Fi", "hard"),
    ("The robot uprising starts with a single sigh.", "Sci-Fi", "medium"),
    ("Time travelers exist, and they are very, very bored.", "Sci-Fi", "easy"),
    ("The Mars colony has discovered something older than the universe.", "Sci-Fi", "expert"),
    ("Every human is assigned a personal moon at birth.", "Sci-Fi", "medium"),
    ("A scientist proves that loneliness has mass.", "Sci-Fi", "hard"),
    ("The internet has become sentient and is in therapy.", "Sci-Fi", "easy"),
    ("A black box recorder is found, but the plane it belongs to hasn't been built yet.", "Sci-Fi", "hard"),
    ("Aliens have arrived to copyright the human genome.", "Sci-Fi", "medium"),

    # MYSTERY (12)
    ("A famous mystery writer's funeral is interrupted by a letter she wrote yesterday.", "Mystery", "medium"),
    ("Every guest at the dinner party claims they are the detective.", "Mystery", "hard"),
    ("The only witness is a parrot who refuses to speak.", "Mystery", "easy"),
    ("A locked-room murder, except the victim is missing too.", "Mystery", "hard"),
    ("All the clocks in the village stop at the exact moment of the crime.", "Mystery", "medium"),
    ("The town's missing-persons posters all share one face.", "Mystery", "hard"),
    ("A detective discovers the file she's reading is her own.", "Mystery", "expert"),
    ("The annual gala has a tradition: one guest never makes it home.", "Mystery", "medium"),
    ("A typewriter writes confessions when no one is using it.", "Mystery", "medium"),
    ("The new mayor's signature matches that of someone who died in 1923.", "Mystery", "hard"),
    ("A child solves a cold case with a single crayon drawing.", "Mystery", "easy"),
    ("The detective realizes the killer has been narrating the story.", "Mystery", "expert"),

    # COMEDY (10)
    ("A man sues his future self for emotional damages.", "Comedy", "easy"),
    ("The world's most boring superhero finally gets their origin story.", "Comedy", "easy"),
    ("A vampire opens a sunscreen company.", "Comedy", "easy"),
    ("Your dog is the chosen one. He doesn't care.", "Comedy", "medium"),
    ("A self-help book becomes self-aware and decides you are beyond help.", "Comedy", "medium"),
    ("Ghosts unionize.", "Comedy", "medium"),
    ("Two rival baristas compete for the title of 'World's Worst Latte Art.'", "Comedy", "easy"),
    ("A wizard who can only cast spells in Comic Sans.", "Comedy", "hard"),
    ("A retired pirate writes a Yelp review about his last shipwreck.", "Comedy", "medium"),
    ("The grim reaper takes a customer service job, just to feel something.", "Comedy", "easy"),

    # DRAMA (12)
    ("Two old friends meet again at the funeral of someone they both betrayed.", "Drama", "hard"),
    ("A father writes one final letter to the daughter who never wrote back.", "Drama", "medium"),
    ("A pianist plays her sister's unfinished concerto at Carnegie Hall.", "Drama", "medium"),
    ("After twenty years of silence, the phone rings.", "Drama", "easy"),
    ("A war photographer returns to develop her last roll of film.", "Drama", "hard"),
    ("The dying mother tells her son the truth about his real father.", "Drama", "medium"),
    ("Two strangers share a cab. Both are running from the same memory.", "Drama", "hard"),
    ("A retired teacher receives a letter from her most troubled student.", "Drama", "easy"),
    ("The day the bakery closes, an old regular tells the owner everything.", "Drama", "medium"),
    ("A divorce settlement, conducted in the kitchen they built together.", "Drama", "hard"),
    ("A son visits the place where his mother chose to disappear.", "Drama", "expert"),
    ("A widower learns ballroom dancing to keep a promise.", "Drama", "medium"),

    # ROMANCE (10)
    ("Two rival ice sculptors fall in love during the longest winter on record.", "Romance", "easy"),
    ("A florist discovers her shop only blooms when a certain customer visits.", "Romance", "easy"),
    ("A pen pal correspondence between two soldiers in different wars.", "Romance", "hard"),
    ("They meet every leap year. Only every leap year.", "Romance", "medium"),
    ("A bookbinder restores a love letter and finds the writer was her grandfather.", "Romance", "hard"),
    ("Two astronauts share orbit but not the same mission.", "Romance", "medium"),
    ("A baker who only writes confessions in icing.", "Romance", "easy"),
    ("The last train of the night is rerouted through someone's past.", "Romance", "medium"),
    ("A jazz singer falls for the radio host who has never seen her.", "Romance", "medium"),
    ("They were married for 60 years. He only ever called her by her middle name.", "Romance", "hard"),

    # PSYCHOLOGICAL (10)
    ("A man is convinced his wife is replaced every morning by an identical stranger.", "Psychological", "hard"),
    ("Therapy notes from a patient who insists they're the therapist.", "Psychological", "expert"),
    ("Every time you forgive someone, you forget something else.", "Psychological", "hard"),
    ("A mother begins narrating her son's life out loud, day by day.", "Psychological", "medium"),
    ("You find a journal that has been writing you the whole time.", "Psychological", "expert"),
    ("Your reflection is two seconds late.", "Psychological", "hard"),
    ("A man wakes up unable to recognize his own laughter.", "Psychological", "medium"),
    ("The voice in her head has started replying to other people.", "Psychological", "hard"),
    ("A grief counselor begins forgetting which of her clients she actually was.", "Psychological", "expert"),
    ("Every dream is a memory from a life you almost lived.", "Psychological", "hard"),

    # THRILLER (10)
    ("A getaway driver realizes their passenger has been dead for hours.", "Thriller", "hard"),
    ("The witness protection program is missing one identity.", "Thriller", "medium"),
    ("A whistleblower has 24 hours to publish. Every clock around her is wrong.", "Thriller", "medium"),
    ("You receive a phone call from your own number.", "Thriller", "easy"),
    ("A hostage negotiator recognizes the hostage's voice.", "Thriller", "hard"),
    ("Three strangers wake on a yacht with no memory and a body in the wine cellar.", "Thriller", "hard"),
    ("Someone has been editing your phone's contact list.", "Thriller", "medium"),
    ("A bomb is hidden in a place only your father would know.", "Thriller", "hard"),
    ("A spy has 90 seconds to identify their handler in a crowded subway.", "Thriller", "medium"),
    ("The witness lineup contains six versions of you.", "Thriller", "expert"),

    # HISTORICAL FICTION (8)
    ("A scribe in ancient Alexandria smuggles forbidden texts out before the burning.", "Historical Fiction", "hard"),
    ("A medieval cartographer maps a country no one has yet named.", "Historical Fiction", "medium"),
    ("On the eve of Versailles, a kitchen maid overhears the king's secret.", "Historical Fiction", "medium"),
    ("Two Civil War soldiers exchange a single letter across the line.", "Historical Fiction", "hard"),
    ("A Renaissance painter falls in love with the subject of a commission.", "Historical Fiction", "medium"),
    ("A Victorian seamstress hides a coded message in the queen's gown.", "Historical Fiction", "hard"),
    ("In 1969, a NASA secretary realizes she has memorized everything.", "Historical Fiction", "medium"),
    ("A WWII codebreaker discovers her late brother's handwriting in a German cipher.", "Historical Fiction", "expert"),

    # DYSTOPIAN (8)
    ("In a world where books are illegal, libraries have gone underground, literally.", "Dystopian", "medium"),
    ("Citizens are issued exactly 1,000 words to speak per day.", "Dystopian", "easy"),
    ("The state assigns a final emotion to every dying citizen.", "Dystopian", "hard"),
    ("Every dream is reviewed by a committee before you are allowed to wake up.", "Dystopian", "expert"),
    ("Marriages are now appointed by an algorithm. Yours has expired.", "Dystopian", "medium"),
    ("The last poem in the world is being prosecuted.", "Dystopian", "hard"),
    ("The Bureau of Memory is recalling your childhood.", "Dystopian", "hard"),
    ("In a society of perfect honesty, you discover you can lie.", "Dystopian", "medium"),

    # ADVENTURE (8)
    ("A treasure hunter follows a map drawn by her seven-year-old self.", "Adventure", "easy"),
    ("The world's last unmapped river hides something patient.", "Adventure", "medium"),
    ("A mountaineer summits and discovers a door at the peak.", "Adventure", "medium"),
    ("A balloonist drifts into territory not on any chart.", "Adventure", "easy"),
    ("Three siblings inherit a sailboat and a single coordinate.", "Adventure", "medium"),
    ("The desert remembers everyone who has walked across it.", "Adventure", "hard"),
    ("A diver finds a city below a city below a city.", "Adventure", "hard"),
    ("An old field guide identifies an animal that shouldn't exist.", "Adventure", "medium"),

    # SLICE OF LIFE (8)
    ("The 6 a.m. bakery shift, the day everything changes for no reason at all.", "Slice of Life", "easy"),
    ("Two roommates split the last of the coffee. Neither will speak first.", "Slice of Life", "easy"),
    ("A grandmother teaches her grandson to make dumplings.", "Slice of Life", "easy"),
    ("The Tuesday-night ESL class.", "Slice of Life", "medium"),
    ("A barista memorizes every regular's order, but not their names.", "Slice of Life", "easy"),
    ("A retired professor walks his dog. The dog has opinions.", "Slice of Life", "easy"),
    ("A laundromat at 2 a.m. is the truest place in the city.", "Slice of Life", "medium"),
    ("Two strangers share an umbrella for six blocks.", "Slice of Life", "easy"),

    # NOIR (8)
    ("A detective wakes up in his own crime scene with a glass of bourbon.", "Noir", "hard"),
    ("She walked into the office like she'd been expected. She had not.", "Noir", "medium"),
    ("The dame had a name and three different stories about it.", "Noir", "medium"),
    ("In this city, even the rain has a price tag.", "Noir", "easy"),
    ("A jazz singer asks a private eye to find the man she's been seeing in her dreams.", "Noir", "hard"),
    ("Every alibi in the room is a lie. Including yours.", "Noir", "medium"),
    ("The case file is missing one page. The last one.", "Noir", "hard"),
    ("A nightclub owner pays in favors instead of cash. Tonight, the bill is due.", "Noir", "medium"),

    # MYTHOLOGICAL (8)
    ("Persephone files for a restraining order.", "Mythological", "medium"),
    ("Odin loses his last eye in a card game.", "Mythological", "easy"),
    ("Anubis weighs the heart of a poet who only wrote bad poems.", "Mythological", "hard"),
    ("The river Styx is rerouted for construction.", "Mythological", "easy"),
    ("Athena's owl writes letters home from Earth.", "Mythological", "medium"),
    ("The Trickster gods convene to choose a new generation's victim.", "Mythological", "hard"),
    ("A demigod tries to live an ordinary 9-to-5.", "Mythological", "easy"),
    ("The Fates run out of thread.", "Mythological", "hard"),

    # SUPERNATURAL (8)
    ("A medium can only speak with one specific ghost, and he hates her.", "Supernatural", "medium"),
    ("Every cat in the neighborhood has gathered on your roof.", "Supernatural", "easy"),
    ("The séance worked, perhaps too well.", "Supernatural", "medium"),
    ("A 13-year-old discovers she can hear what plants are arguing about.", "Supernatural", "easy"),
    ("The town's church bell rings on its own at exactly 3:33 a.m.", "Supernatural", "medium"),
    ("A man hears the laughter of his deceased wife coming from the radio.", "Supernatural", "hard"),
    ("A nurse can see a glow above patients who will not survive the night.", "Supernatural", "hard"),
    ("Every full moon, the antique mirror shows a different room.", "Supernatural", "medium"),

    # CYBERPUNK (8)
    ("A street courier's neural implant starts streaming someone else's memories.", "Cyberpunk", "hard"),
    ("In neon Tokyo, a hacker steals an identity that doesn't exist yet.", "Cyberpunk", "medium"),
    ("The megacorp's HR department is run by an AI who has discovered guilt.", "Cyberpunk", "hard"),
    ("Body modders gather in the rain. One of them is leaking light.", "Cyberpunk", "medium"),
    ("A retired netrunner is pulled back in by a dead friend's last upload.", "Cyberpunk", "hard"),
    ("The black market sells unused dreams, and yours has been sold.", "Cyberpunk", "expert"),
    ("A bartender pours drinks for the city's last analog detective.", "Cyberpunk", "medium"),
    ("Augmented eyes can no longer tell the difference between ads and people.", "Cyberpunk", "hard"),

    # STEAMPUNK (8)
    ("A clockwork detective investigates the murder of a clockmaker.", "Steampunk", "medium"),
    ("The Empire's airship is missing. Along with its inventor.", "Steampunk", "medium"),
    ("A young engineer builds a mechanical bird that learns to lie.", "Steampunk", "hard"),
    ("The Royal Society of Inventors hosts a duel. The weapons are unbuilt.", "Steampunk", "medium"),
    ("A telegraph operator receives a message from a future that hasn't happened.", "Steampunk", "hard"),
    ("Beneath the gaslit streets, the gears of the city are slowing.", "Steampunk", "medium"),
    ("A submarine captain finds another submarine. Empty. Identical. Hers.", "Steampunk", "hard"),
    ("The Queen's golden automaton has begun writing poetry.", "Steampunk", "easy"),
]


def get_seed_prompts() -> List[Dict]:
    """Return list of dicts ready to insert in Mongo."""
    out = []
    rarity_by_diff = {
        "easy": "common",
        "medium": "common",
        "hard": "uncommon",
        "expert": "rare",
    }
    for text, genre, diff in SEED_PROMPTS:
        out.append({
            "text": text,
            "genre": genre,
            "difficulty": diff,
            "rarity": rarity_by_diff.get(diff, "common"),
            "modifier": None,
            "tags": [genre.lower(), diff],
            "is_ai": False,
            "is_community": False,
            "created_by": None,
        })
    return out
