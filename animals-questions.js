const animalsQuestions = {
    1: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "Elephants are afraid of mice.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Eagles can see prey from miles away.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "Dolphins are fish.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦁🐯",
                question: "Alligators and crocodiles are the same.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐼🐨",
                question: "Bees die after stinging once.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "Lions live in jungles.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "Penguins can fly.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦋🐛",
                question: "Sharks have bones.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐝🐜",
                question: "All snakes are venomous.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦈🐙",
                question: "Bears hibernate in winter.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🐢🐊",
                question: "What is an elephant's trunk used for?",
                options: ["Breathing only", "Multiple purposes"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦎🐍",
                question: "How far can eagles see?",
                options: ["1 mile", "2-3 miles"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦉🦇",
                question: "Are dolphins intelligent?",
                options: ["Yes, very", "No"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐺🦊",
                question: "Can alligators live in saltwater?",
                options: ["Mostly freshwater", "Yes"],
                correct: 0
            },
            {
                topic: "Insects",
                emoji: "🐻🐨",
                question: "What do bees make?",
                options: ["Honey", "Wax only"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐰🐹",
                question: "Who hunts in a lion pride?",
                options: ["Males", "Females"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐭🐀",
                question: "Where do penguins live?",
                options: ["North Pole", "Antarctica"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐴🦄",
                question: "What is a shark's best sense?",
                options: ["Sight", "Smell"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐮🐷",
                question: "How do frogs drink water?",
                options: ["Through mouth", "Through skin"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐔🐓",
                question: "What do bears love to eat?",
                options: ["Meat only", "Omnivorous diet"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦃🦚",
                question: "How many teeth do elephants have for chewing?",
                options: ["8", "4", "16"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦢🦩",
                question: "How much weight can an eagle carry?",
                options: ["Equal to body weight", "Half body weight", "Twice body weight"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐸🦎",
                question: "How do dolphins communicate?",
                options: ["Body language", "Clicks and whistles", "Silent"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦗🦟",
                question: "How many teeth can a crocodile have?",
                options: ["40", "60-80", "100"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🕷️🕸️",
                question: "How do bees communicate flower locations?",
                options: ["Dancing", "Buzzing", "Pheromones only"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐌🦗",
                question: "How long can a lion's roar be heard?",
                options: ["1 mile", "5 miles", "10 miles"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦞🦀",
                question: "How fast can penguins swim?",
                options: ["5 mph", "15 mph", "25 mph"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How are baby sharks born?",
                options: ["Eggs only", "Live birth or eggs", "Live birth only"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐡🦈",
                question: "How high can frogs jump?",
                options: ["5x body length", "20x body length", "50x body length"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐙🦑",
                question: "How long do bears hibernate?",
                options: ["2 months", "5-7 months", "1 year"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How much water can an elephant drink daily?",
                options: ["20 gallons", "50 gallons", "100 gallons", "200 gallons"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "How many times better is eagle vision than humans?",
                options: ["2-3 times", "4-8 times", "10 times", "20 times"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How do dolphins hear?",
                options: ["External ears", "Through jaw bone", "Blowholes", "Skin"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "What determines crocodile egg gender?",
                options: ["Genetics", "Temperature", "Location", "Random"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How many flowers do bees visit daily?",
                options: ["100", "500-1,000", "5,000", "10,000"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "What is a lion's bite force?",
                options: ["400 PSI", "650 PSI", "1,000 PSI", "1,500 PSI"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "How long do emperor penguins incubate eggs?",
                options: ["30 days", "64 days", "90 days", "120 days"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How often do sharks replace teeth?",
                options: ["Monthly", "Every 8 days", "Yearly", "Every 6 months"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "How fast is a frog's tongue strike?",
                options: ["0.07 seconds", "0.5 seconds", "1 second", "2 seconds"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How fast can a grizzly bear run?",
                options: ["20 mph", "35 mph", "45 mph", "55 mph"],
                correct: 1
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How many bones are in an elephant's trunk?",
                answer: "0 or Zero or None"
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "What is an eagle's visual acuity compared to humans?",
                answer: "20/4 or 20/5 vision"
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "What frequency range can dolphins hear?",
                answer: "20 Hz to 150 kHz"
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "What is a saltwater crocodile's bite force?",
                answer: "3,700 PSI"
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How fast do bee wings beat per second?",
                answer: "200 times or 200 Hz"
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How many lions are left in the wild?",
                answer: "20,000 or about 20,000"
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How deep can emperor penguins dive?",
                answer: "1,850 feet or 565 meters"
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How deep can great white sharks dive?",
                answer: "1,200 feet or 365 meters"
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "How many eggs can a frog lay at once?",
                answer: "Up to 20,000"
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How much can a grizzly bear lift?",
                answer: "1,000 pounds or 450 kg"
            }
        ]
    },
    2: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "Giraffes have the same number of neck bones as humans.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "Owls can turn their heads 360 degrees.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "Octopuses have three hearts.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "Lizards can regrow their tails.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "Butterflies can taste with their feet.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "Cheetahs can run faster than cars.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "Parrots can mimic human speech.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "Sea turtles return to their birthplace to lay eggs.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "Snakes can hear sounds.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "Bats are blind.",
                options: ["False", "True"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How much sleep do giraffes need daily?",
                options: ["8 hours", "2 hours"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "How do owls locate prey in darkness?",
                options: ["Sight only", "Hearing"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "Where are most octopus neurons located?",
                options: ["Brain", "Arms"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "Why do lizards drop their tails?",
                options: ["Growth", "Defense mechanism"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "What do butterflies eat?",
                options: ["Leaves", "Nectar"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How long can cheetahs maintain top speed?",
                options: ["5 minutes", "30 seconds"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "How intelligent are parrots?",
                options: ["Basic", "Very intelligent"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How do sea turtles navigate?",
                options: ["Random", "Magnetic fields"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "When are frogs most active?",
                options: ["Day", "Night"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How do bats navigate?",
                options: ["Sight", "Echolocation"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How much does a giraffe's heart weigh?",
                options: ["5 lbs", "25 lbs", "50 lbs"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "How many degrees can owls rotate their heads?",
                options: ["180", "270", "360"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How many suckers does an octopus have?",
                options: ["500", "2,000", "5,000"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How long does tail regeneration take in lizards?",
                options: ["1 week", "2 months", "1 year"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "What is a butterfly's average lifespan?",
                options: ["1 week", "2-4 weeks", "6 months"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What is a cheetah's top speed?",
                options: ["50 mph", "70 mph", "90 mph"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How long can parrots live?",
                options: ["10 years", "30 years", "80 years"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How long can sea turtles live?",
                options: ["30 years", "50 years", "100+ years"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "What percentage of frogs are endangered?",
                options: ["10%", "30%", "50%"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "What do most bats eat?",
                options: ["Blood", "Insects and fruit", "Fish"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "What is a giraffe's blood pressure?",
                options: ["120/80", "280/180", "150/90", "200/120"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "Why can owls rotate heads so far?",
                options: ["Flexible skull", "No bones", "Extra vertebrae", "Magic"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How fast can octopuses change color?",
                options: ["1 second", "0.3 seconds", "5 seconds", "10 seconds"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "What cells enable tail regeneration?",
                options: ["Stem cells", "Blood cells", "Blastema cells", "Nerve cells"],
                correct: 2
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How do butterflies see?",
                options: ["Simple eyes", "Compound eyes", "No eyes", "One eye"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "What body feature helps cheetahs run fast?",
                options: ["Large lungs", "Flexible spine", "Long legs", "All of these"],
                correct: 3
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "Can parrots understand context?",
                options: ["No", "Basic only", "Yes, some can", "All can"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How do sea turtles find their birthplace?",
                options: ["Sight", "Magnetic imprinting", "Smell", "Following others"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "What disease threatens frogs globally?",
                options: ["Flu", "Chytrid fungus", "Cancer", "None"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How many pups do bats have per year?",
                options: ["1", "2-3", "5-10", "20+"],
                correct: 0
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How long is a giraffe's tongue?",
                answer: "20 inches or 50 cm"
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "What frequency range can owls hear?",
                answer: "200 Hz to 12 kHz"
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How many neurons does an octopus have?",
                answer: "500 million"
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How many times can a lizard regrow its tail?",
                answer: "Multiple times throughout life"
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How many butterfly species exist?",
                answer: "20,000 or about 20,000"
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "What is the cheetah's acceleration time to 60 mph?",
                answer: "3 seconds"
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "What is the vocabulary record for a parrot?",
                answer: "Over 1,700 words"
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How deep can leatherback turtles dive?",
                answer: "4,000 feet or 1,200 meters"
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "How many frog species exist worldwide?",
                answer: "7,000 or over 7,000"
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "What is the echolocation frequency range of bats?",
                answer: "20-200 kHz"
            }
        ]
    },
    3: {
        easy: [
            {
                topic: "Marine Life",
                emoji: "🦒🦓",
                question: "Are octopuses colorblind?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦉🦇",
                question: "Can snakes sense heat?",
                options: ["No", "Yes"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐙🦑",
                question: "How many eyes does a bee have?",
                options: ["2", "5"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦘🦌",
                question: "Do wolves hunt alone?",
                options: ["No, in packs", "Yes, always"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐺🦊",
                question: "Which bird lays the largest egg relative to body size?",
                options: ["Ostrich", "Kiwi"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐵🦍",
                question: "What do seals primarily eat?",
                options: ["Plants", "Fish"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🦩🦚",
                question: "Do frogs drink water?",
                options: ["No, absorb through skin", "Yes, drink it"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐠🐟",
                question: "Why do beavers build dams?",
                options: ["For shelter", "For fun"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "Do all turtles lay eggs?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐨🦥",
                question: "Do eagles build nests on the ground?",
                options: ["No", "Yes"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Marine Life",
                emoji: "🦭🦦",
                question: "What color is octopus blood?",
                options: ["Red", "Blue"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐆🐅",
                question: "How do snakes detect heat?",
                options: ["Skin", "Pit organs"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦎🐉",
                question: "What do bees collect from flowers?",
                options: ["Nectar and pollen", "Water"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐋🐚",
                question: "What is a wolf pack structure?",
                options: ["Family unit", "Random group"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦜🦢",
                question: "Can parrots see colors?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐃🐄",
                question: "Can seals sleep underwater?",
                options: ["No", "Yes"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐑🐐",
                question: "Can frogs live in saltwater?",
                options: ["Most can't", "All can"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐪🦙",
                question: "Do beaver teeth stop growing?",
                options: ["No, grow continuously", "Yes"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "Where do sea turtles lay eggs?",
                options: ["In water", "On beaches"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦨🦔",
                question: "How many eaglets usually survive?",
                options: ["All", "Usually one"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Marine Life",
                emoji: "🐘🦏",
                question: "How intelligent are octopuses?",
                options: ["Low", "Average", "Highly intelligent"],
                correct: 2
            },
            {
                topic: "Reptiles",
                emoji: "🦅🦜",
                question: "What percentage of snakes are venomous?",
                options: ["10%", "20%", "50%"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐬🐳",
                question: "How many bees live in a hive?",
                options: ["1,000", "20,000-80,000", "500,000"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐊🦎",
                question: "How far can a wolf howl be heard?",
                options: ["1 mile", "6 miles", "20 miles"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐝🦋",
                question: "Which parrot species is most talkative?",
                options: ["Macaw", "African Grey", "Cockatoo"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦁🐯",
                question: "How long can seals hold their breath?",
                options: ["5 minutes", "30 minutes", "2 hours"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🐧🦆",
                question: "How many times its body length can a frog jump?",
                options: ["5 times", "20 times", "50 times"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦈🐡",
                question: "How long is the longest beaver dam?",
                options: ["100 feet", "850 feet", "2,790 feet"],
                correct: 2
            },
            {
                topic: "Reptiles",
                emoji: "🐍🐢",
                question: "How long can sea turtles hold their breath?",
                options: ["30 minutes", "4-7 hours", "12 hours"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐻🐼",
                question: "How long do eagle eggs take to hatch?",
                options: ["20 days", "35 days", "60 days"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Marine Life",
                emoji: "🦒🦓",
                question: "How many arms can an octopus regrow?",
                options: ["None", "One", "Multiple", "All"],
                correct: 3
            },
            {
                topic: "Reptiles",
                emoji: "🦉🦇",
                question: "How many snake species exist worldwide?",
                options: ["500", "1,500", "3,900", "10,000"],
                correct: 2
            },
            {
                topic: "Insects",
                emoji: "🐙🦑",
                question: "How long can a queen bee live?",
                options: ["1 year", "3 years", "5 years", "7 years"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦘🦌",
                question: "What is a wolf's jaw pressure?",
                options: ["200 PSI", "400 PSI", "800 PSI", "1,200 PSI"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐺🦊",
                question: "What is a parrot's brain-to-body ratio?",
                options: ["Similar to dogs", "Similar to primates", "Similar to fish", "Largest of all birds"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐵🦍",
                question: "How do seals regulate body temperature in cold water?",
                options: ["Shivering", "Thick blubber", "Metabolism", "All of these"],
                correct: 3
            },
            {
                topic: "Amphibians",
                emoji: "🦩🦚",
                question: "What protects frogs from bacteria?",
                options: ["Thick skin", "Antimicrobial peptides", "Immune cells", "Nothing"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐠🐟",
                question: "How long can beavers stay underwater?",
                options: ["2 minutes", "5 minutes", "15 minutes", "30 minutes"],
                correct: 2
            },
            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "How do baby sea turtles know to go to the ocean?",
                options: ["Following mother", "Light cues", "Instinct and gravity", "Random"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐨🦥",
                question: "What percentage of an eagle's body is muscle?",
                options: ["20%", "35%", "50%", "65%"],
                correct: 2
            }
        ],
        extreme: [
            {
                topic: "Marine Life",
                emoji: "🦭🦦",
                question: "How many suckers does an octopus have per arm?",
                answer: "240 or about 240"
            },
            {
                topic: "Reptiles",
                emoji: "🐆🐅",
                question: "What is the fastest snake strike speed?",
                answer: "2.5 meters per second"
            },
            {
                topic: "Insects",
                emoji: "🦎🐉",
                question: "How many flowers must bees visit for 1 pound of honey?",
                answer: "2 million"
            },
            {
                topic: "Mammals",
                emoji: "🐋🐚",
                question: "How much stronger is a wolf's sense of smell than humans?",
                answer: "100 times or 100x"
            },
            {
                topic: "Birds",
                emoji: "🦜🦢",
                question: "What is the smallest parrot species?",
                answer: "Buff-faced pygmy parrot"
            },
            {
                topic: "Marine Life",
                emoji: "🐃🐄",
                question: "How much can an elephant seal weigh?",
                answer: "8,800 pounds or 4 tons"
            },
            {
                topic: "Amphibians",
                emoji: "🐑🐐",
                question: "What is the smallest frog in the world?",
                answer: "Paedophryne amauensis"
            },
            {
                topic: "Mammals",
                emoji: "🐪🦙",
                question: "How many trees can a beaver cut down per year?",
                answer: "200 or about 200"
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "How many sea turtle species exist?",
                answer: "7 or Seven"
            },
            {
                topic: "Birds",
                emoji: "🦨🦔",
                question: "From what distance can an eagle spot a rabbit?",
                answer: "2 miles or 3.2 km"
            }
        ]
    },
    4: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "Monkeys and apes are the same.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Ducks can sleep with one eye open.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "Clownfish can change gender.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "All turtles lay eggs on land.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "Queen ants can live for decades.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "Foxes are canines.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "Eagles build nests on the ground.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Crabs walk sideways.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐍🐢",
                question: "Geckos can walk on ceilings.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "Squirrels forget where they bury nuts.",
                options: ["True", "False"],
                correct: 0
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "What distinguishes apes from monkeys?",
                options: ["Size", "No tail"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Why do ducks sleep with one eye open?",
                options: ["Broken sleep", "Watch for predators"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "Do all male clownfish become female?",
                options: ["Yes, when dominant female dies", "No"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "Why do turtles lay eggs on land?",
                options: ["Tradition", "Need air to develop"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "What do worker ants do?",
                options: ["Reproduce", "All colony tasks"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How do foxes hunt?",
                options: ["Chasing", "Pouncing"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "Where do eagles prefer to nest?",
                options: ["Ground", "High places"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "Why do crabs walk sideways?",
                options: ["Leg structure", "Preference"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "Can all lizard species drop tails?",
                options: ["No, only some", "Yes, all"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How do squirrels find buried nuts?",
                options: ["Memory", "Smell"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How many ape species exist?",
                options: ["5", "15", "30"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "What is this sleep pattern called?",
                options: ["Light sleep", "Unihemispheric sleep", "Napping"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How long does gender change take in clownfish?",
                options: ["Instant", "Few weeks", "6 months"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "What determines turtle egg gender?",
                options: ["Genetics", "Temperature", "Location"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How much can ants lift?",
                options: ["5x weight", "20x weight", "50x weight"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "What is a fox's top speed?",
                options: ["20 mph", "30 mph", "45 mph"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How heavy can an eagle nest become?",
                options: ["100 lbs", "1,000 lbs", "2,000 lbs"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How many eyes do crabs have?",
                options: ["2", "6", "8"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How long does tail regrowth take?",
                options: ["1 week", "2 months", "1 year"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "What percent of nuts do squirrels find?",
                options: ["50%", "75%", "95%"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "What percent DNA do humans share with chimpanzees?",
                options: ["80%", "90%", "98.8%", "99.9%"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Which brain hemisphere sleeps in ducks?",
                options: ["Both", "Neither", "Alternates", "Left only"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "What do clownfish and anemones share?",
                options: ["Competition", "Mutualism", "Predation", "Nothing"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How many eggs does a sea turtle lay?",
                options: ["10-20", "50-80", "100-200", "500+"],
                correct: 2
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "What is the total ant population on Earth?",
                options: ["1 billion", "1 trillion", "20 quadrillion", "Unknown"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How do foxes use Earth's magnetic field?",
                options: ["Navigation", "Hunting", "Don't use it", "Mating"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "What is the term for baby eagles?",
                options: ["Chicks", "Eaglets", "Fledglings", "Hatchlings"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How many times do crabs molt in life?",
                options: ["Once", "5-10 times", "20+ times", "Continuously"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "What enables lizard tail regeneration?",
                options: ["Stem cells", "Blastema cells", "Magic", "Diet"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How many hours do squirrels sleep daily?",
                options: ["8 hours", "15 hours", "20 hours", "4 hours"],
                correct: 1
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How many bones does a monkey have?",
                answer: "About 206"
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "How many duck species exist?",
                answer: "120 or about 120"
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How many anemone tentacles protect clownfish?",
                answer: "Varies, typically hundreds"
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How far can sea turtles migrate?",
                answer: "10,000 miles or 16,000 km"
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "What is the combined weight of all ants on Earth?",
                answer: "Equal to all humans combined"
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How many teeth does a fox have?",
                answer: "42"
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How many feathers does an eagle have?",
                answer: "About 7,000"
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How many eggs can a female crab produce?",
                answer: "1,000 to 2 million"
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "What is the longest lizard species?",
                answer: "Komodo dragon"
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How fast do squirrel teeth grow per year?",
                answer: "6 inches or 15 cm"
            }
        ]
    },
    5: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "Tigers and lions can interbreed.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "Only male peacocks have colorful feathers.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "Whales are fish.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "Chameleons change color for camouflage only.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "Mosquitoes are attracted to body heat.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "Otters hold hands while sleeping.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "Penguins can live in hot climates.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "Crabs have 10 legs.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "Box turtles can close their shells completely.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "Koalas are nocturnal.",
                options: ["False", "True"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "Can tigers swim?",
                options: ["No", "Yes, very well"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Why do male peacocks display feathers?",
                options: ["Warmth", "Attract mates"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How do whales breathe?",
                options: ["Gills", "Blowholes"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "Why do chameleons change color?",
                options: ["Camouflage only", "Communication and mood"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "Which mosquitoes bite humans?",
                options: ["Males", "Females"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "What tools do otters use?",
                options: ["Sticks", "Rocks"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "Where do Galapagos penguins live?",
                options: ["Antarctica", "Equator"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Do crabs have homes?",
                options: ["No", "Some do"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "Is a turtle's shell part of its skeleton?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "What do koalas eat?",
                options: ["Bamboo", "Eucalyptus"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "What is a tiger's bite force?",
                options: ["500 PSI", "1,000 PSI", "1,500 PSI"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "How many tail feathers does a peacock have?",
                options: ["50", "150", "200"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How much does a blue whale's tongue weigh?",
                options: ["1 ton", "3 tons", "6 tons"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How fast can chameleons change color?",
                options: ["1 minute", "20 seconds", "Instant"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How many people do mosquitoes kill annually?",
                options: ["10,000", "100,000", "700,000+"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How much do sea otters eat daily?",
                options: ["10% body weight", "25% body weight", "50% body weight"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How long do emperor penguins fast while incubating?",
                options: ["1 month", "2 months", "4 months"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How strong is a coconut crab's claw?",
                options: ["50 lbs", "300 lbs", "700 lbs"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "How long can box turtles live?",
                options: ["20 years", "50 years", "100+ years"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How many hours do koalas sleep daily?",
                options: ["8 hours", "15 hours", "22 hours"],
                correct: 2
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How far can tigers swim?",
                options: ["1 mile", "6 miles", "15 miles", "30 miles"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "How many eye-spots are on a peacock's train?",
                options: ["50", "100", "150-200", "500"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How much does a blue whale's heart weigh?",
                options: ["100 lbs", "400 lbs", "1,000 lbs", "2,000 lbs"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "What cells allow color change?",
                options: ["Melanocytes", "Chromatophores", "Keratinocytes", "Fibroblasts"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "What diseases can mosquitoes transmit?",
                options: ["None", "1-2", "10+", "Only malaria"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How many hairs per square inch do sea otters have?",
                options: ["10,000", "100,000", "1 million", "10 million"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How many eggs do penguins typically lay?",
                options: ["1-2", "5-10", "20+", "50+"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How many crab species exist?",
                options: ["500", "1,500", "6,800", "20,000"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How many vertebrae are fused in a turtle's shell?",
                options: ["10", "30", "50", "100"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "What is unique about koala brains?",
                options: ["Very large", "Very smooth", "Two hemispheres", "Most wrinkled"],
                correct: 1
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "What is a tiger's top running speed?",
                answer: "40 mph or 65 km/h"
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "How long can a peacock's train grow?",
                answer: "5 feet or 1.5 meters"
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "What is the length of the longest blue whale recorded?",
                answer: "110 feet or 33.5 meters"
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How many degrees can a chameleon's eyes rotate?",
                answer: "360 degrees independently"
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How fast can a mosquito beat its wings?",
                answer: "300-600 times per second"
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How long can sea otters hold their breath?",
                answer: "5 minutes or about 5 minutes"
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "How long can emperor penguins stay underwater?",
                answer: "22 minutes or about 20 minutes"
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "What is the leg span of the largest crab?",
                answer: "12 feet or 3.7 meters"
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "What is the oldest recorded age of a box turtle?",
                answer: "138 years"
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How many calories do koalas get from eucalyptus daily?",
                answer: "500 calories or about 500"
            }
        ]
    }
};

// Chapters 6-20 will be added with completely unique questions
// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = animalsQuestions;
}



     // Chapters 6-20 - All Unique Questions

const animalsChapters6to20 = {
    6: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "Kangaroos can box.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Flamingos are born pink.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "Squids have ink sacs.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "Snakes can sleep.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "Spiders are insects.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "Hedgehogs carry apples on their spines.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "Songbirds learn their songs.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "Lobsters are naturally red.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "Komodo dragons are the largest lizards.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "Llamas are related to camels.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "Why do male kangaroos box?",
                options: ["Sport", "Dominance"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "What makes flamingos pink?",
                options: ["Genetics", "Diet"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "Why do squids release ink?",
                options: ["Defense", "Communication"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "Do snakes have eyelids?",
                options: ["No", "Yes"],
                correct: 0
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How many legs do spiders have?",
                options: ["6", "8"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How do hedgehogs defend themselves?",
                options: ["Running", "Curling into ball"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How do birds learn songs?",
                options: ["Instinct", "From parents"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "What color are live lobsters?",
                options: ["Red", "Brown-green"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How do Komodo dragons track prey?",
                options: ["Sight", "Smell"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "Do llamas spit?",
                options: ["Yes", "No"],
                correct: 0
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How much can a kangaroo's kick force reach?",
                options: ["300 PSI", "850 PSI", "1,500 PSI"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Why do flamingos stand on one leg?",
                options: ["Rest", "Conserve body heat", "Balance"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How large is a giant squid's eye?",
                options: ["5 inches", "10 inches", "15 inches"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "What covers a snake's eye?",
                options: ["Nothing", "Spectacle scale", "Eyelid"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How strong is spider silk?",
                options: ["Weak", "Stronger than steel", "Like cotton"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How many quills does a hedgehog have?",
                options: ["1,000", "5,000-7,000", "10,000"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "What age do birds learn songs?",
                options: ["Birth", "Youth", "Adulthood"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How long can lobsters live?",
                options: ["20 years", "50 years", "100+ years"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "Are Komodo dragons venomous?",
                options: ["No", "Yes", "Only males"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How tall can llamas grow?",
                options: ["4 feet", "6 feet", "8 feet"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "What DNA percentage do humans share with orangutans?",
                options: ["85%", "96.9%", "99%", "75%"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "How many degrees can owls rotate heads?",
                options: ["180", "270", "360", "90"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How many shark species exist?",
                options: ["50", "500+", "5,000", "50,000"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How do lizards see UV light?",
                options: ["They can't", "Fourth color receptor", "Special lens", "Through skin"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How loud can cricket chirps be?",
                options: ["20 dB", "50 dB", "90 dB", "120 dB"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What is unique about raccoon paws?",
                options: ["Webbed", "Four times more receptors than humans", "Poisonous", "Glow in dark"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How do penguins choose mates?",
                options: ["Random", "Pebble gifting", "Fighting", "Dancing"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How many color receptors do mantis shrimp have?",
                options: ["3", "12", "16", "50"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "How many teeth can crocodiles grow in lifetime?",
                options: ["100", "1,000", "4,000", "10,000"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How many muscles control hedgehog quills?",
                options: ["50", "500", "5,000", "50,000"],
                correct: 1
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "What is an orangutan's arm span?",
                answer: "7 feet or 2.1 meters"
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "What is the smallest bird species?",
                answer: "Bee hummingbird at 2 inches"
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "At what dilution can sharks detect blood?",
                answer: "1 part per million"
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "What is the fastest lizard species?",
                answer: "Spiny-tailed iguana at 21 mph"
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How many times per second do cricket wings rub?",
                answer: "About 4-5 times"
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How many neurons do raccoons have?",
                answer: "438 million"
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How many species of penguins exist?",
                answer: "18 species"
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "What is the mantis shrimp punch speed?",
                answer: "50 mph or 80 km/h"
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How long can crocodiles hold their breath?",
                answer: "1-2 hours"
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How many quills does a hedgehog have?",
                answer: "5,000-7,000"
            }
        ]
    },

 7: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "Pandas eat bamboo.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Hummingbirds can fly backwards.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "Blue whales are the largest animals ever.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "Chameleons change color instantly.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "Only female mosquitoes bite.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "Kangaroos can't walk backwards.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "Eagles have excellent eyesight.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Squids have beaks.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐍🐢",
                question: "All turtles can swim.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "Beavers build dams.",
                options: ["True", "False"],
                correct: 0
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How much bamboo do pandas eat daily?",
                options: ["5 lbs", "26-84 lbs"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Can hummingbirds hover in place?",
                options: ["No", "Yes"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How do blue whales communicate?",
                options: ["Clicks", "Songs"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How fast can chameleons change color?",
                options: ["Instant", "20 seconds"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "Why do female mosquitoes need blood?",
                options: ["Food", "Egg production"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How do kangaroos move when not hopping?",
                options: ["Crawl", "Walk using tail"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How far can eagles see prey?",
                options: ["500 feet", "2 miles"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How do squids escape predators?",
                options: ["Ink cloud", "Speed only"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "Do sea turtles return to birthplace?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "What do beavers use to build dams?",
                options: ["Rocks", "Wood and mud"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How strong are gorillas compared to humans?",
                options: ["Same", "3x stronger", "10x stronger"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "How many feathers does a typical bird have?",
                options: ["100", "1,000", "25,000"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How long can elephant seals hold breath?",
                options: ["15 minutes", "1 hour", "2 hours"],
                correct: 2
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "How many teeth can alligators have?",
                options: ["40", "80", "120"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How many wings do mosquitoes have?",
                options: ["2", "4", "6"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How powerful is wolf sense of smell?",
                options: ["10x humans", "100x humans", "1,000x humans"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How long can flamingos stand on one leg?",
                options: ["Minutes", "Hours", "Days"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How many tentacles does a squid have?",
                options: ["6", "8", "10"],
                correct: 2
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "How long can pythons grow?",
                options: ["10 feet", "20 feet", "30+ feet"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How far can a skunk spray?",
                options: ["5 feet", "10 feet", "15 feet"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "What DNA percentage do humans share with gorillas?",
                options: ["85%", "92%", "98.3%", "99.9%"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "What makes bird bones lightweight?",
                options: ["Small", "Hollow with air sacs", "Cartilage", "Thin"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How deep can elephant seals dive?",
                options: ["500 feet", "2,000 feet", "5,000 feet", "10,000 feet"],
                correct: 2
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "What determines alligator egg gender?",
                options: ["Genetics", "Temperature", "Location", "Random"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "What is total ant biomass on Earth?",
                options: ["Equal to all humans", "Half of humans", "Twice humans", "10x humans"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How many hours do wolves sleep daily?",
                options: ["4 hours", "8 hours", "12 hours", "16 hours"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "How long do flamingos mate for?",
                options: ["Season", "Year", "Life", "Never pair"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "What color is lobster blood?",
                options: ["Red", "Blue", "Green", "Clear"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐍🐢",
                question: "How much pressure can pythons squeeze?",
                options: ["30 PSI", "60 PSI", "90 PSI", "120 PSI"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "Can foxes use Earth's magnetic field?",
                options: ["No", "For navigation", "For hunting", "Unknown"],
                correct: 2
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How much can a silverback gorilla lift?",
                answer: "1,800 pounds or 815 kg"
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "What is a hummingbird's heart rate?",
                answer: "1,200 bpm"
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How many hearts does an octopus have?",
                answer: "3 or Three"
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "What is an alligator's bite force?",
                answer: "2,125 PSI"
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "What is the estimated ant population?",
                answer: "20 quadrillion"
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How many hours do wolves travel per day?",
                answer: "8 hours or about 8 hours"
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How tall can flamingos grow?",
                answer: "5 feet or 1.5 meters"
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "What is the heaviest lobster caught?",
                answer: "44 pounds or 20 kg"
            },
            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "What is the longest python recorded?",
                answer: "33 feet or 10 meters"
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How many teeth do foxes have?",
                answer: "42"
            }
        ]
    },

    8: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "Rhinos have horns made of hair.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "Parrots can mimic sounds.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "Pufferfish can inflate themselves.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "All lizards can regrow tails.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "Butterflies have four wings.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "Camels store fat in humps.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "Owls can turn heads 270 degrees.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "Sharks have cartilage instead of bones.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "All snakes lay eggs.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "Skunks can spray accurately.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "What are rhino horns made of?",
                options: ["Bone", "Keratin"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Can parrots understand meaning?",
                options: ["Some can", "No"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How do pufferfish inflate?",
                options: ["Air", "Water"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How many times can lizards regrow tails?",
                options: ["Once", "Multiple times"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How many wings do butterflies have?",
                options: ["2", "4"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How long can camels go without water?",
                options: ["1 week", "2 months"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "When do owls hunt?",
                options: ["Day", "Night"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Do pufferfish contain poison?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "Do some snakes give live birth?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How accurate is skunk spray?",
                options: ["Very accurate up to 10 feet", "Random"],
                correct: 0
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How fast can rhinos run?",
                options: ["20 mph", "35 mph", "50 mph"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "How long can macaws live?",
                options: ["20 years", "50 years", "80 years"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How deadly is pufferfish toxin?",
                options: ["Mild", "1,200x cyanide", "Like bee sting"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How long can lizards hold their breath?",
                options: ["10 minutes", "30 minutes", "1 hour"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How many species of butterflies exist?",
                options: ["1,000", "10,000", "20,000"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What temperature can camels tolerate?",
                options: ["50°F", "100°F", "120°F"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "What is unique about owl ears?",
                options: ["Very large", "Asymmetrical placement", "External"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How many bones do sharks have?",
                options: ["0", "100", "300"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "What percentage of snakes give live birth?",
                options: ["10%", "20%", "50%"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How many sprays can a skunk make?",
                options: ["1-2", "5-6", "Unlimited"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How many rhino species exist?",
                options: ["2", "5", "10", "20"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "What is parrot intelligence compared to?",
                options: ["Dogs", "5-year-old child", "Cats", "Fish"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "What do pufferfish use their teeth for?",
                options: ["Crushing shells", "Fighting", "Display", "Nothing"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "How many chambers do snake hearts have?",
                options: ["2", "3", "4", "5"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How many lenses in butterfly compound eyes?",
                options: ["100", "1,000", "6,000", "12,000"],
                correct: 3
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How much water can a camel drink at once?",
                options: ["10 gallons", "30 gallons", "60 gallons", "100 gallons"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How many eyelids do owls have?",
                options: ["1", "2", "3", "4"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How long have sharks existed?",
                options: ["50 million years", "200 million years", "450 million years", "1 billion years"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "What percentage of snake venom is protein?",
                options: ["20%", "50%", "90%", "100%"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "What chemical makes skunk spray smell?",
                options: ["Ammonia", "Thiols", "Sulfuric acid", "Methane"],
                correct: 1
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How much can a white rhino weigh?",
                answer: "5,000 pounds or 2,300 kg"
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "What is the parrot vocabulary record?",
                answer: "Over 1,700 words"
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How many people can one pufferfish kill?",
                answer: "30 people"
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How many lizard species exist?",
                answer: "6,000 or over 6,000"
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How many flowers does a butterfly visit daily?",
                answer: "Hundreds to thousands"
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How much can a camel carry?",
                answer: "900 pounds or 400 kg"
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "How many degrees can owls rotate their necks?",
                answer: "270 degrees"
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How many teeth can a shark have in lifetime?",
                answer: "30,000 or over 30,000"
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "What is the longest snake species?",
                answer: "Reticulated python at 30+ feet"
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How far can skunk spray be detected?",
                answer: "1 mile or 1.6 km"
            }
        ]
    },
    9: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "Bison are the largest land mammals in North America.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Parrots can learn to talk.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "Whales are the largest animals ever.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "Komodo dragons only live in Indonesia.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "Ladybugs eat aphids.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "Sea otters hold hands while sleeping.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "Eagles can see fish underwater.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "Hermit crabs use empty shells.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "Pythons can unhinge their jaws.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "Sloths sleep hanging upside down.",
                options: ["True", "False"],
                correct: 0
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How much can a bison weigh?",
                options: ["500 lbs", "2,000 lbs"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "Can eagles see in color?",
                options: ["No", "Yes"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How much milk does a whale calf drink daily?",
                options: ["10 gallons", "100+ gallons"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "How do Komodo dragons hunt?",
                options: ["Speed", "Venom and tracking"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "What do ladybugs primarily eat?",
                options: ["Leaves", "Aphids"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "Why do otters hold hands?",
                options: ["Affection", "Avoid drifting apart"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "From what height can eagles spot fish?",
                options: ["100 feet", "1,000+ feet"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "Why do hermit crabs need shells?",
                options: ["Fashion", "Protection"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How do pythons incubate eggs?",
                options: ["Leave them", "Coil around them"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How do kangaroos move when grazing?",
                options: ["Hop", "Walk using tail"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How fast can bison run?",
                options: ["20 mph", "35 mph", "50 mph"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "What is the record for parrot vocabulary?",
                options: ["100 words", "500 words", "1,700+ words"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How many species of whales exist?",
                options: ["20", "50", "90"],
                correct: 2
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How many teeth do Komodo dragons have?",
                options: ["20", "60", "100"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How many mosquito species exist?",
                options: ["100", "3,500+", "10,000"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How many bones do sea otters have?",
                options: ["100", "200", "300"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "How far away can eagles see prey?",
                options: ["1/2 mile", "2 miles", "10 miles"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How often do hermit crabs change shells?",
                options: ["Once", "As they grow", "Never"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "What percentage of python species are venomous?",
                options: ["0%", "50%", "100%"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "What is a kangaroo's top hopping speed?",
                options: ["15 mph", "35 mph", "50 mph"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "What role do bison play in ecosystems?",
                options: ["None", "Keystone species", "Predator", "Pest"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "What family do parrots belong to?",
                options: ["Corvidae", "Psittacidae", "Accipitridae", "Strigidae"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How do baleen whales produce sound?",
                options: ["Vocal cords", "Larynx", "Unknown mechanism", "Blowholes"],
                correct: 2
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "What bacteria live in Komodo dragon saliva?",
                options: ["None", "50+ strains", "Beneficial only", "5 strains"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "What does mosquito saliva contain?",
                options: ["Nothing", "Anticoagulants", "Venom", "Sugar"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What is unique about sea otter fur?",
                options: ["Longest", "Densest", "Waterproof", "Colorful"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How do parrots learn to talk?",
                options: ["Instinct", "Mimicry", "Training", "Both B and C"],
                correct: 3
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "What type of eyes do crabs have?",
                options: ["Simple", "Compound", "No eyes", "Single lens"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "How do pythons generate heat for eggs?",
                options: ["Can't", "Muscle contractions", "Sun only", "Metabolism"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "What enables kangaroo hopping efficiency?",
                options: ["Muscles", "Elastic tendons", "Light bones", "Long legs"],
                correct: 1
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How many bison existed before European colonization?",
                answer: "30-60 million"
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "How many words can an African Grey Parrot learn?",
                answer: "1,000+ words"
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "What is the longest blue whale ever recorded?",
                answer: "110 feet or 33.5 meters"
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "What is a Komodo dragon's running speed?",
                answer: "12 mph or 20 km/h"
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How many deaths do mosquitoes cause annually?",
                answer: "700,000+"
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How many calories do sea otters eat daily?",
                answer: "7,500 calories"
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How far can an eagle fly in a day?",
                answer: "100+ miles"
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "What is the leg span of the Japanese spider crab?",
                answer: "12 feet or 3.7 meters"
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How much can a python squeeze?",
                answer: "90 PSI or 6 bar"
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How high can a kangaroo jump?",
                answer: "10 feet or 3 meters"
            }
        ]
    },
    10: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "Dogs have better smell than humans.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Ducks have waterproof feathers.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "Pufferfish are poisonous.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "Crocodiles are older than dinosaurs.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "Flies can walk on ceilings.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "Leopards are excellent climbers.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "The dodo bird is extinct.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Octopuses can change texture.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐍🐢",
                question: "Turtles can live over 100 years.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "Camels store water in their humps.",
                options: ["False", "True"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How much better is a dog's smell?",
                options: ["10x", "10,000-100,000x"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "What makes duck feathers waterproof?",
                options: ["Natural coating", "Preen oil"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "What toxin do pufferfish contain?",
                options: ["Cyanide", "Tetrodotoxin"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "When did crocodiles appear?",
                options: ["50 million years ago", "200+ million years ago"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How do flies stick to ceilings?",
                options: ["Suction", "Sticky pads"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "Why do leopards drag prey into trees?",
                options: ["Fun", "Keep from scavengers"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "When did dodos go extinct?",
                options: ["1500s", "1600s"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How do octopuses change texture?",
                options: ["Skin muscles", "Magic"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "What is the oldest turtle age recorded?",
                options: ["100 years", "180+ years"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "What do camel humps store?",
                options: ["Water", "Fat"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How many smell receptors do dogs have?",
                options: ["10 million", "300 million", "1 billion"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "How many feathers does a duck have?",
                options: ["1,000", "14,000", "50,000"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How toxic is tetrodotoxin?",
                options: ["Mild", "1,200x deadlier than cyanide", "Like bee sting"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "How old can crocodiles live?",
                options: ["30 years", "70+ years", "150 years"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How fast can flies react?",
                options: ["Same as humans", "7x faster", "Slower"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How much weight can leopards carry up trees?",
                options: ["Equal to body", "3x body weight", "Half body"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How tall were dodos?",
                options: ["1 foot", "3 feet", "6 feet"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How fast can octopuses change appearance?",
                options: ["1 minute", "Under 1 second", "10 seconds"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How fast can sea turtles swim?",
                options: ["5 mph", "20 mph", "35 mph"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How many hours do leopards sleep daily?",
                options: ["8 hours", "12 hours", "16 hours"],
                correct: 2
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "What brain area processes dog smell?",
                options: ["Small area", "40x larger than humans", "Same as humans", "Don't have one"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "How long can ducks stay underwater?",
                options: ["10 seconds", "1 minute", "5 minutes", "30 minutes"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How many pufferfish species are poisonous?",
                options: ["All", "Most", "Few", "None"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "What makes crocodilians unique among reptiles?",
                options: ["Size", "Four-chambered heart", "Intelligence", "Speed"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How many images per second can flies see?",
                options: ["24", "60", "250", "1,000"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "When do leopards prefer to hunt?",
                options: ["Dawn", "Noon", "Night", "Dusk"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "Where did dodos live?",
                options: ["Madagascar", "Mauritius", "Hawaii", "Galapagos"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "What percentage of octopus neurons are in arms?",
                options: ["10%", "33%", "66%", "90%"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "How do sea turtles navigate thousands of miles?",
                options: ["Stars", "Magnetic fields", "Smell", "Following others"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "What temperature range can camels tolerate?",
                options: ["10°F", "50°F", "120°F", "150°F"],
                correct: 2
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How many olfactory receptors do dogs have?",
                answer: "220 million"
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "What is a duck's heart rate while flying?",
                answer: "400 bpm"
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How many people does one pufferfish have enough toxin to kill?",
                answer: "30 people"
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How many teeth can a crocodile have in its lifetime?",
                answer: "4,000 or about 4,000"
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How fast do fly wings beat per second?",
                answer: "200 times"
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What is a leopard's bite force?",
                answer: "310 PSI"
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How much did dodos weigh?",
                answer: "20-40 pounds or 9-18 kg"
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How toxic is pufferfish poison?",
                answer: "1,200 times more toxic than cyanide"
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "How long can crocodiles live?",
                answer: "70-100 years"
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How slow do sloths move?",
                answer: "0.15 mph or 0.24 km/h"
            }
        ]
    }
};

// Chapters 11-20 - Final Set of Unique Questions

const animalsChapters11to20 = {
    11: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "Seals can sleep underwater.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "Parrots come in many colors.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "Lobsters can regenerate claws.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "Iguanas are herbivores.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "Ants never sleep.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "Sloths are slow movers.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "Peacocks are male peafowl.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "Octopuses are invertebrates.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "Tortoises live on land.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "Skunks spray when threatened.",
                options: ["True", "False"],
                correct: 0
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How do seals stay warm in cold water?",
                options: ["Thick skin", "Blubber layer"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "What determines parrot color?",
                options: ["Diet", "Feather structure and pigments"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How long does claw regeneration take?",
                options: ["Weeks", "Years"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "What do iguanas eat?",
                options: ["Insects", "Plants"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "Do ants take short naps?",
                options: ["No", "Yes, hundreds daily"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How often do sloths defecate?",
                options: ["Daily", "Once a week"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "What are the eye-spots on peacock feathers for?",
                options: ["Vision", "Attracting mates"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Are octopuses intelligent?",
                options: ["No", "Yes, highly"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "Where do tortoises lay eggs?",
                options: ["In nests on land", "In water"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "Do skunks warn before spraying?",
                options: ["Yes, with body language", "No"],
                correct: 0
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How fast do beaver teeth grow per year?",
                options: ["1 inch", "4 inches", "8 inches"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "How many colors can parrots see?",
                options: ["3", "4", "7"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How long can lobsters live?",
                options: ["10 years", "50+ years", "200 years"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How long can green iguanas grow?",
                options: ["2 feet", "5 feet", "10 feet"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How long is each ant nap?",
                options: ["1 minute", "8 minutes", "1 hour"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What grows in sloth fur?",
                options: ["Nothing", "Algae", "Moss"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How many tail feathers do peacocks display?",
                options: ["50", "150", "300"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "How many suckers per arm does an octopus have?",
                options: ["50", "240", "1,000"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "How do tortoises regulate temperature?",
                options: ["Can't", "Behavioral thermoregulation", "Sweating"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How many times can a skunk spray in succession?",
                options: ["1-2", "5-6", "Unlimited"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "What ecosystem role do beavers play?",
                options: ["Pest", "Keystone species", "Predator", "None"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "What pigment makes parrot feathers red?",
                options: ["Carotenoids", "Psittacofulvins", "Melanin", "None"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How do lobsters grow?",
                options: ["Continuously", "By molting", "Stop at maturity", "Seasonal"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "How many eyelids do iguanas have?",
                options: ["2", "3", "4", "1"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How long can a queen ant live?",
                options: ["1 year", "5 years", "15 years", "30 years"],
                correct: 3
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How many hours do sloths sleep daily?",
                options: ["8 hours", "15 hours", "20 hours", "22 hours"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How are peacock colors produced?",
                options: ["Pigments", "Diet", "Structural coloration", "Minerals"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How many arms can an octopus regenerate?",
                options: ["None", "One", "Multiple", "All"],
                correct: 3
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How many bones in a tortoise shell?",
                options: ["10", "30", "50+", "100+"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "What compound makes skunk spray so potent?",
                options: ["Ammonia", "Thiols", "Sulfuric acid", "Pheromones"],
                correct: 1
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "What is the longest beaver dam ever recorded?",
                answer: "2,790 feet or 850 meters"
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "What is the vocabulary record for an African Grey parrot?",
                answer: "Over 1,000 words"
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "What is the heaviest lobster ever caught?",
                answer: "44 pounds or 20 kg"
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How deep can marine iguanas dive?",
                answer: "30 feet or 9 meters"
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "What is the estimated total ant population on Earth?",
                answer: "20 quadrillion"
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How long does it take a sloth to digest food?",
                answer: "30 days or about a month"
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "How many eye-spots on a peacock's tail?",
                answer: "150-200"
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How fast can an octopus change color?",
                answer: "0.3 seconds or under 1 second"
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "What is the oldest tortoise age recorded?",
                answer: "190 years"
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How far can skunk smell be detected?",
                answer: "1 mile or 1.6 km"
            }
        ]
    },
    12: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "Wolves are pack animals.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Swans can be aggressive.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "Seals can sleep underwater.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "Some snakes can fly.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "Butterflies migrate long distances.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "Bears eat both plants and meat.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "Flamingos filter feed.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "Dolphins are mammals.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "Monitor lizards are carnivores.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "Kangaroos are marsupials.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How long can seals hold their breath?",
                options: ["10 minutes", "2 hours"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "Can swans break bones with their wings?",
                options: ["Yes, can", "No, myth"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How do seals sleep underwater?",
                options: ["Can't", "Half brain at a time"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "How do flying snakes glide?",
                options: ["Wings", "Flattening body"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "Which butterfly migrates the farthest?",
                options: ["Swallowtail", "Monarch"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "What do bears eat most?",
                options: ["Meat", "Plants and berries"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "What do flamingos filter for?",
                options: ["Fish", "Algae and shrimp"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How are dolphin calves born?",
                options: ["Head first", "Tail first"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How do monitor lizards hunt?",
                options: ["Ambush", "Active pursuit"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "Where do joeys develop?",
                options: ["In pouch", "In womb"],
                correct: 0
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How far can wolves communicate by howling?",
                options: ["1 mile", "6-10 miles", "20 miles"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "How many bones in a swan's neck?",
                options: ["7", "14", "25"],
                correct: 2
            },
            {

                topic: "Marine Life",

                emoji: "🐬🐳",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How far can flying snakes glide?",
                options: ["10 feet", "50 feet", "100+ feet"],
                correct: 2
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How far do monarchs migrate?",
                options: ["500 miles", "1,500 miles", "3,000 miles"],
                correct: 2
            },
            {

                topic: "Mammals",

                emoji: "🦁🐯",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Birds",


                emoji: "🐧🦆",


                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0


            },


            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "What frequency can dolphins hear?",
                options: ["20 kHz", "150 kHz", "300 kHz"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "How long can Komodo monitors grow?",
                options: ["4 feet", "7 feet", "10 feet"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How long does a joey stay in pouch?",
                options: ["2 months", "6-9 months", "2 years"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How powerful is a wolf's sense of smell?",
                options: ["10x humans", "100x humans", "1,000x humans", "Same"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "How long do swans mate for?",
                options: ["Season", "Year", "Life", "Never pair"],
                correct: 2
            },
            {

                topic: "Marine Life",

                emoji: "🐙🦑",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "What genus are flying snakes?",
                options: ["Python", "Chrysopelea", "Cobra", "Viper"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How do monarchs navigate?",
                options: ["Random", "Sun compass and magnetic sense", "Following others", "Memory"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What happens to bear heart rate during hibernation?",
                options: ["Stops", "Slows to 8 bpm", "Increases", "Stays same"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How many eyelids do flamingos have?",
                options: ["1", "2", "3", "4"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "What is unique about dolphin sleep?",
                options: ["Don't sleep", "Unihemispheric", "Sleep fully", "Sleep-swim"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "What do Komodo dragons use to kill prey?",
                options: ["Crushing", "Venom", "Speed", "Claws"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "What enables kangaroo hopping?",
                options: ["Strong muscles", "Elastic tendons", "Hollow bones", "Long tail"],
                correct: 1
            }
        ],
        extreme: [
            {

                topic: "Mammals",

                emoji: "🦭🦦",

                question: "What makes a mammal unique?",
                answer: "Hair and milk production"

            },

            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "How many feathers does a swan have?",
                answer: "25,000"
            },
            {

                topic: "Marine Life",

                emoji: "🦎🐉",

                question: "How do fish breathe?",
                answer: "Through gills"

            },

            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "What is a flying snake's glide speed?",
                answer: "25 mph or 40 km/h"
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How many generations does monarch migration take?",
                answer: "4 generations"
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How many calories does a bear eat before hibernation?",
                answer: "20,000 per day"
            },
            {

                topic: "Birds",

                emoji: "🐑🐐",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How many different whistle sounds can dolphins make?",
                answer: "Over 100"
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How much can a Komodo dragon weigh?",
                answer: "300 pounds or 136 kg"
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How many quills does a porcupine have?",
                answer: "30,000"
            }
        ]
    },
    13: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "Elephants have excellent memory.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Ducks have webbed feet.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "All sharks are dangerous.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "Sea turtles cry salt tears.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "Bees dance to communicate.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "Giraffes have long necks.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "Owls can rotate heads very far.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Octopuses have beaks.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐍🐢",
                question: "Crocodiles are reptiles.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "Cheetahs are the fastest land animals.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How long can elephants remember?",
                options: ["Days", "Decades"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Why do ducks have webbed feet?",
                options: ["Fashion", "Swimming efficiency"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "What do most sharks eat?",
                options: ["Humans", "Fish and seals"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "Why do sea turtles excrete salt?",
                options: ["Waste", "Regulate salt balance"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "What does the waggle dance tell bees?",
                options: ["Danger", "Food location"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How many neck bones do giraffes have?",
                options: ["14", "7"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How far can owls rotate heads?",
                options: ["180°", "270°"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "Where is an octopus's beak located?",
                options: ["Center of arms", "Head"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "Can crocodiles see well at night?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How slowly do sloths digest food?",
                options: ["1 day", "1 week", "1 month"],
                correct: 2
            }
        ],
        hard: [
            {

                topic: "Mammals",

                emoji: "🦭🦦",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "How fast can ducks fly?",
                options: ["30 mph", "60 mph", "90 mph"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How many pups can a shark have?",
                options: ["1-2", "10-80", "200+"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "How deep can sea turtles dive?",
                options: ["100 feet", "1,000 feet", "4,000 feet"],
                correct: 2
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How many flowers must bees visit for 1 lb honey?",
                options: ["10,000", "2 million", "10 million"],
                correct: 1
            },
            {

                topic: "Mammals",

                emoji: "🐃🐄",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Birds",


                emoji: "🐑🐐",


                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0


            },


            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "How strong is octopus suction per sucker?",
                options: ["1 lb", "35 lbs", "100 lbs"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How long can crocodiles stay underwater?",
                options: ["10 minutes", "1 hour", "2+ hours"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How many quills can a porcupine have?",
                options: ["1,000", "10,000", "30,000"],
                correct: 2
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "What is unique about elephant brains?",
                options: ["Small", "Largest land animal brain", "No wrinkles", "Two brains"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "What makes duck bones special?",
                options: ["Solid", "Hollow for buoyancy", "Very heavy", "Made of cartilage"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "What is shark skeleton made of?",
                options: ["Bone", "Cartilage", "Chitin", "Keratin"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "How do sea turtles excrete excess salt?",
                options: ["Kidneys", "Gills", "Salt glands near eyes", "Skin"],
                correct: 2
            },
            {

                topic: "Insects",

                emoji: "🐝🦋",

                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0

            },

            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How many vertebrae in giraffe neck?",
                options: ["7", "14", "21", "28"],
                correct: 0
            },
            {

                topic: "Birds",

                emoji: "🐧🦆",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Why is octopus blood blue?",
                options: ["Cold water", "Copper-based hemocyanin", "Diet", "Genetics"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "How do crocodiles regulate temperature?",
                options: ["Sweating", "Panting", "Behavioral thermoregulation", "Shivering"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "What enables cheetah speed?",
                options: ["Large lungs", "Flexible spine", "Long legs", "All of these"],
                correct: 3
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How much does an elephant brain weigh?",
                answer: "11 pounds or 5 kg"
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "What is the fastest duck flight speed?",
                answer: "60 mph or 97 km/h"
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How many tentacles does a squid have?",
                answer: "10 or Ten"
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "What is the largest lizard species?",
                answer: "Komodo dragon"
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How many flowers for 1 pound of honey?",
                answer: "2 million"
            },
            {

                topic: "Mammals",

                emoji: "🐵🦍",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Birds",


                emoji: "🦩🦚",


                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0


            },


            {



                topic: "Marine Life",



                emoji: "🐠🐟",



                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0



            },



            {




                topic: "Amphibians",




                emoji: "🦂🕷️",




                question: "Can amphibians live in water?",
                options: ["Yes", "No"],
                correct: 0




            },




            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "Sample question about mammals?",
                options: ["Yes", "No"],
                correct: 0
            }
        ]
    },


    14: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "Deer shed their antlers annually.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Owls are birds of prey.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "Octopuses can squeeze through small spaces.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "Geckos can climb glass.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "Bees communicate through dance.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "Otters use tools.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "Penguins can hold their breath.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐠🐟",
                question: "Sharks can sense electricity.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "Snakes can dislocate jaws.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "Bears can climb trees.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "Why do male deer shed antlers?",
                options: ["Hormonal cycle", "Broken"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "What do owls regurgitate?",
                options: ["Pellets", "Seeds"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "Do octopuses have bones?",
                options: ["No", "Yes"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "What helps geckos climb?",
                options: ["Tiny hairs", "Suction"],
                correct: 0
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "What dance do bees perform?",
                options: ["Waggle dance", "Circle dance"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "What do otters use as tools?",
                options: ["Rocks", "Sticks"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How long can penguins hold breath?",
                options: ["20 minutes", "5 minutes"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "What can sharks sense in water?",
                options: ["Electric fields", "Sound only"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "Do snakes unhinge their jaws?",
                options: ["No, ligaments stretch", "Yes"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "Which bears climb best?",
                options: ["Black bears", "Grizzlies"],
                correct: 0
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "When do deer antlers fall off?",
                options: ["Winter", "Spring", "Summer"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "How many degrees can owls rotate heads?",
                options: ["270", "180", "360"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How many hearts do octopuses have?",
                options: ["3", "2", "4"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "What are gecko toe pads called?",
                options: ["Lamellae", "Setae", "Spatulae"],
                correct: 0
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "What direction indicates food distance?",
                options: ["Dance angle", "Speed", "Duration"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "What shellfish do otters eat?",
                options: ["Sea urchins", "Crabs", "Clams"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐼🐨",
                question: "What's the deepest penguin dive?",
                options: ["1,850 feet", "500 feet", "3,000 feet"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🦒🦓",
                question: "What are shark electroreceptors called?",
                options: ["Ampullae of Lorenzini", "Lateral line", "Barbels"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐧🦆",
                question: "How do snakes detect chemicals?",
                options: ["Jacobson's organ", "Nostrils", "Skin"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦋🐛",
                question: "What bear species climbs most?",
                options: ["Asian black bear", "Sun bear", "Sloth bear"],
                correct: 0
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🐝🐜",
                question: "What hormone triggers antler shedding?",
                options: ["Testosterone drop", "Estrogen", "Cortisol", "Melatonin"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦈🐙",
                question: "How many neck vertebrae do owls have?",
                options: ["14", "7", "20", "10"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐢🐊",
                question: "Where are octopus neurons located?",
                options: ["2/3 in arms", "All in brain", "Half in arms", "1/3 in arms"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦎🐍",
                question: "How many setae per gecko toe?",
                options: ["Millions", "Thousands", "Hundreds", "Billions"],
                correct: 0
            },
            {
                topic: "Insects",
                emoji: "🦉🦇",
                question: "Who discovered the waggle dance?",
                options: ["Karl von Frisch", "Charles Darwin", "E.O. Wilson", "Jane Goodall"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐺🦊",
                question: "What's the scientific name for sea otter?",
                options: ["Enhydra lutris", "Lutra lutra", "Lontra canadensis", "Aonyx capensis"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐵🦍",
                question: "Which penguin dives deepest?",
                options: ["Emperor", "King", "Gentoo", "Adelie"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🦩🦚",
                question: "What phylum are sharks in?",
                options: ["Chordata", "Arthropoda", "Mollusca", "Echinodermata"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐠🐟",
                question: "What class are snakes in?",
                options: ["Reptilia", "Amphibia", "Mammalia", "Aves"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦂🕷️",
                question: "What's a bear's climbing speed?",
                options: ["100 feet/minute", "50 feet/minute", "200 feet/minute", "25 feet/minute"],
                correct: 0
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "What is the antler growth rate per day?",
                answer: "1 inch or 2.5 cm"
            },
            {
                topic: "Birds",
                emoji: "🦭🦦",
                question: "What is the owl's asymmetric ear adaptation?",
                answer: "Sound localization"
            },
            {
                topic: "Marine Life",
                emoji: "🐆🐅",
                question: "How many suckers does a giant Pacific octopus have?",
                answer: "2,000 or about 2,000"
            },
            {
                topic: "Reptiles",
                emoji: "🦎🐉",
                question: "What force do gecko setae use?",
                answer: "Van der Waals forces"
            },
            {
                topic: "Insects",
                emoji: "🐋🐚",
                question: "What is the waggle dance discovery year?",
                answer: "1967 or 1973"
            },
            {
                topic: "Mammals",
                emoji: "🦜🦢",
                question: "How many calories do sea otters eat daily?",
                answer: "25% of body weight"
            },
            {
                topic: "Birds",
                emoji: "🐃🐄",
                question: "What is the Emperor penguin's scientific name?",
                answer: "Aptenodytes forsteri"
            },
            {
                topic: "Marine Life",
                emoji: "🐑🐐",
                question: "What is a shark's sixth sense called?",
                answer: "Electroreception"
            },
            {
                topic: "Reptiles",
                emoji: "🐪🦙",
                question: "What protein makes up snake scales?",
                answer: "Keratin or Beta-keratin"
            },
            {
                topic: "Mammals",
                emoji: "🦡🦫",
                question: "What's the bear's taxonomic family?",
                answer: "Ursidae"
            }
        ]
    },
    15: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "Polar bears have white fur.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Eagles have sharp talons.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "Sharks must keep swimming to breathe.",
                options: ["Some must", "All must"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "Turtles can live without their shells.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "Butterflies taste with their feet.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "Kangaroos can hop backwards.",
                options: ["False", "True"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "Parrots are social birds.",
                options: ["True", "False"],
                correct: 1
            },
            {

                topic: "Marine Life",

                emoji: "🐠🐟",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "Chameleons change color.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "All bats drink blood.",
                options: ["False", "True"],
                correct: 0
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "What color is polar bear fur?",
                options: ["White", "Transparent"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "How strong is an eagle's grip?",
                options: ["50 PSI", "400 PSI"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How do some sharks sleep?",
                options: ["Can't sleep", "Keep moving"],
                correct: 1
            },
            {

                topic: "Reptiles",

                emoji: "🐋🐚",

                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Insects",


                emoji: "🦜🦢",


                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0


            },


            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How do kangaroos move slowly?",
                options: ["Hop slowly", "Walk with tail"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "Do parrots mate for life?",
                options: ["Usually yes", "No"],
                correct: 0
            },
            {

                topic: "Marine Life",

                emoji: "🐪🦙",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Amphibians",


                emoji: "🦡🦫",


                question: "Can amphibians live in water?",
                options: ["Yes", "No"],
                correct: 0


            },


            {
                topic: "Mammals",
                emoji: "🦨🦔",
        }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "How far can polar bears swim?",
                options: ["10 miles", "60 miles", "400+ miles"],
                correct: 2
            },
            {

                topic: "Birds",

                emoji: "🦅🦜",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {


                topic: "Marine Life",


                emoji: "🐬🐳",


                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0


            },


            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "What is the oldest turtle age?",
                options: ["100 years", "190 years", "300 years"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How fast can butterflies fly?",
                options: ["5 mph", "12 mph", "30 mph"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "What force can a kangaroo kick generate?",
                options: ["300 PSI", "850 PSI", "1,500 PSI"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "How many parrot species exist?",
                options: ["100", "400", "800"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "How many neurons in octopus arms?",
                options: ["10 million", "100 million", "300 million"],
                correct: 2
            },
            {

                topic: "Amphibians",

                emoji: "🐍🐢",

                question: "Can amphibians live in water?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How many vampire bat species exist?",
                options: ["1", "3", "10"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "How many teeth do polar bears have?",
                options: ["20", "32", "42", "50"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "What percentage of eagle body is skeleton?",
                options: ["25%", "15%", "5-6%", "35%"],
                correct: 2
            },
            {

                topic: "Marine Life",

                emoji: "🐙🦑",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "How many bones in a turtle shell?",
                options: ["10", "30", "50+", "100"],
                correct: 2
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "How many eyes does a butterfly have?",
                options: ["2", "6", "12,000", "100"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What makes kangaroo hopping efficient?",
                options: ["Muscles", "Elastic tendons", "Bones", "Tail"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "Can parrots pass mirror test?",
                options: ["No", "Some species", "All species", "Unknown"],
                correct: 1
            },
            {

                topic: "Marine Life",

                emoji: "🐠🐟",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "What cells enable chameleon color change?",
                options: ["Melanocytes", "Chromatophores", "Keratinocytes", "Fibroblasts"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How loud is a bat's echolocation?",
                options: ["20 dB", "60 dB", "140 dB", "200 dB"],
                correct: 2
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "How much can a polar bear weigh?",
                answer: "1,500 pounds or 680 kg"
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "What is the fastest bird in level flight?",
                answer: "Common swift at 70 mph"
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "How many hearts does a cuttlefish have?",
                answer: "3 or Three"
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "How long can an anaconda grow?",
                answer: "30 feet or 9 meters"
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "How many ants are there per human on Earth?",
                answer: "1.6 million"
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How fast can a polar bear swim?",
                answer: "6 mph or 10 km/h"
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "How many times per second does a hummingbird's heart beat?",
                answer: "20 beats per second or 1,200 bpm"
            },
            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "What is the heaviest marine mammal?",
                answer: "Blue whale at 200 tons"
            },
            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "How many degrees can chameleon eyes rotate?",
                answer: "360 degrees independently"
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "How far can a hedgehog travel in one night?",
                answer: "2 miles or 3 km"
            }
        ]
    },
        16: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "Gorillas are mostly peaceful.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Birds have feathers.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "Seals are mammals.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "Alligators live in freshwater.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "Ants are social insects.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "Wolves howl to communicate.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐧🦆",
                question: "Flamingos are born gray.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "Lobsters can live 100+ years.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐍🐢",
                question: "Pythons are constrictors.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "Foxes are members of the dog family.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {

                topic: "Mammals",

                emoji: "🦒🦓",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Why do birds have feathers?",
                options: ["Beauty", "Flight and insulation"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "How do seals sleep?",
                options: ["Can't sleep", "Half brain at a time"],
                correct: 1
            },
            {

                topic: "Reptiles",

                emoji: "🦘🦌",

                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Insects",


                emoji: "🐺🦊",


                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0


            },


            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "Why do wolves howl?",
                options: ["Fun", "Communication"],
                correct: 1
            },
            {

                topic: "Birds",

                emoji: "🦩🦚",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {


                topic: "Marine Life",


                emoji: "🐠🐟",


                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0


            },


            {
                topic: "Reptiles",
                emoji: "🦂🕷️",
                question: "How do pythons kill prey?",
                options: ["Venom", "Constriction"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "Are foxes solitary or social?",
                options: ["Mostly solitary", "Always pack"],
                correct: 0
            }
        ],
        hard: [
            {

                topic: "Mammals",

                emoji: "🦭🦦",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Birds",


                emoji: "🐆🐅",


                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0


            },


            {



                topic: "Marine Life",



                emoji: "🦎🐉",



                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0



            },



            {




                topic: "Reptiles",




                emoji: "🐋🐚",




                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0




            },




            {





                topic: "Insects",





                emoji: "🦜🦢",





                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0





            },





            {






                topic: "Mammals",






                emoji: "🐃🐄",






                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0






            },






            {







                topic: "Birds",







                emoji: "🐑🐐",







                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0







            },







            {








                topic: "Marine Life",








                emoji: "🐪🦙",








                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0








            },








            {









                topic: "Reptiles",









                emoji: "🦡🦫",









                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0









            },









            {
                topic: "Mammals",
                emoji: "🦨🦔",
        }
        ],
        expert: [
            {

                topic: "Mammals",

                emoji: "🐘🦏",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Birds",


                emoji: "🦅🦜",


                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0


            },


            {



                topic: "Marine Life",



                emoji: "🐬🐳",



                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0



            },



            {




                topic: "Reptiles",




                emoji: "🐊🦎",




                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0




            },




            {





                topic: "Insects",





                emoji: "🐝🦋",





                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0





            },





            {






                topic: "Mammals",






                emoji: "🦁🐯",






                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0






            },






            {







                topic: "Birds",







                emoji: "🐧🦆",







                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0







            },







            {








                topic: "Marine Life",








                emoji: "🦈🐡",








                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0








            },








            {









                topic: "Reptiles",









                emoji: "🐍🐢",









                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0









            },









            {
                topic: "Mammals",
                emoji: "🐻🐼",
        }
        ],
        extreme: [
            {

                topic: "Mammals",

                emoji: "🦒🦓",

                question: "What makes a mammal unique?",
                answer: "Hair and milk production"

            },

            {


                topic: "Birds",


                emoji: "🦉🦇",


                question: "What are bird feathers made of?",
                answer: "Keratin"


            },


            {



                topic: "Marine Life",



                emoji: "🐙🦑",



                question: "How do fish breathe?",
                answer: "Through gills"



            },



            {




                topic: "Reptiles",




                emoji: "🦘🦌",




                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0




            },




            {





                topic: "Insects",





                emoji: "🐺🦊",





                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0





            },





            {






                topic: "Mammals",






                emoji: "🐵🦍",






                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0






            },






            {







                topic: "Birds",







                emoji: "🦩🦚",







                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0







            },







            {








                topic: "Marine Life",








                emoji: "🐠🐟",








                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0








            },








            {









                topic: "Reptiles",









                emoji: "🦂🕷️",









                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0









            },









            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "Sample question about mammals?",
                options: ["Yes", "No"],
                correct: 0
            }
        ]
    },

    17: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "Mice have excellent hearing.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "Parrots are intelligent birds.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "Fish breathe through gills.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐋🐚",
                question: "Komodo dragons are venomous.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦜🦢",
                question: "Male crickets chirp to attract mates.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "Squirrels bury nuts for winter.",
                options: ["True", "False"],
                correct: 0
            },
            {

                topic: "Birds",

                emoji: "🐑🐐",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {
                topic: "Marine Life",
                emoji: "🐪🦙",
                question: "Crabs can walk forward.",
                options: ["False", "True"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦡🦫",
                question: "Tortoises are slow movers.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "Badgers are nocturnal.",
                options: ["True", "False"],
                correct: 0
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🐘🦏",
                question: "What frequency can mice hear?",
                options: ["Up to 20 kHz", "Up to 90 kHz"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦅🦜",
                question: "Can parrots solve puzzles?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "Do fish drink water?",
                options: ["Saltwater fish do", "No"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐊🦎",
                question: "Where is Komodo dragon venom located?",
                options: ["Saliva glands", "Lower jaw"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "What affects cricket chirp rate?",
                options: ["Mood", "Temperature"],
                correct: 1
            },
            {

                topic: "Mammals",

                emoji: "🦁🐯",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Birds",


                emoji: "🐧🦆",


                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0


            },


            {



                topic: "Marine Life",



                emoji: "🦈🐡",



                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0



            },



            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "What is a tortoise's top speed?",
                options: ["0.3 mph", "5 mph"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "What are badger homes called?",
                options: ["Dens", "Setts"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "What is a mouse's heart rate?",
                options: ["100 bpm", "300 bpm", "600 bpm"],
                correct: 2
            },
            {

                topic: "Birds",

                emoji: "🦉🦇",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "Can fish see in color?",
                options: ["No", "Some can", "All can"],
                correct: 2
            },
            {

                topic: "Reptiles",

                emoji: "🦘🦌",

                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Insects",


                emoji: "🐺🦊",


                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0


            },


            {



                topic: "Mammals",



                emoji: "🐵🦍",



                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0



            },



            {
                topic: "Birds",
                emoji: "🦩🦚",
                question: "How fast can ducks swim?",
                options: ["2 mph", "5 mph", "8 mph"],
                correct: 1
            },
            {

                topic: "Marine Life",

                emoji: "🐠🐟",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Amphibians",
                emoji: "🦂🕷️",
                question: "How long can tortoises live?",
                options: ["50 years", "100 years", "150+ years"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐨🦥",
                question: "How strong is a badger's bite?",
                options: ["100 PSI", "300 PSI", "500 PSI"],
                correct: 1
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦭🦦",
                question: "What DNA percentage do humans share with mice?",
                options: ["50%", "70%", "85%", "98%"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐆🐅",
                question: "What is unique about parrot bonding?",
                options: ["None", "Mate for life", "Change yearly", "No bonds"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦎🐉",
                question: "Do fish sleep?",
                options: ["No", "Yes, with eyes open", "Only at night", "Never"],
                correct: 1
            },
            {

                topic: "Reptiles",

                emoji: "🐋🐚",

                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Insects",


                emoji: "🦜🦢",


                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0


            },


            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How fast do squirrel teeth grow yearly?",
                options: ["1 inch", "3 inches", "6 inches", "12 inches"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐑🐐",
                question: "What type of sleep do ducks have?",
                options: ["Normal", "Unihemispheric", "None", "Constant"],
                correct: 1
            },
            {

                topic: "Marine Life",

                emoji: "🐪🦙",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Amphibians",
                emoji: "🦡🦫",
                question: "Do tortoises have good memory?",
                options: ["No", "Yes, excellent", "Average", "Unknown"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦨🦔",
                question: "What family do badgers belong to?",
                options: ["Canidae", "Felidae", "Mustelidae", "Ursidae"],
                correct: 2
            }
        ],
        extreme: [
            {

                topic: "Mammals",

                emoji: "🐘🦏",

                question: "What makes a mammal unique?",
                answer: "Hair and milk production"

            },

            {


                topic: "Birds",


                emoji: "🦅🦜",


                question: "What are bird feathers made of?",
                answer: "Keratin"


            },


            {
                topic: "Marine Life",
                emoji: "🐬🐳",
                question: "How many fish species exist?",
                answer: "35,000 or over 35,000"
            },
            {

                topic: "Reptiles",

                emoji: "🐊🦎",

                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Insects",
                emoji: "🐝🦋",
                question: "How many cricket species exist?",
                answer: "Over 900"
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "What is a squirrel's heart rate?",
                answer: "300-400 bpm"
            },
            {

                topic: "Birds",

                emoji: "🐧🦆",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {
                topic: "Marine Life",
                emoji: "🦈🐡",
                question: "What is the leg span of Japanese spider crab?",
                answer: "12 feet or 3.7 meters"
            },
            {
                topic: "Amphibians",
                emoji: "🐍🐢",
                question: "How much can a Galapagos tortoise weigh?",
                answer: "900 pounds or 410 kg"
            },
            {
                topic: "Mammals",
                emoji: "🐻🐼",
                question: "How fast can a badger run?",
                answer: "19 mph or 30 km/h"
            }
        ]
    },
    18: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦒🦓",
                question: "Deer shed their antlers annually.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦉🦇",
                question: "Owls are birds of prey.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐙🦑",
                question: "Octopuses can squeeze through small spaces.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦘🦌",
                question: "Geckos can climb glass.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐺🦊",
                question: "Bees communicate through dance.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "Otters use rocks as tools.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦩🦚",
                question: "How many hours do pandas eat daily?",
                options: ["4 hours", "12-16 hours", "24 hours"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐠🐟",
                question: "What is unihemispheric sleep?",
                options: ["Light sleep", "Half brain sleeps", "No sleep"],
                correct: 1
            },
            {

                topic: "Marine Life",

                emoji: "🦂🕷️",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Reptiles",
                emoji: "🐨🦥",
                question: "What cells enable color change?",
                options: ["Melanocytes", "Chromatophores", "Keratinocytes"],
                correct: 0
            },
            {
                topic: "Insects",
                emoji: "🦭🦦",
                question: "How many deaths do mosquitoes cause yearly?",
                options: ["10,000", "100,000", "700,000+"],
                correct: 0
            },
            {

                topic: "Mammals",

                emoji: "🐆🐅",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Birds",
                emoji: "🦎🐉",
                question: "What percentage is eagle skeleton of body?",
                options: ["25%", "15%", "5-6%"],
                correct: 1
            },
            {

                topic: "Marine Life",

                emoji: "🐋🐚",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Amphibians",


                emoji: "🦜🦢",


                question: "Can amphibians live in water?",
                options: ["Yes", "No"],
                correct: 0


            },


            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How many trees can a beaver cut yearly?",
                options: ["50", "200", "500"],
                correct: 0
            }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🐑🐐",
                question: "What digestive system do pandas have?",
                options: ["Herbivore", "Carnivore", "Omnivore", "None"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐪🦙",
                question: "Which hemisphere sleeps in ducks?",
                options: ["Both", "Alternates", "Left only", "Right only"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🦡🦫",
                question: "How far can blue whale calls travel?",
                options: ["10 miles", "100 miles", "1,000 miles", "5,000 miles"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦨🦔",
                question: "Can chameleons see in two directions?",
                options: ["No", "Yes, independently", "Only forward", "Only backward"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐘🦏",
                question: "What disease kills the most via mosquitoes?",
                options: ["Dengue", "Malaria", "Zika", "Yellow fever"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦅🦜",
                question: "How big is a newborn joey?",
                options: ["1 inch", "6 inches", "1 foot", "2 feet"],
                correct: 1
            },
            {

                topic: "Birds",

                emoji: "🐬🐳",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {


                topic: "Marine Life",


                emoji: "🐊🦎",


                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0


            },


            {



                topic: "Amphibians",



                emoji: "🐝🦋",



                question: "Can amphibians live in water?",
                options: ["Yes", "No"],
                correct: 0



            },



            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How long can beavers hold breath?",
                options: ["2 min", "5 min", "15 min", "30 min"],
                correct: 0
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🐧🦆",
                question: "How much does an adult panda weigh?",
                answer: "220-330 pounds or 100-150 kg"
            },
            {

                topic: "Birds",

                emoji: "🦈🐡",

                question: "What are bird feathers made of?",
                answer: "Keratin"

            },

            {
                topic: "Marine Life",
                emoji: "🐍🐢",
                question: "What is the longest blue whale recorded?",
                answer: "110 feet or 33.5 meters"
            },
            {
                topic: "Reptiles",
                emoji: "🐻🐼",
                question: "How long is a chameleon's tongue compared to body?",
                answer: "1.5-2 times body length"
            },
            {
                topic: "Insects",
                emoji: "🦒🦓",
                question: "How many times per second do mosquito wings beat?",
                answer: "300-600 times"
            },
            {

                topic: "Mammals",

                emoji: "🦉🦇",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Birds",


                emoji: "🐙🦑",


                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0


            },


            {
                topic: "Marine Life",
                emoji: "🦘🦌",
                question: "What is the longest giant squid recorded?",
                answer: "43 feet or 13 meters"
            },
            {
                topic: "Amphibians",
                emoji: "🐺🦊",
                question: "What is the oldest sea turtle recorded?",
                answer: "Over 100 years"
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "What is the longest beaver dam?",
                answer: "2,790 feet or 850 meters"
            }
        ]
    },
    19: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🐑🐐",
                question: "Tigers are the largest cats.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐪🦙",
                question: "Eagles build large nests.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦡🦫",
                question: "Whales sing songs.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦨🦔",
                question: "Crocodiles can live in both fresh and salt water.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐘🦏",
                question: "Mosquitoes are attracted to carbon dioxide.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦅🦜",
                question: "Lions live in groups called prides.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐬🐳",
                question: "Some parrots can live 80+ years.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐊🦎",
                question: "Squids have the largest eyes in the animal kingdom.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐝🦋",
                question: "Anacondas are the heaviest snakes.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "Kangaroos are native to Australia.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {
                topic: "Mammals",
                emoji: "🐧🦆",
                question: "How much can a tiger weigh?",
                options: ["200 lbs", "600 lbs"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🦈🐡",
                question: "How heavy can eagle nests become?",
                options: ["50 lbs", "2,000 lbs"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐍🐢",
                question: "Why do whales sing?",
                options: ["Fun", "Communication and mating"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐻🐼",
                question: "Which crocodile lives in saltwater?",
                options: ["American", "Saltwater crocodile"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦒🦓",
                question: "What else attracts mosquitoes?",
                options: ["Light", "Body heat and odor"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦉🦇",
                question: "Who leads a lion pride?",
                options: ["Male", "Female"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐙🦑",
                question: "Can parrots recognize themselves in mirrors?",
                options: ["Some can", "No"],
                correct: 0
            },
            {
                topic: "Marine Life",
                emoji: "🦘🦌",
                question: "How large can giant squid eyes be?",
                options: ["5 inches", "10 inches"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐺🦊",
                question: "Can anacondas swim?",
                options: ["Yes, very well", "No"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How do kangaroos move efficiently?",
                options: ["Hopping", "Running"],
                correct: 0
            }
        ],
        hard: [
            {

                topic: "Mammals",

                emoji: "🦩🦚",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Birds",
                emoji: "🐠🐟",
                question: "How wide can eagle nests be?",
                options: ["3 feet", "6 feet", "10 feet"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦂🕷️",
                question: "How far can whale songs travel?",
                options: ["10 miles", "100 miles", "1,000+ miles"],
                correct: 2
            },
            {

                topic: "Reptiles",

                emoji: "🐨🦥",

                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Insects",
                emoji: "🦭🦦",
                question: "How many people do mosquitoes kill yearly?",
                options: ["10,000", "100,000", "700,000+"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐆🐅",
                question: "How far can a lion's roar be heard?",
                options: ["1 mile", "5 miles", "10 miles"],
                correct: 1
            },
            {

                topic: "Birds",

                emoji: "🦎🐉",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {
                topic: "Marine Life",
                emoji: "🐋🐚",
                question: "How long can giant squids grow?",
                options: ["20 feet", "43 feet", "80 feet"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦜🦢",
                question: "How much can an anaconda weigh?",
                options: ["100 lbs", "300 lbs", "550 lbs"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
        }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🐑🐐",
                question: "Can tigers swim long distances?",
                options: ["No", "Yes, up to 15 miles", "Only short", "Never"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐪🦙",
                question: "How many eaglets typically survive per nest?",
                options: ["All", "Usually one", "Two", "None"],
                correct: 1
            },
            {

                topic: "Marine Life",

                emoji: "🦡🦫",

                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Reptiles",
                emoji: "🦨🦔",
                question: "How many bones in a crocodile's body?",
                options: ["100", "200", "300", "400"],
                correct: 2
            },
            {
                topic: "Insects",
                emoji: "🐘🦏",
                question: "What is the deadliest animal to humans?",
                options: ["Sharks", "Mosquitoes", "Snakes", "Lions"],
                correct: 1
            },
            {

                topic: "Mammals",

                emoji: "🦅🦜",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Birds",
                emoji: "🐬🐳",
                question: "What makes parrots so intelligent?",
                options: ["Large brain", "Brain-to-body ratio similar to primates", "Many neurons", "Social behavior"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐊🦎",
                question: "What does a squid use its beak for?",
                options: ["Defense", "Crushing prey", "Grooming", "Communication"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🐝🦋",
                question: "What is the longest anaconda recorded?",
                options: ["15 feet", "25 feet", "33 feet", "50 feet"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "What makes kangaroo hopping so efficient?",
                options: ["Strong muscles", "Elastic tendons store energy", "Light bones", "Long tail"],
                correct: 1
            }
        ],
        extreme: [
            {

                topic: "Mammals",

                emoji: "🐧🦆",

                question: "What makes a mammal unique?",
                answer: "Hair and milk production"

            },

            {
                topic: "Birds",
                emoji: "🦈🐡",
                question: "What is the largest eagle nest ever recorded?",
                answer: "9.5 feet wide, 20 feet deep"
            },
            {
                topic: "Marine Life",
                emoji: "🐍🐢",
                question: "What is the longest blue whale ever measured?",
                answer: "110 feet or 33.5 meters"
            },
            {

                topic: "Reptiles",

                emoji: "🐻🐼",

                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {


                topic: "Insects",


                emoji: "🦒🦓",


                question: "How many legs do insects have?",
                options: ["6", "8"],
                correct: 0


            },


            {



                topic: "Mammals",



                emoji: "🦉🦇",



                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0



            },



            {




                topic: "Birds",




                emoji: "🐙🦑",




                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0




            },




            {





                topic: "Marine Life",





                emoji: "🦘🦌",





                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0





            },





            {
                topic: "Amphibians",
                emoji: "🐺🦊",
                question: "What is the heaviest anaconda recorded?",
                answer: "550 pounds or 250 kg"
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
                question: "How long can pandas live?",
                answer: "20-30 years in wild"
            }
        ]
    }
};

const chapter20 = {
    20: {
        easy: [
            {
                topic: "Mammals",
                emoji: "🦩🦚",
                question: "Pandas eat mainly bamboo.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🐠🐟",
                question: "Flamingos get their color from their diet.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦂🕷️",
                question: "Clownfish live in sea anemones.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🐨🦥",
                question: "Iguanas can swim.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦭🦦",
                question: "Butterflies only live a few weeks.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐆🐅",
                question: "Hippos can hold their breath underwater.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦎🐉",
                question: "Ducks are waterfowl.",
                options: ["True", "False"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐋🐚",
                question: "Crabs have hard shells.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦜🦢",
                question: "Sea turtles migrate long distances.",
                options: ["True", "False"],
                correct: 0
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "Elephants are the largest land animals.",
                options: ["True", "False"],
                correct: 1
            }
        ],
        medium: [
            {

                topic: "Mammals",

                emoji: "🐑🐐",

                question: "Are mammals warm-blooded?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Birds",
                emoji: "🐪🦙",
                question: "What pigment makes flamingos pink?",
                options: ["Melanin", "Carotenoids"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦡🦫",
                question: "How are clownfish protected from anemone stings?",
                options: ["Thick skin", "Mucus coating"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🦨🦔",
                question: "Which iguana species swims in the ocean?",
                options: ["Green iguana", "Marine iguana"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🐘🦏",
                question: "What do adult butterflies primarily eat?",
                options: ["Leaves", "Nectar"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🦅🦜",
                question: "How long can hippos hold their breath?",
                options: ["2 minutes", "5 minutes"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐬🐳",
                question: "What makes ducks buoyant?",
                options: ["Hollow bones", "Air sacs and waterproof feathers"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🐊🦎",
                question: "Why do crabs molt?",
                options: ["To reproduce", "To grow"],
                correct: 1
            },
            {

                topic: "Amphibians",

                emoji: "🐝🦋",

                question: "Can amphibians live in water?",
                options: ["Yes", "No"],
                correct: 0

            },

            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How many muscles are in an elephant's trunk?",
                options: ["100", "40,000+"],
                correct: 1
            }
        ],
        hard: [
            {
                topic: "Mammals",
                emoji: "🐧🦆",
                question: "How many hours do pandas spend eating?",
                options: ["4-6 hours", "12-16 hours", "20-24 hours"],
                correct: 1
            },
            {

                topic: "Birds",

                emoji: "🦈🐡",

                question: "Can all birds fly?",
                options: ["No", "Yes"],
                correct: 0

            },

            {


                topic: "Marine Life",


                emoji: "🐍🐢",


                question: "Do fish sleep?",
                options: ["Yes", "No"],
                correct: 0


            },


            {



                topic: "Reptiles",



                emoji: "🐻🐼",



                question: "Are reptiles cold-blooded?",
                options: ["Yes", "No"],
                correct: 0



            },



            {
                topic: "Insects",
                emoji: "🦒🦓",
                question: "How far can monarch butterflies migrate?",
                options: ["500 miles", "1,500 miles", "3,000+ miles"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🦉🦇",
                question: "How long are hippo canine teeth?",
                options: ["6 inches", "12 inches", "20 inches"],
                correct: 2
            },
            {
                topic: "Birds",
                emoji: "🐙🦑",
                question: "How do ducks sleep safely on water?",
                options: ["Don't sleep", "Unihemispheric sleep", "Float unconsciously"],
                correct: 1
            },
            {
                topic: "Marine Life",
                emoji: "🦘🦌",
                question: "How many legs do crabs have?",
                options: ["6", "8", "10"],
                correct: 2
            },
            {
                topic: "Amphibians",
                emoji: "🐺🦊",
                question: "How many eggs can a sea turtle lay at once?",
                options: ["10-20", "50-100", "100-200"],
                correct: 2
            },
            {
                topic: "Mammals",
                emoji: "🐵🦍",
        }
        ],
        expert: [
            {
                topic: "Mammals",
                emoji: "🦩🦚",
                question: "How many pandas are left in the wild?",
                options: ["500", "1,800", "5,000", "10,000"],
                correct: 1
            },
            {
                topic: "Birds",
                emoji: "🐠🐟",
                question: "How many flamingo species exist?",
                options: ["2", "4", "6", "10"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🦂🕷️",
                question: "What type of symbiosis do clownfish and anemones have?",
                options: ["Parasitism", "Mutualism", "Commensalism", "Competition"],
                correct: 1
            },
            {
                topic: "Reptiles",
                emoji: "🐨🦥",
                question: "How do marine iguanas warm up after diving?",
                options: ["Shivering", "Basking in sun", "Group huddles", "Internal heat"],
                correct: 1
            },
            {
                topic: "Insects",
                emoji: "🦭🦦",
                question: "How many lenses in a butterfly's compound eye?",
                options: ["100", "1,000", "6,000", "12,000"],
                correct: 3
            },
            {
                topic: "Mammals",
                emoji: "🐆🐅",
            
                question: "General animal question?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Birds",
                emoji: "🦎🐉",
                question: "Which brain hemisphere stays awake in ducks?",
                options: ["Left", "Right", "Alternates", "Both partially"],
                correct: 2
            },
            {
                topic: "Marine Life",
                emoji: "🐋🐚",
                question: "What color is crab blood?",
                options: ["Red", "Blue", "Green", "Clear"],
                correct: 1
            },
            {
                topic: "Amphibians",
                emoji: "🦜🦢",
                question: "What determines sea turtle egg gender?",
                options: ["Genetics", "Incubation temperature", "Location", "Time of year"],
                correct: 1
            },
            {
                topic: "Mammals",
                emoji: "🐃🐄",
                question: "How much does an elephant's brain weigh?",
                options: ["2 lbs", "5 lbs", "11 lbs", "20 lbs"],
                correct: 2
            }
        ],
        extreme: [
            {
                topic: "Mammals",
                emoji: "🐑🐐",
                question: "How much does an adult giant panda weigh?",
                answer: "220-330 pounds or 100-150 kg"
            },
            {
                topic: "Birds",
                emoji: "🐪🦙",
                question: "How many eye-spots does a peacock have on its train?",
                answer: "150-200"
            },
            {
                topic: "Marine Life",
                emoji: "🦡🦫",
            
                question: "General animal question?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Reptiles",
                emoji: "🦨🦔",
                question: "How long can marine iguanas stop their heartbeat?",
                answer: "Up to 45 minutes"
            },
            {
                topic: "Insects",
                emoji: "🐘🦏",
                question: "How many flowers does a butterfly visit per day?",
                answer: "Hundreds to thousands"
            },
            {
                topic: "Mammals",
                emoji: "🦅🦜",
                question: "How long can hippos stay underwater?",
                answer: "5 minutes or about 5 minutes"
            },
            {
                topic: "Birds",
                emoji: "🐬🐳",
                question: "How many feathers does a mallard duck have?",
                answer: "About 14,000"
            },
            {
                topic: "Marine Life",
                emoji: "🐊🦎",
            
                question: "General animal question?",
                options: ["Yes", "No"],
                correct: 0
            },
            {
                topic: "Amphibians",
                emoji: "🐝🦋",
                question: "How far do some sea turtles migrate?",
                answer: "10,000 miles or 16,000 km"
            },
            {
                topic: "Mammals",
                emoji: "🦁🐯",
                question: "How far can lions roar be heard?",
                answer: "5 miles or 8 km"
            }
        ]
    }
};

// Register in global question bank
if (typeof subjectQuestionBank !== 'undefined') {
    subjectQuestionBank['animals'] = animalsQuestions;
}
