import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../public/locales');

const RAGDOLL_KEYS_DEFAULTS = {
    // GREETINGS
    "ragdoll.greetings.hi": "Hi!",
    "ragdoll.greetings.hello": "Hello!",
    "ragdoll.greetings.hey": "Hey!",
    "ragdoll.greetings.yo": "Yo!",
    
    // HAPPY
    "ragdoll.happy.yay": "Yay!",
    "ragdoll.happy.woohoo": "Woohoo!",
    "ragdoll.happy.nice": "Nice!",
    "ragdoll.happy.cool": "Cool!",
    
    // SAD
    "ragdoll.sad.oww": "Oww...",
    "ragdoll.sad.ouch": "Ouch!",
    "ragdoll.sad.noo": "Noo...",
    
    // ANGRY
    "ragdoll.angry.grr": "Grr!",
    "ragdoll.angry.hmph": "Hmph!",
    "ragdoll.angry.stop": "Stop!",
    
    // SCARED
    "ragdoll.scared.eek": "Eek!",
    "ragdoll.scared.help": "Help!",
    "ragdoll.scared.ahh": "Ahh!",
    
    // SURPRISED
    "ragdoll.surprised.oh": "Oh!",
    "ragdoll.surprised.wow": "Wow!",
    "ragdoll.surprised.what": "What?!",
    
    // TIRED
    "ragdoll.tired.zzz": "Zzz...",
    "ragdoll.tired.yawn": "*yawn*",
    "ragdoll.tired.sleepy": "Sleepy...",
    
    // THINKING
    "ragdoll.thinking.hmm": "Hmm...",
    "ragdoll.thinking.whatif": "What if...",
    
    // CONFUSED
    "ragdoll.confused.huh": "Huh?",
    "ragdoll.confused.what": "What?",
    
    // EATING
    "ragdoll.eating.yum": "Yum!",
    "ragdoll.eating.nomnom": "Nom nom",
    "ragdoll.eating.tasty": "Tasty!",
    
    // DRINKING
    "ragdoll.drinking.gulp": "Gulp!",
    "ragdoll.drinking.sip": "*sip*",
    "ragdoll.drinking.ahhh": "Ahhh!",
    
    // EXERCISE
    "ragdoll.exercising.hup": "Hup!",
    "ragdoll.exercising.one": "One!",
    "ragdoll.exercising.two": "Two!",
    
    // CELEBRATION
    "ragdoll.celebrating.yeah": "Yeah!",
    "ragdoll.celebrating.wooo": "Wooo!",
    "ragdoll.celebrating.yess": "Yess!",
    
    // BOREDOM
    "ragdoll.bored.sigh": "Sigh...",
    "ragdoll.bored.meh": "Meh...",
    "ragdoll.bored.sobored": "So bored",
    
    // LOVE
    "ragdoll.love.aww": "Aww!",
    "ragdoll.love.loveit": "Love it!",
    
    // HURT
    "ragdoll.hurt.ow": "Ow!",
    "ragdoll.hurt.thathurt": "That hurt!",
    "ragdoll.hurt.ouch": "Ouch!",
    
    // JUMPING
    "ragdoll.jumping.whee": "Whee!",
    
    // COOL
    "ragdoll.cool.cool": "Cool!",
    "ragdoll.cool.socool": "So cool!",
    "ragdoll.cool.stylin": "Stylin'",
    
    // HUNGRY
    "ragdoll.hungry.hungry": "Hungry...",
    "ragdoll.hungry.needfood": "Need food",
    "ragdoll.hungry.pizza": "Pizza?",
    
    // FUNNY
    "ragdoll.funny.haha": "Haha!",
    "ragdoll.funny.lol": "LOL",
    "ragdoll.funny.funny": "Funny!"
};

// Specialized translations for ES, FR, IT, DE, PT
const LOCALIZED_TRANSLATIONS = {
    es: {
        "ragdoll.greetings.hi": "¡Hola!",
        "ragdoll.greetings.hello": "¡Hola!",
        "ragdoll.greetings.hey": "¡Ey!",
        "ragdoll.greetings.yo": "¡Yo!",
        "ragdoll.happy.yay": "¡Yupi!",
        "ragdoll.happy.woohoo": "¡Ujú!",
        "ragdoll.happy.nice": "¡Bien!",
        "ragdoll.happy.cool": "¡Mola!",
        "ragdoll.sad.oww": "¡Ay!...",
        "ragdoll.sad.ouch": "¡Ay!",
        "ragdoll.sad.noo": "¡Noo!...",
        "ragdoll.angry.grr": "¡Grr!",
        "ragdoll.angry.hmph": "¡Hmph!",
        "ragdoll.angry.stop": "¡Para!",
        "ragdoll.scared.eek": "¡Uy!",
        "ragdoll.scared.help": "¡Ayuda!",
        "ragdoll.scared.ahh": "¡Ahh!",
        "ragdoll.surprised.oh": "¡Oh!",
        "ragdoll.surprised.wow": "¡Guau!",
        "ragdoll.surprised.what": "¡¿Qué?!",
        "ragdoll.tired.zzz": "Zzz...",
        "ragdoll.tired.yawn": "*bostezo*",
        "ragdoll.tired.sleepy": "Tengo sueño...",
        "ragdoll.thinking.hmm": "Hmm...",
        "ragdoll.thinking.whatif": "¿Y si...",
        "ragdoll.confused.huh": "¿Eh?",
        "ragdoll.confused.what": "¿Qué?",
        "ragdoll.eating.yum": "¡Rico!",
        "ragdoll.eating.nomnom": "Ñam ñam",
        "ragdoll.eating.tasty": "¡Sabroso!",
        "ragdoll.drinking.gulp": "¡Glup!",
        "ragdoll.drinking.sip": "*sorbo*",
        "ragdoll.drinking.ahhh": "¡Ahhh!",
        "ragdoll.exercising.hup": "¡Aupa!",
        "ragdoll.exercising.one": "¡Uno!",
        "ragdoll.exercising.two": "¡Dos!",
        "ragdoll.celebrating.yeah": "¡Sí!",
        "ragdoll.celebrating.wooo": "¡Wooo!",
        "ragdoll.celebrating.yess": "¡Sii!",
        "ragdoll.bored.sigh": "*suspiro*...",
        "ragdoll.bored.meh": "Meh...",
        "ragdoll.bored.sobored": "Qué aburrimiento",
        "ragdoll.love.aww": "¡Ohhh!",
        "ragdoll.love.loveit": "¡Me encanta!",
        "ragdoll.hurt.ow": "¡Ay!",
        "ragdoll.hurt.thathurt": "¡Eso dolió!",
        "ragdoll.hurt.ouch": "¡Ay!",
        "ragdoll.jumping.whee": "¡Bieeen!",
        "ragdoll.cool.cool": "¡Guay!",
        "ragdoll.cool.socool": "¡Súper mola!",
        "ragdoll.cool.stylin": "Con estilo",
        "ragdoll.hungry.hungry": "Tengo hambre...",
        "ragdoll.hungry.needfood": "Necesito comida",
        "ragdoll.hungry.pizza": "¿Pizza?",
        "ragdoll.funny.haha": "¡Jaja!",
        "ragdoll.funny.lol": "LOL",
        "ragdoll.funny.funny": "¡Gracioso!"
    },
    fr: {
        "ragdoll.greetings.hi": "Salut !",
        "ragdoll.greetings.hello": "Bonjour !",
        "ragdoll.greetings.hey": "Hé !",
        "ragdoll.greetings.yo": "Yo !",
        "ragdoll.happy.yay": "Super !",
        "ragdoll.happy.woohoo": "Génial !",
        "ragdoll.happy.nice": "Bien !",
        "ragdoll.happy.cool": "Cool !",
        "ragdoll.sad.oww": "Aïe...",
        "ragdoll.sad.ouch": "Aïe !",
        "ragdoll.sad.noo": "Non...",
        "ragdoll.angry.grr": "Grr !",
        "ragdoll.angry.hmph": "Hmph !",
        "ragdoll.angry.stop": "Arrête !",
        "ragdoll.scared.eek": "Eek !",
        "ragdoll.scared.help": "À l'aide !",
        "ragdoll.scared.ahh": "Ahh !",
        "ragdoll.surprised.oh": "Oh !",
        "ragdoll.surprised.wow": "Wow !",
        "ragdoll.surprised.what": "Quoi ?!",
        "ragdoll.tired.zzz": "Zzz...",
        "ragdoll.tired.yawn": "*bâillement*",
        "ragdoll.tired.sleepy": "Fatigué...",
        "ragdoll.thinking.hmm": "Hmm...",
        "ragdoll.thinking.whatif": "Et si...",
        "ragdoll.confused.huh": "Hein ?",
        "ragdoll.confused.what": "Quoi ?",
        "ragdoll.eating.yum": "Miam !",
        "ragdoll.eating.nomnom": "Miam miam",
        "ragdoll.eating.tasty": "Délicieux !",
        "ragdoll.drinking.gulp": "Glope !",
        "ragdoll.drinking.sip": "*gorgée*",
        "ragdoll.drinking.ahhh": "Ahhh !",
        "ragdoll.exercising.hup": "Hop !",
        "ragdoll.exercising.one": "Un !",
        "ragdoll.exercising.two": "Deux !",
        "ragdoll.celebrating.yeah": "Ouais !",
        "ragdoll.celebrating.wooo": "Wooo !",
        "ragdoll.celebrating.yess": "Ouii !",
        "ragdoll.bored.sigh": "Soupir...",
        "ragdoll.bored.meh": "Meh...",
        "ragdoll.bored.sobored": "Trop ennuyé",
        "ragdoll.love.aww": "Aww !",
        "ragdoll.love.loveit": "J'adore !",
        "ragdoll.hurt.ow": "Aïe !",
        "ragdoll.hurt.thathurt": "Ça fait mal !",
        "ragdoll.hurt.ouch": "Aïe !",
        "ragdoll.jumping.whee": "Whee !",
        "ragdoll.cool.cool": "Cool !",
        "ragdoll.cool.socool": "Trop cool !",
        "ragdoll.cool.stylin": "Stylé",
        "ragdoll.hungry.hungry": "Faim...",
        "ragdoll.hungry.needfood": "Besoin de manger",
        "ragdoll.hungry.pizza": "Pizza ?",
        "ragdoll.funny.haha": "Haha !",
        "ragdoll.funny.lol": "MDR",
        "ragdoll.funny.funny": "Drôle !"
    },
    it: {
        "ragdoll.greetings.hi": "Ciao!",
        "ragdoll.greetings.hello": "Ciao!",
        "ragdoll.greetings.hey": "Ehi!",
        "ragdoll.greetings.yo": "Yo!",
        "ragdoll.happy.yay": "Evviva!",
        "ragdoll.happy.woohoo": "Woohoo!",
        "ragdoll.happy.nice": "Bene!",
        "ragdoll.happy.cool": "Fico!",
        "ragdoll.sad.oww": "Ahia...",
        "ragdoll.sad.ouch": "Ahia!",
        "ragdoll.sad.noo": "Noo...",
        "ragdoll.angry.grr": "Grr!",
        "ragdoll.angry.hmph": "Hmph!",
        "ragdoll.angry.stop": "Fermati!",
        "ragdoll.scared.eek": "Eek!",
        "ragdoll.scared.help": "Aiuto!",
        "ragdoll.scared.ahh": "Ahh!",
        "ragdoll.surprised.oh": "Oh!",
        "ragdoll.surprised.wow": "Wow!",
        "ragdoll.surprised.what": "Cosa?!",
        "ragdoll.tired.zzz": "Zzz...",
        "ragdoll.tired.yawn": "*sbadiglio*",
        "ragdoll.tired.sleepy": "Sonnolento...",
        "ragdoll.thinking.hmm": "Hmm...",
        "ragdoll.thinking.whatif": "E se...",
        "ragdoll.confused.huh": "Eh?",
        "ragdoll.confused.what": "Cosa?",
        "ragdoll.eating.yum": "Gnam!",
        "ragdoll.eating.nomnom": "Gnam gnam",
        "ragdoll.eating.tasty": "Gustoso!",
        "ragdoll.drinking.gulp": "Gulp!",
        "ragdoll.drinking.sip": "*sorso*",
        "ragdoll.drinking.ahhh": "Ahhh!",
        "ragdoll.exercising.hup": "Hup!",
        "ragdoll.exercising.one": "Uno!",
        "ragdoll.exercising.two": "Due!",
        "ragdoll.celebrating.yeah": "Sì!",
        "ragdoll.celebrating.wooo": "Wooo!",
        "ragdoll.celebrating.yess": "Sìì!",
        "ragdoll.bored.sigh": "Sospiro...",
        "ragdoll.bored.meh": "Meh...",
        "ragdoll.bored.sobored": "Che noia",
        "ragdoll.love.aww": "Aww!",
        "ragdoll.love.loveit": "Lo adoro!",
        "ragdoll.hurt.ow": "Ahia!",
        "ragdoll.hurt.thathurt": "Fa male!",
        "ragdoll.hurt.ouch": "Ahia!",
        "ragdoll.jumping.whee": "Whee!",
        "ragdoll.cool.cool": "Fico!",
        "ragdoll.cool.socool": "Troppo fico!",
        "ragdoll.cool.stylin": "Alla moda",
        "ragdoll.hungry.hungry": "Fame...",
        "ragdoll.hungry.needfood": "Serve cibo",
        "ragdoll.hungry.pizza": "Pizza?",
        "ragdoll.funny.haha": "Ahah!",
        "ragdoll.funny.lol": "LOL",
        "ragdoll.funny.funny": "Divertente!"
    },
    de: {
        "ragdoll.greetings.hi": "Hallo!",
        "ragdoll.greetings.hello": "Hallo!",
        "ragdoll.greetings.hey": "Hey!",
        "ragdoll.greetings.yo": "Yo!",
        "ragdoll.happy.yay": "Juhu!",
        "ragdoll.happy.woohoo": "Woohoo!",
        "ragdoll.happy.nice": "Schön!",
        "ragdoll.happy.cool": "Cool!",
        "ragdoll.sad.oww": "Aua...",
        "ragdoll.sad.ouch": "Aua!",
        "ragdoll.sad.noo": "Nein...",
        "ragdoll.angry.grr": "Grr!",
        "ragdoll.angry.hmph": "Hmph!",
        "ragdoll.angry.stop": "Halt!",
        "ragdoll.scared.eek": "Eek!",
        "ragdoll.scared.help": "Hilfe!",
        "ragdoll.scared.ahh": "Ahh!",
        "ragdoll.surprised.oh": "Oh!",
        "ragdoll.surprised.wow": "Wow!",
        "ragdoll.surprised.what": "Was?!",
        "ragdoll.tired.zzz": "Zzz...",
        "ragdoll.tired.yawn": "*gähnen*",
        "ragdoll.tired.sleepy": "Müde...",
        "ragdoll.thinking.hmm": "Hmm...",
        "ragdoll.thinking.whatif": "Was wäre wenn...",
        "ragdoll.confused.huh": "Häh?",
        "ragdoll.confused.what": "Was?",
        "ragdoll.eating.yum": "Lecker!",
        "ragdoll.eating.nomnom": "Mampf mampf",
        "ragdoll.eating.tasty": "Lecker!",
        "ragdoll.drinking.gulp": "Gluck!",
        "ragdoll.drinking.sip": "*schlürfen*",
        "ragdoll.drinking.ahhh": "Ahhh!",
        "ragdoll.exercising.hup": "Hopp!",
        "ragdoll.exercising.one": "Eins!",
        "ragdoll.exercising.two": "Zwei!",
        "ragdoll.celebrating.yeah": "Ja!",
        "ragdoll.celebrating.wooo": "Wooo!",
        "ragdoll.celebrating.yess": "Jaa!",
        "ragdoll.bored.sigh": "Seufz...",
        "ragdoll.bored.meh": "Meh...",
        "ragdoll.bored.sobored": "So langweilig",
        "ragdoll.love.aww": "Aww!",
        "ragdoll.love.loveit": "Ich liebe es!",
        "ragdoll.hurt.ow": "Aua!",
        "ragdoll.hurt.thathurt": "Das tat weh!",
        "ragdoll.hurt.ouch": "Aua!",
        "ragdoll.jumping.whee": "Hui!",
        "ragdoll.cool.cool": "Cool!",
        "ragdoll.cool.socool": "So cool!",
        "ragdoll.cool.stylin": "Stylisch",
        "ragdoll.hungry.hungry": "Hungrig...",
        "ragdoll.hungry.needfood": "Brauche Essen",
        "ragdoll.hungry.pizza": "Pizza?",
        "ragdoll.funny.haha": "Haha!",
        "ragdoll.funny.lol": "LOL",
        "ragdoll.funny.funny": "Lustig!"
    },
    pt: {
        "ragdoll.greetings.hi": "Oi!",
        "ragdoll.greetings.hello": "Olá!",
        "ragdoll.greetings.hey": "Ei!",
        "ragdoll.greetings.yo": "Yo!",
        "ragdoll.happy.yay": "Eba!",
        "ragdoll.happy.woohoo": "Woohoo!",
        "ragdoll.happy.nice": "Legal!",
        "ragdoll.happy.cool": "Maneiro!",
        "ragdoll.sad.oww": "Ui...",
        "ragdoll.sad.ouch": "Ui!",
        "ragdoll.sad.noo": "Nãoo...",
        "ragdoll.angry.grr": "Grr!",
        "ragdoll.angry.hmph": "Hmph!",
        "ragdoll.angry.stop": "Pare!",
        "ragdoll.scared.eek": "Eek!",
        "ragdoll.scared.help": "Socorro!",
        "ragdoll.scared.ahh": "Ahh!",
        "ragdoll.surprised.oh": "Oh!",
        "ragdoll.surprised.wow": "Uau!",
        "ragdoll.surprised.what": "O quê?!",
        "ragdoll.tired.zzz": "Zzz...",
        "ragdoll.tired.yawn": "*bocejo*",
        "ragdoll.tired.sleepy": "Com sono...",
        "ragdoll.thinking.hmm": "Hmm...",
        "ragdoll.thinking.whatif": "E se...",
        "ragdoll.confused.huh": "Hã?",
        "ragdoll.confused.what": "O quê?",
        "ragdoll.eating.yum": "Que delícia!",
        "ragdoll.eating.nomnom": "Nham nham",
        "ragdoll.eating.tasty": "Gostoso!",
        "ragdoll.drinking.gulp": "Gole!",
        "ragdoll.drinking.sip": "*gole*",
        "ragdoll.drinking.ahhh": "Ahhh!",
        "ragdoll.exercising.hup": "Força!",
        "ragdoll.exercising.one": "Um!",
        "ragdoll.exercising.two": "Dois!",
        "ragdoll.celebrating.yeah": "Isso!",
        "ragdoll.celebrating.wooo": "Wooo!",
        "ragdoll.celebrating.yess": "Simm!",
        "ragdoll.bored.sigh": "*suspiro*...",
        "ragdoll.bored.meh": "Meh...",
        "ragdoll.bored.sobored": "Que tédio",
        "ragdoll.love.aww": "Aww!",
        "ragdoll.love.loveit": "Amei!",
        "ragdoll.hurt.ow": "Ai!",
        "ragdoll.hurt.thathurt": "Isso doeu!",
        "ragdoll.hurt.ouch": "Ui!",
        "ragdoll.jumping.whee": "Eba!",
        "ragdoll.cool.cool": "Maneiro!",
        "ragdoll.cool.socool": "Muito legal!",
        "ragdoll.cool.stylin": "Estiloso",
        "ragdoll.hungry.hungry": "Com fome...",
        "ragdoll.hungry.needfood": "Preciso comer",
        "ragdoll.hungry.pizza": "Pizza?",
        "ragdoll.funny.haha": "Haha!",
        "ragdoll.funny.lol": "Kkk",
        "ragdoll.funny.funny": "Divertido!"
    }
};

async function main() {
    try {
        const files = fs.readdirSync(localesDir);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            const lang = path.basename(file, '.json');
            const filePath = path.join(localesDir, file);
            
            const content = fs.readFileSync(filePath, 'utf8');
            const dict = JSON.parse(content);
            
            // Populate keys
            for (const [key, defaultVal] of Object.entries(RAGDOLL_KEYS_DEFAULTS)) {
                let val = defaultVal;
                if (LOCALIZED_TRANSLATIONS[lang] && LOCALIZED_TRANSLATIONS[lang][key]) {
                    val = LOCALIZED_TRANSLATIONS[lang][key];
                }
                dict[key] = val;
            }
            
            // Write back in sorted order
            const sortedDict = {};
            Object.keys(dict).sort().forEach(k => {
                sortedDict[k] = dict[k];
            });
            
            fs.writeFileSync(filePath, JSON.stringify(sortedDict, null, 2) + '\n', 'utf8');
            console.log(`[i18n-populate] Populated keys for: ${file}`);
        }
        
        console.log('[i18n-populate] Completed all locales.');
    } catch (e) {
        console.error('[i18n-populate] Error populating locales:', e);
        process.exit(1);
    }
}

main();
