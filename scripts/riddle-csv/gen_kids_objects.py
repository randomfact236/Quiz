#!/usr/bin/env python3
"""Generate Kids & Family (300) and Everyday Objects (300) from fact tables."""
import random, json, pathlib
random.seed(7)
KID, OBJ = [], []
def kadd(q, opts, ci, lv, subj, h, e): KID.append({"question": q, "options": opts, "correctIndex": ci, "level": lv, "subject": subj, "hint": h, "explanation": e})
def oadd(q, opts, ci, lv, subj, h, e): OBJ.append({"question": q, "options": opts, "correctIndex": ci, "level": lv, "subject": subj, "hint": h, "explanation": e})
def mc(ans, wrong):
    s = [ans]
    for w in wrong:
        if w != ans and w not in s: s.append(w)
        if len(s) == 4: break
    i = 0
    fill = ["a sponge", "a lantern", "a backpack", "a ladder", "a candle", "a teapot"]
    while len(s) < 4:
        if fill[i] not in s: s.append(fill[i])
        i += 1
    o = s[:]; random.shuffle(o)
    return o, o.index(ans)

OPEN = ["I am", "People say I am", "You know me well: I am", "Every home knows me: I am"]
# (item, clues[>=2], distractors[3], hint, explanation, list_name)
FACTS = [
    ('a kangaroo', ['I carry my baby in a pouch', 'I have mighty hopping legs'], ['a koala', 'a rabbit', 'a wallaby'], 'Look for the pocket.', 'A kangaroo keeps its joey safe in a pouch and hops on huge back legs.', 'A'),
    ('an owl', ['I stay awake all night', 'I turn my head almost all the way around'], ['a falcon', 'a crow', 'a robin'], 'Whoo-whoo goes there?', 'Owls hunt at night and can swivel their heads about 270 degrees.', 'A'),
    ('a penguin', ['I wear a black and white suit', 'I waddle but cannot fly'], ['an ostrich', 'a puffin', 'a duck'], 'Think ice and tuxedos.', 'Penguins are flightless birds that waddle across the ice.', 'A'),
    ('an elephant', ['I have a trunk for a nose', 'I flap big ears to stay cool'], ['a rhino', 'a hippo', 'a mammoth'], 'Big ears and a long nose.', 'An elephant uses its trunk like a hand and its ears like fans.', 'A'),
    ('a giraffe', ['My neck reaches the treetops', 'I wear a patchwork coat'], ['a zebra', 'a camel', 'a moose'], 'The tallest one at the salad bar.', 'Giraffes use long necks to eat leaves high in the trees.', 'A'),
    ('a bee', ['I dance to tell friends where flowers are', 'I make something sweet in a hive'], ['a wasp', 'a butterfly', 'a hornet'], 'Bzzz, and honey follows.', 'Honeybees wiggle-dance to share flower locations and make honey.', 'A'),
    ('a chameleon', ['I change my skin color', 'My eyes look two ways at once'], ['an iguana', 'a frog', 'a gecko'], 'The color-changing lizard.', 'Chameleons shift colors and move each eye independently.', 'A'),
    ('a dolphin', ['I talk in clicks and whistles', 'I leap from the sea like silver lightning'], ['a shark', 'a seal', 'a whale'], 'A clever ocean acrobat.', 'Dolphins communicate with clicks and whistles and love to leap.', 'A'),
    ('a snail', ['I carry my house on my back', 'I leave a shiny trail behind me'], ['a slug', 'a turtle', 'a beetle'], 'Slow, with a spiral suitcase.', "A snail's spiral shell is its portable home.", 'A'),
    ('a firefly', ['I blink with my own light', 'I glow on summer nights'], ['a moth', 'a dragonfly', 'a bee'], 'The tiny night lantern.', 'Fireflies make cold light in their bellies to signal at night.', 'A'),
    ('a beaver', ['I gnaw trees with strong teeth', 'I build dams in rivers'], ['an otter', 'a muskrat', 'a woodchuck'], "Nature's little engineer.", 'Beavers fell trees and build dams with mud and branches.', 'A'),
    ('a peacock', ['I open a giant feathered fan', 'My feathers shimmer blue and green'], ['a turkey', 'a swan', 'a parrot'], 'Strut and sparkle.', 'A peacock fans its dazzling tail to impress.', 'A'),
    ('a bat', ['I sleep hanging upside down', 'I find my way with sound echoes'], ['an owl', 'a flying squirrel', 'a hawk'], 'Night pilot with built-in radar.', 'Bats use echolocation and roost upside down.', 'A'),
    ('a camel', ['I carry humps of stored fat', 'I can cross hot deserts for days'], ['a horse', 'a donkey', 'a llama'], 'The desert ship.', 'Camel humps store fat for long desert journeys.', 'A'),
    ('an octopus', ['I have eight wiggly arms', 'I squirt ink to escape'], ['a squid', 'a crab', 'a jellyfish'], 'Eight arms, one clever head.', 'Octopuses have eight arms and spray ink clouds to hide.', 'A'),
    ('a balloon', ['I puff up big and round', 'I fear pointy things at parties'], ['a bubble', 'a ball', 'a beach ball'], 'Pop goes the party.', 'A balloon inflates with air and pops on sharp points.', 'K'),
    ('an ice cream cone', ['I melt in the sunshine', 'You lick me before I drip'], ['a popsicle', 'a cupcake', 'a milkshake'], 'Sweet, cold, on a crunchy holder.', 'Ice cream in a cone melts fast on hot days.', 'K'),
    ('a tricycle', ['I have three wheels', 'Pedals make me go'], ['a bicycle', 'a scooter', 'a wagon'], 'Two little wheels and one in front.', 'A tricycle rolls on three wheels powered by pedals.', 'K'),
    ('a crayon', ['I come in every color', 'I get shorter as you draw'], ['a marker', 'a pencil', 'a paintbrush'], 'Wax that leaves rainbow lines.', 'Crayons are colored wax sticks that shrink with use.', 'K'),
    ('a swing', ['Back and forth I fly', 'Two ropes and a seat keep me up'], ['a seesaw', 'a slide', 'a rocking horse'], 'Pump your legs to the sky.', 'A swing flies higher with every leg pump.', 'K'),
    ('a puddle', ['I am born when rain collects', 'You love to splash in me'], ['a pond', 'a pool', 'a glass of water'], "Rainwater's favorite resting spot.", 'Puddles form from rain and are perfect for splashing.', 'K'),
    ('a kite', ['I dance at the end of a string', 'I need wind to fly high'], ['a balloon', 'a bird', 'a paper plane'], 'Hold tight on windy days.', 'A kite rides the wind at the end of a long string.', 'K'),
    ('a birthday cake', ['I wear candles on my head', 'Everyone sings before you blow them out'], ['a pie', 'a cupcake', 'a cookie'], 'Sweet, with flickering lights.', 'Birthday cakes carry candles that you blow out after the song.', 'K'),
    ('a sandbox', ['I am a big box of grains', 'Castles rise inside me'], ['a beach', 'a garden', 'a toy chest'], 'Tiny stones you can build with.', 'Sandbox sand is perfect for digging and building castles.', 'K'),
    ('a teddy bear', ['I am soft and stuffed with fluff', 'I guard you while you sleep'], ['a doll', 'a puppet', 'a robot'], 'Cuddly, with round ears.', 'A teddy bear is a soft stuffed friend for bedtime.', 'K'),
    ('a toothbrush', ['I fight sugar twice a day', 'I wear a cape of foam'], ['a hairbrush', 'a comb', 'a floss pick'], 'Bristles on a mission.', 'A toothbrush scrubs teeth clean every morning and night.', 'K'),
    ('a slide', ['Climb up high, zoom down fast', 'I am shiny and sloped'], ['a ladder', 'a swing', 'a ramp'], 'Wheee is my middle name.', 'A playground slide carries you up the steps and down in a whoosh.', 'K'),
    ('a rainbow', ['I wear seven colors after rain', 'I arch across the sky'], ['a sunset', 'a cloud', 'a kite'], 'Look up when sunshine meets showers.', 'Rainbows appear when sunlight shines through raindrops.', 'K'),
    ('a snowman', ['I am built from three white balls', 'A carrot often finishes my face'], ['a sandcastle', 'an igloo', 'a scarecrow'], "Winter's friendliest giant.", 'Snowmen are rolled from snowballs with carrot noses.', 'K'),
    ('a magnifying glass', ['I make small things look huge', 'I can focus sunlight to a dot'], ['a mirror', 'binoculars', 'a camera'], 'Everything looks bigger through me.', 'A magnifying glass bends light to enlarge tiny things.', 'K'),
    ('a blackboard', ['Lessons appear when I am written on', 'Chalk dusts me every day'], ['a whiteboard', 'a book', 'a poster'], 'The teacher writes on me.', 'Chalk writes lessons on the board for the whole class.', 'S'),
    ('a backpack', ['I carry books on my back', 'Zippers keep my secrets'], ['a briefcase', 'a suitcase', 'a drawer'], "Student's portable shelf.", 'A backpack hauls notebooks and pencils to school.', 'S'),
    ('a globe', ['I am a tiny model of Earth', 'I spin to show every continent'], ['a map', 'an atlas', 'a telescope'], 'The world in your hands.', 'A globe is a small spinning Earth for geography lessons.', 'S'),
    ('an eraser', ['I undo pencil mistakes', 'I shrink as I help'], ['a ruler', 'a sharpener', 'a marker'], 'Second chances in pink or white.', 'Erasers rub out pencil marks and wear away doing it.', 'S'),
    ('a school bell', ['I ring to start the day', 'Everybody moves when I sound'], ['an alarm', 'a doorbell', 'a gong'], 'Its ding means line up.', 'The school bell tells everyone when lessons begin and end.', 'S'),
    ('a library card', ['I borrow adventures for free', 'Stamps tell when I am due'], ['a ticket', 'an ID badge', 'a coupon'], 'Your pass to endless stories.', 'A library card lets you take books home to read.', 'S'),
    ('a ruler', ['I measure in straight lines', 'My edges are numbered'], ['a scale', 'a protractor', 'a tape'], 'Twelve inches of order.', 'A ruler measures length and draws straight lines.', 'S'),
    ('a lunchbox', ['I guard your sandwiches till noon', 'Moms pack me every morning'], ['a picnic basket', 'a cooler', 'a drawer'], 'Midday meals travel in me.', 'A lunchbox keeps your meal safe until break time.', 'S'),
    ('a protractor', ['I measure corners in degrees', 'I am shaped like a half moon'], ['a ruler', 'a compass', 'a triangle'], 'Half-circle angle detective.', 'A protractor measures angles in degrees.', 'S'),
    ('a spelling test', ['I ask you to letters-in-order', 'Ten words, every Friday'], ['a quiz', 'a crossword', 'a riddle'], 'Say each word, write each word.', 'A spelling test checks that you can write words correctly.', 'S'),
    ('a pencil case', ['I zip up a whole desk', 'Pointy things live inside me'], ['a backpack', 'a toolbox', 'a purse'], 'Small home for pens and pencils.', 'A pencil case stores pens, pencils, and erasers.', 'S'),
    ('a science fair', ['Volcanoes made of clay erupt here', 'Posters explain cool experiments'], ['a sports day', 'a concert', 'a bake sale'], 'Where inventions meet ribbons.', 'A science fair displays student experiments and projects.', 'S'),
    ('a broom', ['I sweep corners clean', 'I have bristles and a long handle'], ['a mop', 'a rake', 'a brush'], 'Follow the crumbs.', 'A broom sweeps dust and crumbs with its bristles.', 'H'),
    ('an alarm clock', ['I shout numbers every morning', 'Snooze buttons slow me down'], ['a watch', 'a calendar', 'a radio'], 'The noisiest wake-up call.', 'An alarm clock rings at a set time to wake you.', 'H'),
    ('a laundry basket', ['Dirty clothes pile up inside me', 'I wait by the washing machine'], ['a closet', 'a drawer', 'a suitcase'], 'Where worn clothes rest.', 'The laundry basket collects clothes waiting to be washed.', 'H'),
    ('an iron', ['I smooth wrinkles with heat', 'I slide across shirts'], ['a dryer', 'a steamer', 'a brush'], 'Steam and press, no creases.', 'An iron presses clothes flat with heated smooth plates.', 'H'),
    ('a doormat', ['I catch mud at the entrance', 'Everyone steps on me politely'], ['a rug', 'a carpet', 'a towel'], 'Wipe your feet, please.', 'A doormat collects dirt from shoes at the door.', 'H'),
    ('a light switch', ['One flick and darkness runs', 'I live on the wall by the door'], ['a lamp', 'a plug', 'a remote'], 'On. Off. On. Off.', "A light switch turns the room's lights on and off.", 'H'),
    ('a doorbell', ['I sing a short song when pressed', 'Visitors use me instead of knocking'], ['a phone', 'a chime', 'a horn'], 'Ding-dong means company.', 'A doorbell rings inside the house when visitors press it.', 'H'),
    ('a measuring cup', ['Bakers trust my markings', 'I hold exact amounts'], ['a mug', 'a spoon', 'a bowl'], 'Level off the top.', 'A measuring cup measures flour and liquids for recipes.', 'H'),
    ('an umbrella stand', ['Wet umbrellas rest inside me', 'I live beside the front door'], ['a bucket', 'a coat rack', 'a bin'], 'Dripping guests park here.', 'An umbrella stand holds wet umbrellas by the door.', 'H'),
    ('a toolbox', ['Hammers and screwdrivers sleep in me', 'I clank when carried'], ['a kitchen drawer', 'a shelf', 'a backpack'], 'Fix-it things live here.', 'A toolbox stores hammers, screws, and repair tools.', 'H'),
    ('a clothesline', ['Wet shirts dance on my line', 'Sunshine dries what I hold'], ['a dryer', 'a fence', 'a curtain rod'], 'Pegs and a breeze do the rest.', 'Clotheslines hold wet laundry so the sun can dry it.', 'H'),
    ('a trash bin', ['I eat what nobody wants', 'Wheel me out on collection day'], ['a cupboard', 'a drawer', 'a basket'], 'Bags go in, trucks take out.', 'Trash bins hold waste until collection trucks arrive.', 'H'),
    ('a kettle', ['I whistle when boiling', 'Tea time starts with me'], ['a pot', 'a toaster', 'an oven'], 'Listen for the song.', 'Kettles boil water and whistle when it is ready.', 'F'),
    ('a rolling pin', ['I flatten dough evenly', 'I roll back and forth under your palms'], ['a whisk', 'a spoon', 'a knife'], "The baker's smooth wooden roller.", 'Rolling pins flatten cookie and pie dough.', 'F'),
    ('a colander', ['I drain spaghetti with holes', 'I am a bowl full of holes'], ['a sieve', 'a pot', 'a plate'], 'Water leaves, pasta stays.', "A colander's holes let water drain from food.", 'F'),
    ('a whisk', ['I beat eggs with wires', 'I turn cream into peaks'], ['a fork', 'a spoon', 'a mixer'], 'Circles fast, air goes in.', 'A whisk whips air into eggs and cream.', 'F'),
    ('a spatula', ['I flip pancakes with a flat face', 'I scrape bowls clean'], ['a spoon', 'a knife', 'a tong'], "The pancake's best friend.", 'A spatula flips food and scrapes every last bit.', 'F'),
    ('a pepper mill', ['I grind tiny spicy specks', 'Twist my top at dinner'], ['a salt shaker', 'a grinder', 'a bottle'], 'Seasoning with a twist.', 'Pepper mills grind peppercorns fresh onto food.', 'F'),
    ('a honey jar', ['I hold something golden and sweet', 'Bees made everything inside me'], ['a syrup bottle', 'a jam jar', 'a sugar bowl'], 'Golden, sticky, from the hive.', 'Honey jars store the sweet syrup bees make.', 'F'),
    ('a chopping board', ['Knives knock politely on me', 'Vegetables meet their end on my face'], ['a plate', 'a pan', 'a table'], 'Every chop starts here.', 'Chopping boards protect counters while knives cut food.', 'F'),
    ('an oven mitt', ['I grab hot trays without burning', 'I wear heat-proof padding'], ['a glove', 'a towel', 'a pot'], 'Thick protection at 200 degrees.', 'Oven mitts insulate hands from hot trays and pans.', 'F'),
    ('a salt shaker', ['Shake me and tiny crystals fall', 'I season every dinner plate'], ['a pepper mill', 'a sugar bowl', 'a jar'], 'Small white crystals, big flavor.', 'Salt shakers sprinkle seasoning over meals.', 'F'),
    ('a cloud', ['I float and change shape all day', 'I carry rain until I am heavy'], ['a fog bank', 'a balloon', 'a pillow'], 'Fluffy, gray, or white.', 'Clouds drift overhead, changing shape and releasing rain.', 'N'),
    ('a rainbow', ['I paint an arc of seven colors', 'Sunshine and showers make me'], ['a sunset', 'a prism', 'a kite'], 'Sky art after the rain.', 'Rainbows form when sun shines through falling rain.', 'N'),
    ('a river', ['I run to the sea without legs', 'Fish travel inside me'], ['a lake', 'a stream', 'a road'], 'Always moving, never arriving.', 'Rivers flow constantly toward the ocean.', 'N'),
    ('a thunderstorm', ['I boom after my flash', 'I bring heavy rain and wind'], ['a shower', 'a breeze', 'a heatwave'], 'Count the seconds after the flash.', 'Thunder rolls seconds after the lightning flash.', 'N'),
    ('a snowflake', ['I am frozen and six-pointed', 'No two of me match'], ['an icicle', 'a hailstone', 'a frost patch'], 'Look closely: six delicate arms.', 'Each snowflake grows a unique six-sided crystal shape.', 'N'),
    ('a waterfall', ['I pour without a pitcher', 'Cliffs are my stage'], ['a river', 'a fountain', 'a spring'], "The river's big jump.", 'Waterfalls pour rivers over high cliff edges.', 'N'),
    ('a rainbow after mist', ['Sprays of waterfalls make me', 'I need sun and droplets'], ['a cloud', 'a halo', 'a shadow'], 'Mini rainbows live in spray.', 'Waterfall mist and sunshine create small rainbows.', 'N'),
    ('the morning fog', ['I blanket fields at dawn', 'I vanish when the sun climbs'], ['a storm', 'a cloud', 'smoke'], 'Low clouds that fade by nine.', 'Morning fog is low cloud that evaporates in sunshine.', 'N'),
    ('a seed', ['I sleep until spring wakes me', 'Inside me hides a whole plant'], ['an egg', 'a bulb', 'a bud'], 'Small, dry, and full of future.', 'Seeds hold tiny plants waiting for warmth and water.', 'N'),
    ('a volcano', ['I smoke and occasionally erupt', 'I build mountains from the inside'], ['a geyser', 'a hill', 'a canyon'], 'Do not poke the sleeping giant.', 'Volcanoes erupt molten rock, building mountains over time.', 'N'),
    ('a horse', ['I gallop across fields', 'I carry riders on my back', 'I wear metal shoes'], ['a donkey', 'a cow', 'a zebra'], 'Clop clop clop.', 'Horses gallop, carry riders, and wear metal horseshoes.', 'A'),
    ('a cow', ['I say moo', 'I give milk every morning', 'I graze in the meadow'], ['a goat', 'a horse', 'a sheep'], 'Spots and a bell in the field.', 'Cows graze in fields and give us milk.', 'A'),
    ('a pig', ['I love rolling in mud', 'I have a curly little tail', 'I oink loudly'], ['a cow', 'a sheep', 'a dog'], 'Oink oink.', 'Pigs wallow in mud to stay cool.', 'A'),
    ('a sheep', ['I wear a woolly coat', 'My baas echo across the hills', 'I am sheared in spring'], ['a goat', 'a llama', 'a deer'], 'Woolly and gentle.', 'Sheep grow woolly coats sheared for wool.', 'A'),
    ('a monkey', ['I swing from branch to branch', 'I love bananas', 'I have a long tail'], ['an ape', 'a lemur', 'a sloth'], 'Watch the trees.', 'Monkeys swing through trees and adore bananas.', 'A'),
    ('a rabbit', ['My ears are long', 'I hop everywhere and love carrots', 'I live in burrows'], ['a hare', 'a mouse', 'a squirrel'], 'Bounce, bounce, nibble.', 'Rabbits hop on strong legs and munch carrots.', 'A'),
    ('a seal', ['I bark on rocky shores', 'I swim with flipper feet', 'I love slippery rocks'], ['a sea lion', 'a walrus', 'a penguin'], 'Beach barker.', 'Seals haul out on rocks and swim with flippers.', 'A'),
    ('a shark', ['I have rows of sharp teeth', 'I never stop swimming', 'A fin cuts my waves'], ['a dolphin', 'a whale', 'an orca'], 'Fin above the waves.', 'Sharks swim constantly and grow new teeth in rows.', 'A'),
    ('a zebra', ['My coat is black and white stripes', 'I gallop with the herd', 'No two of us match'], ['a horse', 'a donkey', 'a tiger'], 'No two patterns match.', "Each zebra's stripes are unique like fingerprints.", 'A'),
    ('a hedgehog', ['My back is full of spines', 'I curl into a spiky ball', 'I snuffle in hedges'], ['a porcupine', 'a mouse', 'a mole'], 'Prickly little gardener.', 'Hedgehogs curl into balls so spines point outward.', 'A'),
    ('a ladybug', ['I wear a red spotted shell', 'I eat garden pests', 'I have tiny wings'], ['a bee', 'a beetle', 'a fly'], 'Little red luck charm.', 'Ladybugs are spotted beetles that eat garden pests.', 'A'),
    ('a dolphin', ['I surf the waves in pods', 'I breathe through a blowhole', 'I chatter in clicks'], ['a shark', 'a tuna', 'a seal'], 'Smooth, gray, and playful.', 'Dolphins swim in pods and surface to breathe.', 'A'),
    ('a turtle', ['I carry my home on my back', 'I am slow and steady'], ['a snail', 'a tortoise', 'a crab'], 'Shell and stubby legs.', 'Turtles carry domed shells wherever they roam.', 'A'),
    ('a squirrel', ['I bury nuts for winter', 'My tail fluffs like a flag'], ['a chipmunk', 'a rabbit', 'a mouse'], 'Chattering tree acrobat.', 'Squirrels hoard nuts and flick bushy tails.', 'A'),
    ('a penguin chick', ['I hatch in icy colonies', 'I snuggle under a parent'], ['a duckling', 'an owlet', 'a gosling'], 'Fluffy, gray, Antarctic.', 'Penguin chicks hatch in cold colonies and huddle warm.', 'A'),
    ('a seesaw', ['One side goes up as the other goes down', 'We balance in the middle', 'Two riders take turns'], ['a swing', 'a slide', 'a ladder'], 'Teeter, totter, up and down.', 'A seesaw lifts one friend as the other sinks.', 'K'),
    ('a bubble', ['I float on a puff of breath', 'I pop the moment you touch me', 'I am a round little rainbow'], ['a balloon', 'a soap bar', 'a kite'], 'Round, shiny, gone in a blink.', 'Bubbles float on air and pop at the lightest touch.', 'K'),
    ('a cookie jar', ['Sweet treats sleep inside me', 'My lid hides the crumbs', 'I sit on the highest shelf'], ['a lunchbox', 'a drawer', 'a cabinet'], 'Hands sneak in at midnight.', "The cookie jar guards the household's sweet stash.", 'K'),
    ('a rocking horse', ['I gallop without leaving the room', 'My arc keeps me swaying', 'I have a mane but no heartbeat'], ['a bicycle', 'a swing', 'a teddy bear'], 'Ride the waves of the nursery.', 'A rocking horse sways on curved runners.', 'K'),
    ('a sprinkler', ['I spin and spray on hot days', 'Children run through my rain', 'I drink from the garden hose'], ['a hose', 'a fountain', 'a shower'], "Summer's spinning shower.", 'Sprinklers spin water sprays across summer lawns.', 'K'),
    ('a flashlight', ['I chase away dark corners', 'A button wakes my beam', 'I am small enough to pocket'], ['a candle', 'a lamp', 'a phone'], "Camping's pocket sun.", 'A flashlight beams light wherever you point it.', 'K'),
    ('a desk', ['Four legs and a flat top', 'Your notebook lives on me all day', 'Chairs tuck under me'], ['a table', 'a chair', 'a shelf'], 'Sit down and learn.', 'School desks hold books and papers while you work.', 'S'),
    ('a chalk box', ['White sticks rattle inside me', 'Teachers reach for me daily', 'I dust their fingers'], ['a pencil case', 'a toolbox', 'a makeup kit'], 'Dusty little writers.', 'Chalk boxes hold the sticks teachers write with.', 'S'),
    ('a spelling bee', ['I am a contest of letters', 'Buzzing is my only sport', 'One wrong letter and you sit down'], ['a quiz', 'a race', 'a riddle'], 'Spell to stay in the game.', 'A spelling bee crowns the best letter-by-letter spellers.', 'S'),
    ('a recess bell', ['I set the playground free', 'My ring means games begin', 'I interrupt lessons happily'], ['an alarm', 'a gong', 'a doorbell'], 'Freedom rings at ten.', 'The recess bell releases everyone to play.', 'S'),
    ('a library corner', ['Quiet lives here', 'Shelves of stories line my walls', 'Borrowers whisper softly'], ['a classroom', 'a gym', 'a hall'], 'Whisper only, please.', 'The library corner keeps books and quiet readers.', 'S'),
    ('a lunch tray', ['Different foods line up on me', 'I slide along the counter', 'Carry me with both hands'], ['a plate', 'a basket', 'a table'], 'Carry me carefully to your seat.', 'Lunch trays carry each meal from counter to table.', 'S'),
    ('a gym mat', ['I soften every tumble', 'I unroll before gymnastics', 'I smell faintly of sneakers'], ['a carpet', 'a towel', 'a blanket'], 'Land on me, not the floor.', 'Gym mats cushion jumps and tumbles in PE.', 'S'),
    ('a microscope', ['I make tiny things enormous', 'Scientists peer into my lens', 'I reveal hidden worlds'], ['a telescope', 'a magnifier', 'binoculars'], 'The small world, super sized.', 'Microscopes reveal cells and creatures too small to see.', 'S'),
    ('a report card', ["My grades tell your term's story", 'Parents sign my envelope', "I arrive at term's end"], ['a diary', 'a letter', 'a test'], 'Good marks live here.', "Report cards summarize each term's grades.", 'S'),
    ('a pencil sharpener', ['I give pencils their points', 'Shavings curl out of me', 'Turn, turn, turn'], ['scissors', 'a pen', 'a clip'], 'Grind gently, write sharply.', 'Sharpeners shave pencil wood into a fine point.', 'S'),
    ('a globe of the earth', ['Countries shrink onto my surface', 'Spin me to travel the world', 'I am blue and green'], ['a ball', 'a map', 'a balloon'], 'Blue and green, desk sized.', 'A desktop globe spins the whole planet in your hands.', 'S'),
    ('a classroom door', ['Everyone enters through me', 'Names and art decorate my face', 'I swing both ways'], ['a window', 'a gate', 'a wall'], 'Lessons wait on the other side.', 'The classroom door opens onto every school day.', 'S'),
    ('a history book', ['I remember kings and voyages', 'My pages are stacked with dates', 'I am heavy with the past'], ['a novel', 'a diary', 'an atlas'], 'The past, bound in covers.', 'History books record events and dates long past.', 'S'),
    ('a lost-and-found box', ['Missing gloves wait inside me', 'Unclaimed scarves too', 'Check me when something vanishes'], ['a bin', 'a drawer', 'a shelf'], 'Check here for lost things.', 'The lost-and-found keeps unclaimed items safely.', 'S'),
    ('a laundry peg', ['I pinch wet clothes onto the line', 'I am springy and small', 'Squeeze me open'], ['a clip', 'a hook', 'a pin'], 'Squeeze me open, clip me shut.', 'Pegs grip laundry to lines so wind cannot steal it.', 'H'),
    ('a frying pan', ['I sizzle breakfast every morning', 'Eggs slide across my flat face', 'My handle stays cool'], ['a pot', 'a wok', 'a tray'], 'Hot surface, happy breakfast.', 'Frying pans sizzle eggs and bacon over the flame.', 'F'),
    ('a spoon', ['I scoop soup and cereal', 'I sit beside the knife at dinner', 'I am round and shallow'], ['a fork', 'a ladle', 'a knife'], 'Round, shallow, and stirring.', 'Spoons scoop liquids and round foods.', 'F'),
    ('a salt cellar', ['Tiny white crystals live in me', 'Shake me over dinner', 'I season every plate'], ['a pepper mill', 'a jar', 'a bowl'], 'Season with a sprinkle.', 'Salt cellars keep table salt ready for pinching.', 'F'),
    ('a jam jar', ['Fruit lives inside my glass', 'Spread me on morning toast', 'My lid pops when opened'], ['a honey pot', 'a pickle jar', 'a bottle'], 'Sweet, sticky, spreadable.', 'Jam jars preserve sweet crushed fruit for toast.', 'F'),
    ('a whisk broom', ['I dust flour off counters', 'Small bristles, small sweeps', 'I live beside the pastry bench'], ['a towel', 'a brush', 'a sponge'], "The baker's little sweeper.", 'Whisk brooms brush flour from benches and pastry.', 'F'),
    ('a recipe', ['I list steps to a tasty end', 'Follow me line by line', 'Grandma wrote me in ink'], ['a menu', 'a list', 'a diary'], "Grandma's card, kitchen wisdom.", 'Recipes guide cooks step by step to finished dishes.', 'F'),
    ('a teabag', ['I steep in hot water', 'I give the cup its color', 'Two minutes and I am done'], ['a coffee filter', 'a sugar cube', 'a leaf'], 'Dunk me for two minutes.', 'Teabags steep in hot water to brew tea.', 'F'),
    ('a bread bin', ['Loaves stay fresh inside me', 'I live on the kitchen counter', 'Crumbs collect at my floor'], ['a cupboard', 'a fridge', 'a drawer'], "The loaf's cozy home.", 'Bread bins keep loaves fresh and out of sight.', 'F'),
    ('a fruit bowl', ['Bananas and apples rest inside me', 'I sit in the middle of the table', 'I am round and shallow'], ['a basket', 'a fridge', 'a shelf'], 'The healthy snack station.', 'Fruit bowls keep fresh fruit handy on the table.', 'F'),
    ('an egg cup', ['I hold breakfast upright', "Crack my tenant's little hat", 'I am tiny and porcelain'], ['a mug', 'a bowl', 'a glass'], 'Soft-boiled and sitting pretty.', 'Egg cups hold soft-boiled eggs steady for spooning.', 'F'),
    ('a freezer', ['I keep things at zero and below', 'Ice cubes are my babies', 'Frost lines my walls'], ['a fridge', 'a cooler', 'a cellar'], 'The coldest drawer in the kitchen.', 'Freezers store food at freezing temperatures.', 'F'),
    ('a dish rack', ['Wet plates drip dry on me', 'I stand beside the sink', 'I am all rails and trays'], ['a shelf', 'a towel', 'a cupboard'], 'Washed, racked, drying.', 'Dish racks hold washed dishes while they air dry.', 'F'),
    ('a can opener', ['I unlock metal dinners', 'My wheel bites the tin lid', 'Twist me around the rim'], ['a knife', 'a key', 'a screwdriver'], 'Dinner in a tin, opened safely.', 'Can openers cut tin lids open safely.', 'F'),
    ('a spice rack', ['Tiny jars of flavor line my shelves', 'Cinnamon and cumin sleep here', 'I stand over the stove'], ['a cupboard', 'a drawer', 'a box'], 'Little jars, big aromas.', 'Spice racks organize jars of seasoning.', 'F'),
    ('a mug', ['I hold hot drinks in the morning', 'My handle keeps fingers cool', 'I wear your favorite slogan'], ['a glass', 'a cup', 'a flask'], "Coffee's favorite home.", 'Mugs carry hot drinks with a cool handle.', 'F'),
    ('a breeze', ["I am wind's gentle cousin", 'I rustle leaves without knocking them down', 'I cool summer afternoons'], ['a gust', 'a storm', 'a chill'], 'Soft air on your cheek.', 'A breeze is a light wind that stirs the leaves.', 'N'),
    ('a dew drop', ['I sparkle on grass at dawn', 'I vanish when the sun arrives', 'I am born from night air'], ['a raindrop', 'a frost patch', 'a puddle'], 'The night leaves little jewels.', 'Dew forms overnight on grass and shines until the sun dries it.', 'N'),
    ('a rainbow arc', ['I curve across the sky in seven colors', 'Rain and sun build me together', 'You cannot ever reach me'], ['a sunset', 'a storm', 'a shadow'], 'Sky art after the rain.', "Sunlight through raindrops paints the rainbow's arc.", 'N'),
    ('a gust of wind', ['I am wind in a hurry', 'I snatch hats and papers', 'I arrive without warning'], ['a breeze', 'a storm', 'a whisper'], 'Hold on to your hat.', 'A gust is a sudden burst of moving air.', 'N'),
    ('a hailstone', ['I fall as ice from storm clouds', 'I bounce when I land', 'I rattle on roofs'], ['a snowflake', 'a raindrop', 'an icicle'], 'Sky popcorn, cold and hard.', 'Hailstones are ice pellets that fall during storms.', 'N'),
    ('a stream', ['I babble over pebbles downhill', 'I am a small young river', 'I am too small for boats'], ['a river', 'a pond', 'a lake'], 'Gurgling downhill chat.', 'Streams bubble downhill, growing into rivers.', 'N'),
    ('a maple seed', ['I spin like a tiny helicopter', 'I twirl down from tall trees', 'I carry one tree inside'], ['an acorn', 'a pinecone', 'a leaf'], "Nature's propeller.", 'Maple seeds whirl as they fall, flying far from the tree.', 'N'),
    ('a thundercloud', ['I am tall, gray, and rumbling', 'Lightning escapes my belly', 'I dump the heaviest rain'], ['a fog', 'a rainbow', 'a breeze'], "The storm's headquarters.", 'Thunderclouds store rain and lightning until storms break.', 'N'),
    ('morning mist', ['I hover over lakes at sunrise', 'I burn away by mid-morning', 'I am a cloud at your feet'], ['smoke', 'steam', 'a shadow'], "The lake's soft blanket.", 'Morning mist is low cloud floating over cool water.', 'N'),
    ('a falling leaf', ['I twirl to the ground in autumn', 'I was green all summer', 'I crunch underfoot'], ['a snowflake', 'a petal', 'a feather'], "Autumn's slow spinner.", 'Fallen leaves let trees rest through the cold months.', 'N'),
    ('a full moon', ['I shine all night long', 'Wolves sing to my round face', 'I wax before I am full'], ['a new moon', 'the sun', 'a star'], "The sky's bright coin.", 'A full moon reflects sunlight across the whole night.', 'N'),
    ('a riverbank', ["I hold the water's edge", 'Willows lean over my soil', 'I am muddy after rain'], ['a beach', 'a cliff', 'a dam'], 'Where the river pauses.', 'Riverbanks frame the water and feed it with shade.', 'N'),
    ('a mountain snowcap', ['I wear white all year round', 'I sit on the very top', 'I melt a little each afternoon'], ['a glacier', 'a cloud', 'a peak'], "The summit's icy hat.", 'High peaks keep snowcaps even in summer.', 'N'),
    ('a seed pod', ['I rattle when dry', 'I carry my babies to new soil', 'I split when ready'], ['a flower', 'a nut', 'a fruit'], "Nature's little suitcase.", 'Seed pods dry, split, and scatter their seeds.', 'N'),
    ('a hot air balloon', ['I rise on fire-warmed air', 'I drift where the wind allows', 'I carry a basket of brave sightseers'], ['a kite', 'a blimp', 'a parachute'], 'Look up at the colorful giant.', 'Hot air balloons float by heating the air inside.', 'N'),
    ('a skateboard', ['I roll on four small wheels', 'I ride ramps at the park'], ['a scooter', 'a bike', 'roller skates'], 'Kick, push, balance.', 'Skateboards roll on four wheels and ride ramps.', 'K'),
    ('a comic book', ['Pictures tell my story', 'Speech bubbles shout my action words'], ['a novel', 'a magazine', 'a coloring book'], 'Read in panels, super fast.', 'Comic books tell stories through drawn panels and bubbles.', 'K'),
    ('a jumping rope', ['I swing under your feet again and again', 'Count my jumps out loud'], ['a ladder', 'a ribbon', 'a hoop'], 'Skip, skip, skip.', 'Jump ropes swing underfoot for counting games.', 'K'),
    ('a toy train', ['I chug around a little track', 'You connect my carriages'], ['a toy car', 'a bus', 'a plane'], 'Choo choo, all aboard.', 'Toy trains pull carriages around a small track.', 'K'),
    ('an ironing board', ['I fold flat against the wall', 'Hot irons slide across my cover'], ['a table', 'a rack', 'a shelf'], 'Wrinkles fear my heat.', 'Ironing boards hold clothes flat while irons press them.', 'H'),
    ('a vacuum', ['I eat crumbs with a loud hum', 'I glide across carpets'], ['a mop', 'a broom', 'a duster'], 'Loud suction, clean floors.', 'Vacuums suck dust from floors with motor power.', 'H'),
    ('a coat hook', ['Jackets hang here by the door', 'I am metal and screwed to the wall'], ['a peg', 'a hanger', 'a shelf'], 'Single file, one coat each.', 'Coat hooks hold jackets near the entrance.', 'H'),
    ('a key bowl', ['Spare keys jingle inside me', 'I live on the hallway table'], ['a drawer', 'a box', 'a cup'], 'Drop your keys right here.', 'Key bowls keep keys where everyone can find them.', 'H'),
    ('a step ladder', ['I fold for storage', 'I give you two extra steps of height'], ['a chair', 'a staircase', 'an elevator'], 'Climb safely to the top shelf.', 'Step ladders fold open to reach high places safely.', 'H'),
    ('a fire extinguisher', ['I sleep red on the wall', 'I spray foam at flames'], ['a hose', 'a bucket', 'a smoke alarm'], 'Pull, aim, squeeze in emergencies.', 'Fire extinguishers spray chemicals to smother small fires.', 'H'),
    ('a door stopper', ['I am small, rubber, and firm', 'I keep the door from slamming'], ['a wedge', 'a hook', 'a lock'], 'Doors lean on me politely.', 'Door stoppers wedge doors open so they cannot slam.', 'H'),
    ('a bottle opener', ['I bite metal caps off bottles', 'I hang by the fridge'], ['a knife', 'a corkscrew', 'a key'], 'One flick and the cap flies.', 'Bottle openers pry metal caps off drinks.', 'H'),
    ('a dustpan', ['Swept crumbs are poured into me', "I am the broom's flat partner"], ['a bin', 'a bowl', 'a bucket'], 'Sweep, scoop, bin.', 'Dustpans collect swept dirt and carry it to the bin.', 'H'),
    ('a clothes airer', ['Wet laundry drapes over my wings', 'I fold away when empty'], ['a rack', 'a line', 'a shelf'], 'Indoor drying wings.', 'Clothes airers hold laundry flat to dry indoors.', 'H'),
    ('a shoe horn', ['I ease heels into shoes', 'I am smooth and slightly curved'], ['a brush', 'a spoon? eh', 'a clip'], 'Slide the heel, no crushing.', 'Shoe horns guide heels into shoes without bending them.', 'H'),
    ('a toilet brush', ['I scrub the bowl clean', 'I live in a holder beside it'], ['a mop', 'a sponge', 'a broom'], "The bathroom's brave cleaner.", 'Toilet brushes scrub the bowl from their holder.', 'H'),
    ('a first aid kit', ['Plasters and bandages live in me', 'Open me for small emergencies'], ['a toolbox', 'a purse', 'a drawer'], 'Beep-free emergency helper.', 'First aid kits store plasters and bandages for scrapes.', 'H'),
    ('a plug adapter', ["I change a plug's shape to fit", 'Travelers carry me abroad'], ['a socket', 'an extension', 'a cable'], 'One shape to another.', 'Adapters reshape plugs to fit foreign sockets.', 'H'),
    ('a radiator', ['I hum warm through winter rooms', 'I have fins and a valve'], ['a heater', 'a fire', 'an oven'], 'Warmth rises from my ribs.', 'Radiators pump hot water through fins to warm rooms.', 'H'),
]



random.shuffle(FACTS)
KID_SUB = {"a": "Animal Riddles", "b": "Easy Kids Riddles", "c": "School Riddles"}
OBJ_SUB = {"a": "Household Items", "b": "Food & Kitchen", "c": "Nature & Weather"}
KID_MAP = {"A": "Animal Riddles", "K": "Easy Kids Riddles", "S": "School Riddles"}
OBJ_MAP = {"H": "Household Items", "F": "Food & Kitchen", "N": "Nature & Weather"}
Q_OPEN = ["What am I?", "Who or what am I?", "Can you name me?", "Guess my name!"]
LEVELS_K = ["easy", "easy", "medium", "medium", "easy", "medium", "hard", "medium"]
count_k = {"Animal Riddles": 0, "Easy Kids Riddles": 0, "School Riddles": 0}
count_o = {"Household Items": 0, "Food & Kitchen": 0, "Nature & Weather": 0}
COMBOS = [(0, 1), (1, 0), (0, 1), (1, 0)]
Q_TPL = [
    "I am not saying my name yet: {a}, and {b}. What am I?",
    "Riddle me this: {b0} — and {a0}. What am I?",
    "Two clues and one name: {a}. Also: {b}. Can you name me?",
    "Guess who: {b0}, and {a0}. Who or what am I?",
]
for item, clues, wrongs, hint, expl, kind in FACTS:
    is_kid_row = kind in KID_MAP
    for is_kid, counter, adder, levels in ((True, count_k, kadd, LEVELS_K), (False, count_o, oadd, LEVELS_K)):
        if is_kid != is_kid_row: continue
        subj = (KID_MAP if is_kid else OBJ_MAP)[kind]
        for ai, (x, y) in enumerate(COMBOS):
            if counter[subj] >= 100: break
            ca, cb = clues[x % len(clues)], clues[y % len(clues)]
            correct = item
            opts = [item] + [w for w in wrongs if w != item][:3]
            if len(opts) < 4: opts += ["a torch", "a bucket", "a ladder"][:4 - len(opts)]
            o = opts[:]; random.shuffle(o)
            ci = o.index(correct)
            lv = random.choice(levels)
            q = Q_TPL[ai % len(Q_TPL)].format(a=ca, b=cb, a0=ca[0].lower() + ca[1:], b0=cb[0].lower() + cb[1:])
            adder(q, o, ci, lv, subj, hint, expl)
            counter[subj] += 1

pathlib.Path("data-json").mkdir(exist_ok=True)
def write(items, slug, cat, chunk=100):
    part = 0
    for i in range(0, len(items), chunk):
        part += 1
        json.dump({"category": cat, "riddles": items[i:i+chunk]}, open("data-json/%s-%d.json" % (slug, part), "w", encoding="utf-8"), indent=0)
def stats(items): return {l: sum(1 for r in items if r["level"] == l) for l in ["easy","medium","hard"]}
write(KID, "kids-family", "Kids & Family"); write(OBJ, "everyday-objects", "Everyday Objects")
print("kids:", len(KID), count_k)
print("objects:", len(OBJ), count_o)
