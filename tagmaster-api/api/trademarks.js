// trademarks.js — Chrome Extension Version
const CRITICAL_TERMS = [
  'disney','walt disney','pixar','mickey mouse','minnie mouse','donald duck',
  'goofy','pluto','daisy duck','dumbo','bambi','cinderella','snow white',
  'sleeping beauty','the little mermaid','ariel','belle','jasmine','mulan',
  'pocahontas','tiana','rapunzel','merida','moana','raya','encanto','mirabel',
  'frozen','elsa','anna','olaf','sven','toy story','woody','buzz lightyear',
  'finding nemo','dory','the incredibles','cars','lightning mcqueen',
  'wall-e','up','inside out','coco','soul','luca','turning red',
  'star wars','lucasfilm','darth vader','luke skywalker','yoda','r2d2','c3po',
  'stormtrooper','jedi','sith','mandalorian','baby yoda','grogu','rey',
  'han solo','chewbacca','millennium falcon','death star','lightsaber',
  'indiana jones','marvel','avengers','iron man','captain america','thor','hulk',
  'black widow','spider-man','spiderman','black panther','doctor strange','ant-man',
  'guardians of the galaxy','groot','rocket raccoon','deadpool','wolverine',
  'x-men','fantastic four','thanos','hawkeye','scarlet witch','vision',
  'winter soldier','falcon','war machine','captain marvel','dc comics','batman',
  'superman','wonder woman','aquaman','the flash','green lantern','joker',
  'harley quinn','catwoman','lex luthor','shazam','cyborg','justice league',
  'gotham','metropolis','nightwing','warner bros','harry potter','hermione',
  'ron weasley','dumbledore','hogwarts','gryffindor','slytherin','hufflepuff',
  'ravenclaw','voldemort','fantastic beasts','newt scamander','lord of the rings',
  'hobbit','gandalf','frodo','bilbo','sauron','gollum','game of thrones',
  'jon snow','daenerys','house of dragon','looney tunes','bugs bunny',
  'daffy duck','tweety','sylvester','tom and jerry','scooby doo',
  'flintstones','jetsons','stranger things','eleven','hawkins','squid game',
  'bridgerton','the witcher','geralt','wednesday addams','cobra kai','spongebob',
  'patrick star','squidward','bikini bottom','dora the explorer','paw patrol',
  'teenage mutant ninja turtles','tmnt','rugrats','avatar the last airbender',
  'adventure time','steven universe','regular show','powerpuff girls',
  'dexter laboratory','bluey','the simpsons','homer simpson','bart simpson',
  'family guy','peter griffin','futurama','bender','south park','cartman',
  'bob burgers','king of the hill','pokemon','pikachu','charizard','mewtwo',
  'eevee','snorlax','pokeball','dragon ball','goku','vegeta','naruto','sasuke',
  'itachi','kakashi','one piece','luffy','attack on titan','eren','levi ackerman',
  'demon slayer','tanjiro','nezuko','rengoku','my hero academia','deku','bakugo',
  'todoroki','jujutsu kaisen','gojo','bleach','ichigo','fullmetal alchemist',
  'edward elric','death note','chainsaw man','spy x family','hello kitty',
  'sanrio','kuromi','cinnamoroll','nintendo','mario','luigi','princess peach',
  'bowser','yoshi','toad','zelda','link','ganondorf','hyrule','triforce',
  'donkey kong','kirby','metroid','samus','pokemon company','sony playstation',
  'playstation','xbox','microsoft gaming','fortnite','epic games','minecraft',
  'creeper','among us','roblox','league of legends','overwatch','blizzard',
  'world of warcraft','call of duty','grand theft auto','gta','rockstar games',
  'red dead redemption','cyberpunk 2077','god of war','kratos','halo',
  'master chief','assassins creed','final fantasy','resident evil',
  'street fighter','mortal kombat','sonic the hedgehog','sega','pac-man',
  'nfl','nba','nhl','mlb','mls','nascar','fifa','uefa','premier league',
  'champions league','europa league','la liga','serie a','bundesliga','afl',
  'nrl','ncaa','super bowl','world series','stanley cup','nba finals',
  'wimbledon','olympics','paralympics','dallas cowboys','new england patriots',
  'green bay packers','san francisco 49ers','chicago bears','new york giants',
  'new york jets','miami dolphins','buffalo bills','kansas city chiefs',
  'las vegas raiders','los angeles rams','los angeles chargers','seattle seahawks',
  'arizona cardinals','denver broncos','baltimore ravens','cleveland browns',
  'pittsburgh steelers','cincinnati bengals','jacksonville jaguars',
  'tennessee titans','indianapolis colts','houston texans','new orleans saints',
  'atlanta falcons','carolina panthers','tampa bay buccaneers','philadelphia eagles',
  'washington commanders','detroit lions','minnesota vikings','los angeles lakers',
  'golden state warriors','chicago bulls','boston celtics','miami heat',
  'brooklyn nets','new york knicks','toronto raptors','milwaukee bucks',
  'phoenix suns','dallas mavericks','denver nuggets','memphis grizzlies',
  'cleveland cavaliers','philadelphia 76ers','new york yankees','boston red sox',
  'los angeles dodgers','chicago cubs','san francisco giants','houston astros',
  'atlanta braves','st louis cardinals','manchester united','manchester city',
  'liverpool fc','chelsea fc','arsenal fc','tottenham hotspur','real madrid',
  'barcelona fc','atletico madrid','juventus','ac milan','inter milan',
  'bayern munich','borussia dortmund','psg','paris saint germain','nike',
  'adidas','puma','reebok','new balance','under armour','converse','vans shoes',
  'timberland','dr martens','ugg boots','gucci','louis vuitton','chanel',
  'prada','hermes','versace','balenciaga','givenchy','dior','yves saint laurent',
  'ysl','burberry','coach','michael kors','kate spade','tory burch',
  'ralph lauren','tommy hilfiger','calvin klein','hugo boss','supreme clothing',
  'off-white','bape','yeezy','air jordan','rolex','omega watch','cartier',
  'ray ban','oakley','apple inc','iphone','ipad','macbook','airpods',
  'apple watch','google','youtube','gmail','android','samsung','tesla','spacex',
  'amazon','amazon prime','starbucks','mcdonalds','burger king','coca cola',
  'pepsi','red bull','monster energy','heineken','budweiser','jack daniels',
  'harley davidson','ferrari','lamborghini','porsche','bentley','rolls royce',
  'lego','barbie','mattel','hasbro','stanley cup brand','yeti coolers',
  'hydro flask','nasa','coachella','taylor swift','swiftie','eras tour',
  'beyonce','rihanna','drake','kanye west','eminem','lady gaga','ariana grande',
  'billie eilish','olivia rodrigo','doja cat','cardi b','nicki minaj',
  'post malone','the weeknd','ed sheeran','harry styles','one direction',
  'bts kpop','blackpink','bad bunny','michael jackson','elvis presley','tupac',
  'biggie smalls','bob marley','nirvana','metallica','led zeppelin','the beatles',
  'rolling stones','queen band','david bowie','madonna','whitney houston',
  'mariah carey','dolly parton','johnny cash','jurassic park','jurassic world',
  'transformers','ghostbusters','back to the future','top gun','mission impossible',
  'james bond','john wick','the matrix','fast and furious','rocky','rambo',
  'terminator','alien franchise','die hard','jaws movie','the godfather',
  'scarface','pulp fiction','the dark knight','minions','despicable me',
  'kung fu panda','shrek','donald trump','joe biden','barack obama','elon musk',
  'jeff bezos','kim kardashian','kylie jenner','oprah winfrey'
];

const WARNING_TERMS = [
  'princess','superhero','avenger','jedi','inspired by','fan art','parody',
  'harvard','yale','notre dame','alabama crimson tide','coachella','burning man',
  'super bowl','world cup','swiftie','beekeeper','eras','mandalorian'
];

const REPLACEMENTS = {
  'disney princess':'fairy tale princess','marvel avengers':'superhero team',
  'star wars':'space battle','harry potter':'wizard school','hogwarts':'magic academy',
  'nfl':'american football','nba':'basketball fan','taylor swift':'pop star concert',
  'eras tour':'concert tour','stanley cup':'insulated tumbler','mickey mouse':'cartoon mouse',
  'super bowl':'football championship','pokemon':'pocket monster','minecraft':'block building game',
  'fortnite':'battle royale game','starbucks':'coffee lover','iphone':'smartphone',
  'ipad':'tablet','macbook':'laptop','nike':'athletic wear','gucci':'luxury fashion',
  'nasa':'space exploration','olympic':'sports champion'
};

function normalize(str){
  return str.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/0/g,'o').replace(/1/g,'i')
 .replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/\s+/g,' ').trim();
}

function levenshtein(a,b){
  if(a.length===0)return b.length;if(b.length===0)return a.length;
  const m=Array.from({length:b.length+1},(_,j)=>Array.from({length:a.length+1},(_,i)=>(j===0?i:i===0?j:0)));
  for(let j=1;j<=b.length;j++){for(let i=1;i<=a.length;i++){
    const c=a[i-1]===b[j-1]?0:1;m[j][i]=Math.min(m[j-1][i]+1,m[j][i-1]+1,m[j-1][i-1]+c);
  }}return m[b.length][a.length];
}

function containsTrademark(tag,term){
  const nTag=normalize(tag);const nTerm=normalize(term);
  const padded=` ${nTag} `;if(padded.includes(` ${nTerm} `))return{match:true,type:'exact'};
  if(nTag.startsWith(nTerm)||nTag.endsWith(nTerm))return{match:true,type:'boundary'};
  const tagNoSpace=nTag.replace(/\s/g,'');const termNoSpace=nTerm.replace(/\s/g,'');
  if(tagNoSpace.includes(termNoSpace))return{match:true,type:'concat'};
  const tagWords=nTag.split(' ');const termWords=nTerm.split(' ');
  for(const tWord of termWords){if(tWord.length<4)continue;
    for(const tagWord of tagWords){if(tagWord.length<4)continue;
      const maxDist=tWord.length<=5?1:2;
      if(levenshtein(tagWord,tWord)<=maxDist)return{match:true,type:'fuzzy',term:tWord,tagWord};
    }}return{match:false};
}

function filterTags(tags){
  if(!Array.isArray(tags))return{safe:[],blocked:[]};
  const safe=[];const blocked=[];
  for(const rawTag of tags){const tag=rawTag.trim();if(!tag)continue;let risk=null;
    for(const term of CRITICAL_TERMS){const check=containsTrademark(tag,term);
      if(check.match){risk={tag,reason:`Registered trademark: "${term}"`,severity:'CRITICAL',
      matchType:check.type,suggestion:REPLACEMENTS[normalize(term)]||null};break;}}
    if(!risk){for(const term of WARNING_TERMS){const check=containsTrademark(tag,term);
      if(check.match){risk={tag,reason:`High-risk term: "${term}" — use with caution`,
      severity:'WARNING',matchType:check.type,suggestion:REPLACEMENTS[normalize(term)]||null};break;}}}
    if(!risk){const n=normalize(tag);
      if(/iphone|ipad|macbook|airpod/.test(n)){risk={tag,reason:'Apple product name',
      severity:'CRITICAL',matchType:'combo',suggestion:'smartphone, tablet, laptop'};}
      else if(/air jordan|yeezy/.test(n)){risk={tag,reason:'Nike/Adidas sub-brand',
      severity:'CRITICAL',matchType:'combo',suggestion:'athletic sneaker'};}
      else if(/eras tour|swiftie/.test(n)){risk={tag,reason:'Taylor Swift trademark',
      severity:'CRITICAL',matchType:'combo',suggestion:'concert tour, pop music fan'};}}
    risk?blocked.push(risk):safe.push(tag);
  }return{safe,blocked};
}

function checkTrademarks(text){
  const lower=normalize(text);
  return CRITICAL_TERMS.filter(tm=>containsTrademark(lower,tm).match);
}

function filterTrademarkedTags(tags){
  return filterTags(tags).safe;
}

function getRiskScore(tags){
  const{blocked}=filterTags(tags);
  const critical=blocked.filter(b=>b.severity==='CRITICAL').length;
  if(critical>0)return{score:0,label:'CRITICAL',color:'#dc2626'};
  if(blocked.length>0)return{score:50,label:'WARNING',color:'#d97706'};
  return{score:100,label:'SAFE',color:'#16a34a'};
}

function addTerm(term,severity='CRITICAL'){
  const normalized=normalize(term);
  if(severity==='CRITICAL')CRITICAL_TERMS.push(normalized);
  else WARNING_TERMS.push(normalized);
}

window.TrademarkFilter={
  filterTags,checkTrademarks,filterTrademarkedTags,getRiskScore,addTerm,CRITICAL_TERMS,WARNING_TERMS
};
