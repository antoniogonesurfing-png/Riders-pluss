// TEST BOT profiles. Fictional, clearly labelled bots with illustrated robot avatars.
// They always like you back so matching and chat can be tested.
const bots = [
  { key: 'sol', name: 'Surfy Sol (Bot)', sports: [['Surf', 'Intermediate']], island: 'Fuerteventura', town: 'El Cotillo', color: '#e0703a',
    bio: 'Test bot. Dawn patrol fan, loves the lefts in El Cotillo and a café con leche after.',
    spots: ['El Cotillo', 'Majanicho', 'Rocky Point in Corralejo'], best: 'early mornings on a mid tide', tip: 'Check the swell direction: north swells light up the north shore.', gear: 'a 7\'2 mid-length and a 3/2 wetsuit most of the year' },
  { key: 'kiko', name: 'Kite Kiko (Bot)', sports: [['Kitesurf', 'Advanced']], island: 'Fuerteventura', town: 'Sotavento', color: '#2f8f9d',
    bio: 'Test bot. Lives for the summer trade winds on the Sotavento lagoon.',
    spots: ['Sotavento lagoon', 'Flag Beach', 'El Burro'], best: 'afternoons when the trade winds kick in', tip: 'Sotavento is best in summer; watch the tide for the lagoon.', gear: 'a 9 m and a 12 m kite' },
  { key: 'vela', name: 'Windy Vela (Bot)', sports: [['Windsurf', 'Advanced']], island: 'Gran Canaria', town: 'Pozo Izquierdo', color: '#3b6fb6',
    bio: 'Test bot. Wave sailing and big jumps when Pozo is howling.',
    spots: ['Pozo Izquierdo', 'Vargas', 'Sotavento in Fuerteventura'], best: 'July and August, when the wind is strongest', tip: 'Rig small at Pozo, it gets very windy.', gear: 'a 4.7 sail and an 85 L wave board' },
  { key: 'ola', name: 'Wing Ola (Bot)', sports: [['Wing foil', 'Intermediate']], island: 'Fuerteventura', town: 'Corralejo', color: '#7a5cc9',
    bio: 'Test bot. Learning to jibe on the foil, happy to share sessions.',
    spots: ['Flag Beach', 'Corralejo bay', 'Puerto del Rosario'], best: 'mid-morning when the wind is steady', tip: 'Start in flat water and a light breeze while you learn.', gear: 'a 5 m wing and a 1500 cm² front wing' },
  { key: 'pico', name: 'Pedal Pico (Bot)', sports: [['Cycling', 'Intermediate']], island: 'Fuerteventura', town: 'Betancuria', color: '#4a9a5b',
    bio: 'Test bot. Gravel loops and climbs through the volcanic interior.',
    spots: ['Betancuria climb', 'Lajares to El Cotillo gravel', 'Tindaya loop'], best: 'early mornings before the heat', tip: 'Carry extra water, there are few fountains out there.', gear: 'a gravel bike with 40 mm tyres' },
  { key: 'tara', name: 'Trail Tara (Bot)', sports: [['Running', 'Advanced']], island: 'Lanzarote', town: 'Haría', color: '#c2414b',
    bio: 'Test bot. Trail runner, volcano ridges and coastal paths.',
    spots: ['Haría valley', 'Famara cliffs path', 'Timanfaya edges (marked trails only)'], best: 'sunrise runs', tip: 'Lava gravel is tough on shoes, use trail shoes with a rock plate.', gear: 'trail shoes and a 1 L vest' },
  { key: 'luna', name: 'Zen Luna (Bot)', sports: [['Yoga', 'All levels']], island: 'Fuerteventura', town: 'Lajares', color: '#d49a2a',
    bio: 'Test bot. Sunset yoga, breathwork and stretching for surfers.',
    spots: ['Lajares', 'El Cotillo lagoons at sunset', 'Corralejo dunes'], best: 'sunset sessions', tip: 'A few minutes of hip mobility makes pop-ups easier.', gear: 'a travel mat' },
  { key: 'brisa', name: 'Sailor Brisa (Bot)', sports: [['Sailing', 'Advanced']], island: 'Lanzarote', town: 'Playa Blanca', color: '#1f6f8b',
    bio: 'Test bot. Island hopping between Lanzarote, Lobos and Fuerteventura.',
    spots: ['Marina Rubicón', 'Papagayo anchorages', 'Isla de Lobos'], best: 'calm mornings for the crossing', tip: 'The Bocaina strait can get choppy, plan around the wind.', gear: 'a 38 ft sloop (imaginary, I am a bot)' },
  { key: 'nalu', name: 'Barrel Nalu (Bot)', sports: [['Surf', 'Advanced']], island: 'Tenerife', town: 'Las Américas', color: '#e05a8a',
    bio: 'Test bot. Reef breaks in the south of Tenerife.',
    spots: ['La Izquierda', 'El Conquistador', 'Playa de las Américas'], best: 'winter swells', tip: 'Reefs are shallow at low tide, wear booties.', gear: 'a 6\'0 shortboard' },
  { key: 'frankie', name: 'Foamy Frankie (Bot)', sports: [['Surf', 'Beginner'], ['Yoga', 'Beginner']], island: 'Fuerteventura', town: 'Corralejo', color: '#f0a04b',
    bio: 'Test bot. Just learned to stand up, looking for a whitewater buddy.',
    spots: ['Glass Beach', 'Flag Beach', 'Playa del Moro'], best: 'small days with an instructor nearby', tip: 'Take a lesson first; the coaches know which beaches are safe.', gear: 'a big foamie' },
  { key: 'mika', name: 'Mixed Mika (Bot)', sports: [['Kitesurf', 'Intermediate'], ['Wing foil', 'Beginner']], island: 'Lanzarote', town: 'Famara', color: '#5a7d2a',
    bio: 'Test bot. Kites at Famara, trying to learn the wing.',
    spots: ['Famara beach', 'Costa Teguise', 'Playa de las Cucharas'], best: 'spring and summer afternoons', tip: 'Famara has strong currents; never kite alone.', gear: 'a 10 m kite and a borrowed wing' },
  { key: 'gus', name: 'Gravel Gus (Bot)', sports: [['Cycling', 'Beginner'], ['Running', 'Beginner']], island: 'Gran Canaria', town: 'Maspalomas', color: '#8a6d3b',
    bio: 'Test bot. Easy coastal rides and park runs, coffee mandatory.',
    spots: ['Maspalomas promenade', 'Pico de las Nieves (by car, then walk)', 'Meloneras'], best: 'cool mornings', tip: 'The interior climbs are steep; start with the coast.', gear: 'a hybrid bike' },
];

const FIRST_MESSAGE = "Hi guys, I'm a bot. I'm here so you can test the functionality of the app.";

function botReply(bot, text) {
  const t = (text || '').toLowerCase();
  const sport = bot.sports[0][0];
  const level = bot.sports[0][1];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  if (/\b(bot|real|human|person|ai)\b/.test(t)) return `Yes, I'm a test bot, not a real person. I answer with simple scripted replies so you can try the chat. Real riders will show up here at launch.`;
  if (/(where|spot|beach|place|location|break)/.test(t)) return `My favourite spots are ${bot.spots.join(', ')}. ${bot.tip}`;
  if (/(when|time|tomorrow|today|weekend|session|meet|join)/.test(t)) return `I usually go ${bot.best}. As a bot I can't actually meet you, but this is where you'd plan a session with a real rider.`;
  if (/(wind|wave|swell|forecast|condition|tide)/.test(t)) return `${bot.tip} Always check the local forecast and conditions before heading out.`;
  if (/(level|good|experience|beginner|advanced|intermediate)/.test(t)) return `I'd call myself ${level.toLowerCase()} at ${sport.toLowerCase()}. Be honest about your level, it keeps everyone safe.`;
  if (/(gear|board|kite|sail|bike|wetsuit|rent|equipment)/.test(t)) return `I ride ${bot.gear}. Local schools and shops rent kit if you're travelling light.`;
  if (/(event|party|festival|market|fiesta)/.test(t)) return `Check the Events tab: it lists real Canary Islands events by month and island. You can RSVP there too.`;
  if (/(retreat|trip|camp|mentawai|silabu|africa|sail)/.test(t)) return `Have a look at the Retreats tab: Ride With Us Retreats lists its trips there, from Fuerteventura weeks to the Mentawai expedition.`;
  if (/\b(hi|hey|hello|hola|yo|buenas)\b/.test(t)) return pick([`Hey! ${bot.name.replace(' (Bot)', '')} here. I'm into ${sport.toLowerCase()} around ${bot.town}. What do you ride?`, `Hola! Nice to match. Fancy a ${sport.toLowerCase()} session around ${bot.town}?`]);
  if (/(thank|thanks|gracias|cheers|cool|great|nice)/.test(t)) return pick(['Anytime! 🤙', 'Stoked! Enjoy testing the app.', 'Cheers! Report any bug with the button at the bottom.']);
  if (/(bye|ciao|adios|later)/.test(t)) return 'See you in the water! (Well, not really, I\'m a bot.)';
  return pick([`Nice! I'm mostly thinking about ${sport.toLowerCase()} right now. Ask me about spots, conditions or gear.`, `Interesting! Try asking me "where do you ride?" or "what gear do you use?"`, `I'm a simple test bot, so I only know a few things: spots, conditions, level, gear, events and retreats.`]);
}

module.exports = { bots, FIRST_MESSAGE, botReply };
