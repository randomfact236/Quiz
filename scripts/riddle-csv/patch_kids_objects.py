#!/usr/bin/env python3
"""Append extra FACTS rows + kind tags to gen_kids_objects.py."""
import io, random
s = io.open("gen_kids_objects.py", encoding="utf-8").read()

# 1) tag old rows in order: 15A,15K,12S | 12H,10F,10N
start = s.index("FACTS = [")
end = s.index("]\n", start) + 1
ns = {}
exec(s[start:end], ns)
FACTS = ns["FACTS"]
KINDMAP_OLD = ["A"]*15 + ["K"]*15 + ["S"]*12 + ["H"]*12 + ["F"]*10 + ["N"]*10
assert len(FACTS) == len(KINDMAP_OLD), "fact count changed: %d" % len(FACTS)
rows = [tuple(row) + (k,) for row, k in zip(FACTS, KINDMAP_OLD)]

N = [
 ("a horse", ["I gallop across fields", "I carry riders on my back", "I wear metal shoes"], ["a donkey", "a cow", "a zebra"], "Clop clop clop.", "Horses gallop, carry riders, and wear metal horseshoes.", "A"),
 ("a cow", ["I say moo", "I give milk every morning", "I graze in the meadow"], ["a goat", "a horse", "a sheep"], "Spots and a bell in the field.", "Cows graze in fields and give us milk.", "A"),
 ("a pig", ["I love rolling in mud", "I have a curly little tail", "I oink loudly"], ["a cow", "a sheep", "a dog"], "Oink oink.", "Pigs wallow in mud to stay cool.", "A"),
 ("a sheep", ["I wear a woolly coat", "My baas echo across the hills", "I am sheared in spring"], ["a goat", "a llama", "a deer"], "Woolly and gentle.", "Sheep grow woolly coats sheared for wool.", "A"),
 ("a monkey", ["I swing from branch to branch", "I love bananas", "I have a long tail"], ["an ape", "a lemur", "a sloth"], "Watch the trees.", "Monkeys swing through trees and adore bananas.", "A"),
 ("a rabbit", ["My ears are long", "I hop everywhere and love carrots", "I live in burrows"], ["a hare", "a mouse", "a squirrel"], "Bounce, bounce, nibble.", "Rabbits hop on strong legs and munch carrots.", "A"),
 ("a seal", ["I bark on rocky shores", "I swim with flipper feet", "I love slippery rocks"], ["a sea lion", "a walrus", "a penguin"], "Beach barker.", "Seals haul out on rocks and swim with flippers.", "A"),
 ("a shark", ["I have rows of sharp teeth", "I never stop swimming", "A fin cuts my waves"], ["a dolphin", "a whale", "an orca"], "Fin above the waves.", "Sharks swim constantly and grow new teeth in rows.", "A"),
 ("a zebra", ["My coat is black and white stripes", "I gallop with the herd", "No two of us match"], ["a horse", "a donkey", "a tiger"], "No two patterns match.", "Each zebra's stripes are unique like fingerprints.", "A"),
 ("a hedgehog", ["My back is full of spines", "I curl into a spiky ball", "I snuffle in hedges"], ["a porcupine", "a mouse", "a mole"], "Prickly little gardener.", "Hedgehogs curl into balls so spines point outward.", "A"),
 ("a ladybug", ["I wear a red spotted shell", "I eat garden pests", "I have tiny wings"], ["a bee", "a beetle", "a fly"], "Little red luck charm.", "Ladybugs are spotted beetles that eat garden pests.", "A"),
 ("a dolphin", ["I surf the waves in pods", "I breathe through a blowhole", "I chatter in clicks"], ["a shark", "a tuna", "a seal"], "Smooth, gray, and playful.", "Dolphins swim in pods and surface to breathe.", "A"),
 ("a turtle", ["I carry my home on my back", "I am slow and steady"], ["a snail", "a tortoise", "a crab"], "Shell and stubby legs.", "Turtles carry domed shells wherever they roam.", "A"),
 ("a squirrel", ["I bury nuts for winter", "My tail fluffs like a flag"], ["a chipmunk", "a rabbit", "a mouse"], "Chattering tree acrobat.", "Squirrels hoard nuts and flick bushy tails.", "A"),
 ("a penguin chick", ["I hatch in icy colonies", "I snuggle under a parent"], ["a duckling", "an owlet", "a gosling"], "Fluffy, gray, Antarctic.", "Penguin chicks hatch in cold colonies and huddle warm.", "A"),
 ("a seesaw", ["One side goes up as the other goes down", "We balance in the middle", "Two riders take turns"], ["a swing", "a slide", "a ladder"], "Teeter, totter, up and down.", "A seesaw lifts one friend as the other sinks.", "K"),
 ("a bubble", ["I float on a puff of breath", "I pop the moment you touch me", "I am a round little rainbow"], ["a balloon", "a soap bar", "a kite"], "Round, shiny, gone in a blink.", "Bubbles float on air and pop at the lightest touch.", "K"),
 ("a cookie jar", ["Sweet treats sleep inside me", "My lid hides the crumbs", "I sit on the highest shelf"], ["a lunchbox", "a drawer", "a cabinet"], "Hands sneak in at midnight.", "The cookie jar guards the household's sweet stash.", "K"),
 ("a rocking horse", ["I gallop without leaving the room", "My arc keeps me swaying", "I have a mane but no heartbeat"], ["a bicycle", "a swing", "a teddy bear"], "Ride the waves of the nursery.", "A rocking horse sways on curved runners.", "K"),
 ("a sprinkler", ["I spin and spray on hot days", "Children run through my rain", "I drink from the garden hose"], ["a hose", "a fountain", "a shower"], "Summer's spinning shower.", "Sprinklers spin water sprays across summer lawns.", "K"),
 ("a flashlight", ["I chase away dark corners", "A button wakes my beam", "I am small enough to pocket"], ["a candle", "a lamp", "a phone"], "Camping's pocket sun.", "A flashlight beams light wherever you point it.", "K"),
 ("a desk", ["Four legs and a flat top", "Your notebook lives on me all day", "Chairs tuck under me"], ["a table", "a chair", "a shelf"], "Sit down and learn.", "School desks hold books and papers while you work.", "S"),
 ("a chalk box", ["White sticks rattle inside me", "Teachers reach for me daily", "I dust their fingers"], ["a pencil case", "a toolbox", "a makeup kit"], "Dusty little writers.", "Chalk boxes hold the sticks teachers write with.", "S"),
 ("a spelling bee", ["I am a contest of letters", "Buzzing is my only sport", "One wrong letter and you sit down"], ["a quiz", "a race", "a riddle"], "Spell to stay in the game.", "A spelling bee crowns the best letter-by-letter spellers.", "S"),
 ("a recess bell", ["I set the playground free", "My ring means games begin", "I interrupt lessons happily"], ["an alarm", "a gong", "a doorbell"], "Freedom rings at ten.", "The recess bell releases everyone to play.", "S"),
 ("a library corner", ["Quiet lives here", "Shelves of stories line my walls", "Borrowers whisper softly"], ["a classroom", "a gym", "a hall"], "Whisper only, please.", "The library corner keeps books and quiet readers.", "S"),
 ("a lunch tray", ["Different foods line up on me", "I slide along the counter", "Carry me with both hands"], ["a plate", "a basket", "a table"], "Carry me carefully to your seat.", "Lunch trays carry each meal from counter to table.", "S"),
 ("a gym mat", ["I soften every tumble", "I unroll before gymnastics", "I smell faintly of sneakers"], ["a carpet", "a towel", "a blanket"], "Land on me, not the floor.", "Gym mats cushion jumps and tumbles in PE.", "S"),
 ("a microscope", ["I make tiny things enormous", "Scientists peer into my lens", "I reveal hidden worlds"], ["a telescope", "a magnifier", "binoculars"], "The small world, super sized.", "Microscopes reveal cells and creatures too small to see.", "S"),
 ("a report card", ["My grades tell your term's story", "Parents sign my envelope", "I arrive at term's end"], ["a diary", "a letter", "a test"], "Good marks live here.", "Report cards summarize each term's grades.", "S"),
 ("a pencil sharpener", ["I give pencils their points", "Shavings curl out of me", "Turn, turn, turn"], ["scissors", "a pen", "a clip"], "Grind gently, write sharply.", "Sharpeners shave pencil wood into a fine point.", "S"),
 ("a globe of the earth", ["Countries shrink onto my surface", "Spin me to travel the world", "I am blue and green"], ["a ball", "a map", "a balloon"], "Blue and green, desk sized.", "A desktop globe spins the whole planet in your hands.", "S"),
 ("a classroom door", ["Everyone enters through me", "Names and art decorate my face", "I swing both ways"], ["a window", "a gate", "a wall"], "Lessons wait on the other side.", "The classroom door opens onto every school day.", "S"),
 ("a history book", ["I remember kings and voyages", "My pages are stacked with dates", "I am heavy with the past"], ["a novel", "a diary", "an atlas"], "The past, bound in covers.", "History books record events and dates long past.", "S"),
 ("a lost-and-found box", ["Missing gloves wait inside me", "Unclaimed scarves too", "Check me when something vanishes"], ["a bin", "a drawer", "a shelf"], "Check here for lost things.", "The lost-and-found keeps unclaimed items safely.", "S"),
 ("a laundry peg", ["I pinch wet clothes onto the line", "I am springy and small", "Squeeze me open"], ["a clip", "a hook", "a pin"], "Squeeze me open, clip me shut.", "Pegs grip laundry to lines so wind cannot steal it.", "H"),
 ("a frying pan", ["I sizzle breakfast every morning", "Eggs slide across my flat face", "My handle stays cool"], ["a pot", "a wok", "a tray"], "Hot surface, happy breakfast.", "Frying pans sizzle eggs and bacon over the flame.", "F"),
 ("a spoon", ["I scoop soup and cereal", "I sit beside the knife at dinner", "I am round and shallow"], ["a fork", "a ladle", "a knife"], "Round, shallow, and stirring.", "Spoons scoop liquids and round foods.", "F"),
 ("a salt cellar", ["Tiny white crystals live in me", "Shake me over dinner", "I season every plate"], ["a pepper mill", "a jar", "a bowl"], "Season with a sprinkle.", "Salt cellars keep table salt ready for pinching.", "F"),
 ("a jam jar", ["Fruit lives inside my glass", "Spread me on morning toast", "My lid pops when opened"], ["a honey pot", "a pickle jar", "a bottle"], "Sweet, sticky, spreadable.", "Jam jars preserve sweet crushed fruit for toast.", "F"),
 ("a whisk broom", ["I dust flour off counters", "Small bristles, small sweeps", "I live beside the pastry bench"], ["a towel", "a brush", "a sponge"], "The baker's little sweeper.", "Whisk brooms brush flour from benches and pastry.", "F"),
 ("a recipe", ["I list steps to a tasty end", "Follow me line by line", "Grandma wrote me in ink"], ["a menu", "a list", "a diary"], "Grandma's card, kitchen wisdom.", "Recipes guide cooks step by step to finished dishes.", "F"),
 ("a teabag", ["I steep in hot water", "I give the cup its color", "Two minutes and I am done"], ["a coffee filter", "a sugar cube", "a leaf"], "Dunk me for two minutes.", "Teabags steep in hot water to brew tea.", "F"),
 ("a bread bin", ["Loaves stay fresh inside me", "I live on the kitchen counter", "Crumbs collect at my floor"], ["a cupboard", "a fridge", "a drawer"], "The loaf's cozy home.", "Bread bins keep loaves fresh and out of sight.", "F"),
 ("a fruit bowl", ["Bananas and apples rest inside me", "I sit in the middle of the table", "I am round and shallow"], ["a basket", "a fridge", "a shelf"], "The healthy snack station.", "Fruit bowls keep fresh fruit handy on the table.", "F"),
 ("an egg cup", ["I hold breakfast upright", "Crack my tenant's little hat", "I am tiny and porcelain"], ["a mug", "a bowl", "a glass"], "Soft-boiled and sitting pretty.", "Egg cups hold soft-boiled eggs steady for spooning.", "F"),
 ("a freezer", ["I keep things at zero and below", "Ice cubes are my babies", "Frost lines my walls"], ["a fridge", "a cooler", "a cellar"], "The coldest drawer in the kitchen.", "Freezers store food at freezing temperatures.", "F"),
 ("a dish rack", ["Wet plates drip dry on me", "I stand beside the sink", "I am all rails and trays"], ["a shelf", "a towel", "a cupboard"], "Washed, racked, drying.", "Dish racks hold washed dishes while they air dry.", "F"),
 ("a can opener", ["I unlock metal dinners", "My wheel bites the tin lid", "Twist me around the rim"], ["a knife", "a key", "a screwdriver"], "Dinner in a tin, opened safely.", "Can openers cut tin lids open safely.", "F"),
 ("a spice rack", ["Tiny jars of flavor line my shelves", "Cinnamon and cumin sleep here", "I stand over the stove"], ["a cupboard", "a drawer", "a box"], "Little jars, big aromas.", "Spice racks organize jars of seasoning.", "F"),
 ("a mug", ["I hold hot drinks in the morning", "My handle keeps fingers cool", "I wear your favorite slogan"], ["a glass", "a cup", "a flask"], "Coffee's favorite home.", "Mugs carry hot drinks with a cool handle.", "F"),
 ("a breeze", ["I am wind's gentle cousin", "I rustle leaves without knocking them down", "I cool summer afternoons"], ["a gust", "a storm", "a chill"], "Soft air on your cheek.", "A breeze is a light wind that stirs the leaves.", "N"),
 ("a dew drop", ["I sparkle on grass at dawn", "I vanish when the sun arrives", "I am born from night air"], ["a raindrop", "a frost patch", "a puddle"], "The night leaves little jewels.", "Dew forms overnight on grass and shines until the sun dries it.", "N"),
 ("a rainbow arc", ["I curve across the sky in seven colors", "Rain and sun build me together", "You cannot ever reach me"], ["a sunset", "a storm", "a shadow"], "Sky art after the rain.", "Sunlight through raindrops paints the rainbow's arc.", "N"),
 ("a gust of wind", ["I am wind in a hurry", "I snatch hats and papers", "I arrive without warning"], ["a breeze", "a storm", "a whisper"], "Hold on to your hat.", "A gust is a sudden burst of moving air.", "N"),
 ("a hailstone", ["I fall as ice from storm clouds", "I bounce when I land", "I rattle on roofs"], ["a snowflake", "a raindrop", "an icicle"], "Sky popcorn, cold and hard.", "Hailstones are ice pellets that fall during storms.", "N"),
 ("a stream", ["I babble over pebbles downhill", "I am a small young river", "I am too small for boats"], ["a river", "a pond", "a lake"], "Gurgling downhill chat.", "Streams bubble downhill, growing into rivers.", "N"),
 ("a maple seed", ["I spin like a tiny helicopter", "I twirl down from tall trees", "I carry one tree inside"], ["an acorn", "a pinecone", "a leaf"], "Nature's propeller.", "Maple seeds whirl as they fall, flying far from the tree.", "N"),
 ("a thundercloud", ["I am tall, gray, and rumbling", "Lightning escapes my belly", "I dump the heaviest rain"], ["a fog", "a rainbow", "a breeze"], "The storm's headquarters.", "Thunderclouds store rain and lightning until storms break.", "N"),
 ("morning mist", ["I hover over lakes at sunrise", "I burn away by mid-morning", "I am a cloud at your feet"], ["smoke", "steam", "a shadow"], "The lake's soft blanket.", "Morning mist is low cloud floating over cool water.", "N"),
 ("a falling leaf", ["I twirl to the ground in autumn", "I was green all summer", "I crunch underfoot"], ["a snowflake", "a petal", "a feather"], "Autumn's slow spinner.", "Fallen leaves let trees rest through the cold months.", "N"),
 ("a full moon", ["I shine all night long", "Wolves sing to my round face", "I wax before I am full"], ["a new moon", "the sun", "a star"], "The sky's bright coin.", "A full moon reflects sunlight across the whole night.", "N"),
 ("a riverbank", ["I hold the water's edge", "Willows lean over my soil", "I am muddy after rain"], ["a beach", "a cliff", "a dam"], "Where the river pauses.", "Riverbanks frame the water and feed it with shade.", "N"),
 ("a mountain snowcap", ["I wear white all year round", "I sit on the very top", "I melt a little each afternoon"], ["a glacier", "a cloud", "a peak"], "The summit's icy hat.", "High peaks keep snowcaps even in summer.", "N"),
 ("a seed pod", ["I rattle when dry", "I carry my babies to new soil", "I split when ready"], ["a flower", "a nut", "a fruit"], "Nature's little suitcase.", "Seed pods dry, split, and scatter their seeds.", "N"),
 ("a hot air balloon", ["I rise on fire-warmed air", "I drift where the wind allows", "I carry a basket of brave sightseers"], ["a kite", "a blimp", "a parachute"], "Look up at the colorful giant.", "Hot air balloons float by heating the air inside.", "N"),
]
rows += N

new_block = "FACTS = [\n" + "".join("    " + repr(tuple(r)) + ",\n" for r in rows) + "]\n"
s = s[:start] + new_block + s[end:]
s = s.replace("for item, clues, wrongs, hint, expl in FACTS:", "for item, clues, wrongs, hint, expl, kind in FACTS:")
old_classify = s[s.index("def classify"):s.index("Q_OPEN =")]
new_classify = '''KID_MAP = {"A": "Animal Riddles", "K": "Easy Kids Riddles", "S": "School Riddles"}
OBJ_MAP = {"H": "Household Items", "F": "Food & Kitchen", "N": "Nature & Weather"}
'''
s = s.replace(old_classify, new_classify)
s = s.replace("        subj = classify(item, clues, is_kid)", "        subj = (KID_MAP if is_kid else OBJ_MAP)[kind]")
io.open("gen_kids_objects.py", "w", encoding="utf-8").write(s)
print("rows total:", len(rows))
