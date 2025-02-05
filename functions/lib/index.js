"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webApp = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dict_1 = require("./dict");
const https_1 = require("firebase-functions/v2/https");
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const express_handlebars_1 = require("express-handlebars");
const DICT_PATH = path.join(__dirname, 'full_dict_raw.json');
const expressApp = (0, express_1.default)();
expressApp.engine('handlebars', (0, express_handlebars_1.engine)({ extname: '.hbs' }));
expressApp.set('view engine', 'handlebars');
expressApp.set('views', path.join(__dirname, '..', 'views'));
function cacheIt(req, res, next) {
    // Cache for 7d.
    res.set('Cache-Control', 'public, max-age=604800');
    next();
}
function loadDictionary() {
    const rawDict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
    functions.logger.log('COLD START - DICT STATS');
    functions.logger.log('ENTRIES = ', rawDict.length);
    return rawDict;
}
const dict = new dict_1.Dict(loadDictionary());
expressApp.get('/word/:word', cacheIt, (req, res) => {
    const entry = dict.findWord(req.params.word);
    if (entry) {
        try {
            const chars = [];
            for (const simpChar of entry.simplified.split('')) {
                chars.push({
                    simplified: simpChar,
                });
            }
            entry.traditional.split('').forEach((tradChar, i) => {
                chars[i].traditional = tradChar;
            });
            entry.pinyin.split(' ').forEach((pinyinChar, i) => {
                chars[i].pinyin = pinyinChar;
            });
            entry.tags = entry.tags.filter((t) => t != 'cedict');
            // Find entries for each character.
            const charEntries = [];
            if (chars.length > 1) {
                chars.forEach(character => {
                    if (character.simplified) {
                        const charEntry = dict.findWord(character.simplified);
                        if (charEntry)
                            charEntries.push(charEntry);
                    }
                });
            }
            // Format pinyin and definition for SRS
            const formattedEntry = Object.assign(Object.assign({}, entry), { pinyinString: entry.pinyin, definitionString: entry.definitions.map(d => d.definition).join(' | ') // Join definitions with separator
             });
            res.render('word', {
                title: entry.simplified,
                chars: chars,
                entry: formattedEntry,
                charEntries: charEntries,
            });
        }
        catch (error) {
            console.error("Error rendering word page:", error);
            res.status(500).send("Internal Server Error");
        }
    }
    else {
        res.send('Word not found.');
    }
});
expressApp.get('/tag/:tag', cacheIt, (req, res) => {
    const entries = dict.findTag(req.params.tag);
    functions.logger.log('ENTRIES LEN', entries.length);
    res.render('results', {
        entries: entries,
    });
});
expressApp.get('/random', (req, res) => {
    const entry = dict.randomEntry();
    res.redirect(302, `/word/${entry.simplified}`);
});
expressApp.get('/about', cacheIt, (req, res) => {
    res.render('about');
});
// New routes for deck and review pages
expressApp.get('/deck', cacheIt, (req, res) => {
    res.render('deck', {
        title: 'Review Deck'
    });
});
expressApp.get('/review', cacheIt, (req, res) => {
    res.render('review', {
        title: 'Review Cards'
    });
});
exports.webApp = (0, https_1.onRequest)(expressApp);
//# sourceMappingURL=index.js.map