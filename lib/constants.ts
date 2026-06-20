import { Team, Venue } from './types';

export const TEAMS: Team[] = [
  {
    name: 'India',
    code: 'IND',
    color: '#004B87', // Royal Blue
    secondaryColor: '#FF671F', // Saffron
    battingStrength: 1.15,
    bowlingStrength: 1.12,
  },
  {
    name: 'Australia',
    code: 'AUS',
    color: '#FFCD00', // Gold
    secondaryColor: '#00843D', // Green
    battingStrength: 1.12,
    bowlingStrength: 1.15,
  },
  {
    name: 'England',
    code: 'ENG',
    color: '#0A192F', // Navy Blue
    secondaryColor: '#E61E2B', // Red
    battingStrength: 1.10,
    bowlingStrength: 1.08,
  },
  {
    name: 'Pakistan',
    code: 'PAK',
    color: '#006643', // Pakistan Green
    secondaryColor: '#FFFFFF',
    battingStrength: 1.02,
    bowlingStrength: 1.10,
  },
  {
    name: 'South Africa',
    code: 'RSA',
    color: '#007A4D', // Forest Green
    secondaryColor: '#E6A100', // Yellow
    battingStrength: 1.08,
    bowlingStrength: 1.12,
  },
  {
    name: 'New Zealand',
    code: 'NZL',
    color: '#111111', // Black
    secondaryColor: '#CCCCCC',
    battingStrength: 1.06,
    bowlingStrength: 1.08,
  },
  {
    name: 'Chennai Super Kings',
    code: 'CSK',
    color: '#F9CD05', // CSK Yellow
    secondaryColor: '#005CA9', // Blue
    battingStrength: 1.10,
    bowlingStrength: 1.06,
  },
  {
    name: 'Mumbai Indians',
    code: 'MI',
    color: '#004B87', // MI Blue
    secondaryColor: '#D1AB3A', // Gold
    battingStrength: 1.12,
    bowlingStrength: 1.08,
  },
  {
    name: 'Royal Challengers Bengaluru',
    code: 'RCB',
    color: '#2B2B2B', // RCB Red/Black
    secondaryColor: '#C39A3D', // Gold
    battingStrength: 1.14,
    bowlingStrength: 1.02,
  },
  {
    name: 'Kolkata Knight Riders',
    code: 'KKR',
    color: '#3A225D', // KKR Purple
    secondaryColor: '#F2C937', // Gold
    battingStrength: 1.11,
    bowlingStrength: 1.10,
  }
];

export const VENUES: Venue[] = [
  {
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    avgFirstInningsT20: 188,
    avgFirstInningsODI: 295,
    multiplier: 1.16,
    pitchType: 'Flat',
    description: 'A batsman\'s paradise. Small boundary dimensions combined with a high-altitude quick outfield make this the highest scoring ground in India.',
    spinAssist: 2,
    paceAssist: 2,
  },
  {
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    avgFirstInningsT20: 182,
    avgFirstInningsODI: 285,
    multiplier: 1.10,
    pitchType: 'Flat',
    description: 'Excellent batting track next to the Arabian sea. Red soil offers true bounce. Short boundaries make six-hitting easy, especially under lights with dew.',
    spinAssist: 2,
    paceAssist: 3,
  },
  {
    name: 'MA Chidambaram Stadium',
    city: 'Chennai',
    avgFirstInningsT20: 158,
    avgFirstInningsODI: 245,
    multiplier: 0.88,
    pitchType: 'Dusty',
    description: 'Historically slow and dry clay pitch. Heavily assists spinners. Scoring becomes difficult in the middle overs as the ball grips and turns.',
    spinAssist: 5,
    paceAssist: 2,
  },
  {
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    avgFirstInningsT20: 172,
    avgFirstInningsODI: 260,
    multiplier: 1.02,
    pitchType: 'Balanced',
    description: 'The world\'s largest cricket stadium. Features multiple pitch strips (red & black soil). Generally offers a balanced contest between bat and ball.',
    spinAssist: 3,
    paceAssist: 4,
  },
  {
    name: 'Eden Gardens',
    city: 'Kolkata',
    avgFirstInningsT20: 178,
    avgFirstInningsODI: 275,
    multiplier: 1.07,
    pitchType: 'Flat',
    description: 'Known for a fast outfield and friendly batting surface. Pace bowlers get assistance early on, but it becomes a scoring haven as the game progresses.',
    spinAssist: 3,
    paceAssist: 3,
  },
  {
    name: 'Lord\'s Cricket Ground',
    city: 'London',
    avgFirstInningsT20: 162,
    avgFirstInningsODI: 255,
    multiplier: 0.96,
    pitchType: 'Green',
    description: 'The Home of Cricket features a unique slope that creates unusual angles. Green grass covers usually offer swing and seam to pace bowlers.',
    spinAssist: 2,
    paceAssist: 5,
  },
  {
    name: 'Melbourne Cricket Ground',
    city: 'Melbourne',
    avgFirstInningsT20: 160,
    avgFirstInningsODI: 250,
    multiplier: 0.95,
    pitchType: 'Balanced',
    description: 'Huge boundary sizes mean batsmen must run hard. Offers good carry and bounce for pacers, but batsmen can score once adjusted to the bounce.',
    spinAssist: 3,
    paceAssist: 4,
  }
];

// Squad arrays for realistic name generation during simulations
export const SQUADS: Record<string, { batsmen: string[]; bowlers: string[] }> = {
  IND: {
    batsmen: ['Virat Kohli', 'Rohit Sharma', 'Shubman Gill', 'Rishabh Pant', 'Hardik Pandya', 'Suryakumar Yadav', 'Yashasvi Jaiswal', 'Ravindra Jadeja'],
    bowlers: ['Jasprit Bumrah', 'Mohammed Siraj', 'Kuldeep Yadav', 'Arshdeep Singh', 'Axar Patel', 'Yuzvendra Chahal']
  },
  AUS: {
    batsmen: ['Travis Head', 'David Warner', 'Mitchell Marsh', 'Glenn Maxwell', 'Steve Smith', 'Marcus Stoinis', 'Matthew Wade', 'Cameron Green'],
    bowlers: ['Pat Cummins', 'Mitchell Starc', 'Josh Hazlewood', 'Adam Zampa', 'Nathan Lyon', 'Sean Abbott']
  },
  ENG: {
    batsmen: ['Jos Buttler', 'Phil Salt', 'Will Jacks', 'Jonny Bairstow', 'Harry Brook', 'Liam Livingstone', 'Moeen Ali', 'Ben Stokes'],
    bowlers: ['Jofra Archer', 'Adil Rashid', 'Mark Wood', 'Reece Topley', 'Sam Curran', 'Chris Jordan']
  },
  PAK: {
    batsmen: ['Babar Azam', 'Mohammad Rizwan', 'Fakhar Zaman', 'Saim Ayub', 'Iftikhar Ahmed', 'Azam Khan', 'Shadab Khan', 'Imad Wasim'],
    bowlers: ['Shaheen Afridi', 'Naseem Shah', 'Haris Rauf', 'Mohammad Amir', 'Abbas Afridi', 'Usama Mir']
  },
  RSA: {
    batsmen: ['Quinton de Kock', 'Reeza Hendricks', 'Aiden Markram', 'Heinrich Klaasen', 'David Miller', 'Tristan Stubbs', 'Marco Jansen'],
    bowlers: ['Kagiso Rabada', 'Anrich Nortje', 'Keshav Maharaj', 'Tabraiz Shamsi', 'Gerald Coetzee', 'Ottneil Baartman']
  },
  NZL: {
    batsmen: ['Devon Conway', 'Finn Allen', 'Kane Williamson', 'Daryl Mitchell', 'Glenn Phillips', 'Mark Chapman', 'Rachin Ravindra', 'James Neesham'],
    bowlers: ['Trent Boult', 'Tim Southee', 'Mitchell Santner', 'Matt Henry', 'Lockie Ferguson', 'Ish Sodhi']
  },
  CSK: {
    batsmen: ['Ruturaj Gaikwad', 'Rachin Ravindra', 'Shivam Dube', 'Daryl Mitchell', 'Ravindra Jadeja', 'MS Dhoni', 'Sameer Rizvi', 'Moeen Ali'],
    bowlers: ['Matheesha Pathirana', 'Deepak Chahar', 'Tushar Deshpande', 'Maheesh Theekshana', 'Mustafizur Rahman', 'Shardul Thakur']
  },
  MI: {
    batsmen: ['Rohit Sharma', 'Ishan Kishan', 'Suryakumar Yadav', 'Tilak Varma', 'Hardik Pandya', 'Tim David', 'Naman Dhir', 'Romario Shepherd'],
    bowlers: ['Jasprit Bumrah', 'Gerald Coetzee', 'Piyush Chawla', 'Akash Madhwal', 'Nuwan Thushara', 'Shreyas Gopal']
  },
  RCB: {
    batsmen: ['Virat Kohli', 'Faf du Plessis', 'Rajat Patidar', 'Glenn Maxwell', 'Cameron Green', 'Dinesh Karthik', 'Mahipal Lomror', 'Will Jacks'],
    bowlers: ['Mohammed Siraj', 'Yash Dayal', 'Lockie Ferguson', 'Karn Sharma', 'Reece Topley', 'Mayank Dagar']
  },
  KKR: {
    batsmen: ['Sunil Narine', 'Phil Salt', 'Angkrish Raghuvanshi', 'Shreyas Iyer', 'Venkatesh Iyer', 'Rinku Singh', 'Andre Russell', 'Ramandeep Singh'],
    bowlers: ['Mitchell Starc', 'Harshit Rana', 'Varun Chakaravarthy', 'Sunil Narine', 'Andre Russell', 'Suyash Sharma']
  }
};
