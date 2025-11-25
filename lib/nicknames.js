// Comprehensive nickname mappings
const NICKNAME_MAP = {
  // Male names
  'abraham': ['abe', 'bram', 'ham'],
  'alexander': ['alex', 'al', 'xander', 'lex', 'sandy'],
  'andrew': ['andy', 'drew'],
  'anthony': ['tony', 'ant'],
  'benjamin': ['ben', 'benny', 'benji', 'bennie'],
  'charles': ['charlie', 'chuck', 'chas', 'charley'],
  'christopher': ['chris', 'kit', 'topher'],
  'daniel': ['dan', 'danny'],
  'david': ['dave', 'davey'],
  'donald': ['don', 'donnie'],
  'edward': ['ed', 'eddie', 'ted', 'ned'],
  'frederick': ['fred', 'freddy', 'rick'],
  'gerald': ['jerry', 'gerry'],
  'gregory': ['greg', 'gregg'],
  'harold': ['harry', 'hal'],
  'henry': ['hank', 'harry', 'hal'],
  'james': ['jim', 'jimmy', 'jamie', 'jay'],
  'john': ['jack', 'johnny', 'jon'],
  'jonathan': ['jon', 'nathan', 'nate'],
  'joseph': ['joe', 'joey', 'jo'],
  'joshua': ['josh'],
  'kenneth': ['ken', 'kenny'],
  'lawrence': ['larry', 'lars', 'laurie'],
  'leonard': ['leo', 'len', 'lenny'],
  'matthew': ['matt', 'matty'],
  'michael': ['mike', 'mikey', 'mick', 'mickey'],
  'nathan': ['nate', 'nat'],
  'nicholas': ['nick', 'nicky', 'nico'],
  'patrick': ['pat', 'paddy', 'rick'],
  'peter': ['pete', 'petey'],
  'philip': ['phil'],
  'raymond': ['ray'],
  'richard': ['rick', 'dick', 'rich', 'ricky'],
  'robert': ['rob', 'bob', 'bobby', 'robbie', 'bert'],
  'ronald': ['ron', 'ronnie'],
  'samuel': ['sam', 'sammy'],
  'stephen': ['steve', 'steven', 'steph'],
  'theodore': ['ted', 'teddy', 'theo'],
  'thomas': ['tom', 'tommy', 'thom'],
  'timothy': ['tim', 'timmy'],
  'walter': ['walt', 'wally'],
  'william': ['will', 'bill', 'billy', 'willy', 'liam'],
  
  // Female names
  'abigail': ['abby', 'gail'],
  'alexandra': ['alex', 'lexi', 'sandra', 'sandy'],
  'amanda': ['mandy', 'manda'],
  'barbara': ['barb', 'babs', 'barbie'],
  'catherine': ['cathy', 'cat', 'cate', 'kate', 'katie'],
  'christina': ['chris', 'tina', 'christie'],
  'deborah': ['deb', 'debbie', 'debby'],
  'dorothy': ['dot', 'dottie'],
  'elizabeth': ['liz', 'beth', 'betty', 'eliza', 'libby', 'lisa'],
  'jennifer': ['jen', 'jenny'],
  'jessica': ['jess', 'jessie'],
  'katherine': ['kate', 'katie', 'kathy', 'kat'],
  'kimberly': ['kim', 'kimmy'],
  'margaret': ['maggie', 'meg', 'peggy', 'marge'],
  'michelle': ['shelly', 'mich'],
  'nancy': ['nan'],
  'patricia': ['pat', 'patty', 'trish', 'patsy'],
  'rebecca': ['becca', 'becky'],
  'samantha': ['sam', 'sammy'],
  'stephanie': ['steph', 'stevie'],
  'susan': ['sue', 'susie', 'suzy'],
  'victoria': ['vicky', 'vic', 'tori']
};

function areNamesRelated(name1, name2) {
  if (!name1 || !name2) return false;
  
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  
  // Direct match
  if (n1 === n2) return true;
  
  // Check nickname relationships
  for (const [fullName, nicknames] of Object.entries(NICKNAME_MAP)) {
    // Check if one is full name and other is nickname
    if (n1 === fullName && nicknames.includes(n2)) return true;
    if (n2 === fullName && nicknames.includes(n1)) return true;
    
    // Check if both are nicknames of same name
    if (nicknames.includes(n1) && nicknames.includes(n2)) return true;
  }
  
  return false;
}

module.exports = { NICKNAME_MAP, areNamesRelated };
