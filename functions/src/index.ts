import * as path from 'path';
import * as fs from 'fs';
import { Dict, Entry } from "./dict";
import { onRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import express, { Request, Response, NextFunction } from 'express';
import { engine } from 'express-handlebars';

const DICT_PATH = path.join(__dirname, 'full_dict_raw.json');

const expressApp = express();

expressApp.engine('handlebars', engine({extname: '.hbs'}));
expressApp.set('view engine', 'handlebars');
expressApp.set('views', path.join(__dirname, '..', 'views'));

function cacheIt(req: Request, res: Response, next: NextFunction) {
   // Cache for 7d.
  res.set('Cache-Control', 'public, max-age=604800');
  next();
}

function loadDictionary() {
  const rawDict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
  functions.logger.log('COLD START - DICT STATS')
  functions.logger.log('ENTRIES = ', rawDict.length)
  return rawDict
}

const dict = new Dict(loadDictionary());

expressApp.get('/word/:word', cacheIt, (req: Request, res: Response) => {
  const entry = dict.findWord(req.params.word);
  if (entry) {
    try {
      const chars: {
        simplified?: string,
        traditional?: string,
        pinyin?: string,
      }[] = [];
      for (const simpChar of entry.simplified.split('')) {
        chars.push({
          simplified: simpChar,
        })
      }
      entry.traditional.split('').forEach((tradChar, i: number) => {
        chars[i].traditional = tradChar;
      })
      entry.pinyin.split(' ').forEach((pinyinChar, i: number) => {
        chars[i].pinyin = pinyinChar;
      })

      entry.tags = entry.tags.filter((t) => t != 'cedict');

      // Find entries for each character.
      const charEntries: Entry[] = [];
      if (chars.length > 1) {
        chars.forEach(character => {
          if (character.simplified) {
            const charEntry = dict.findWord(character.simplified);
            if (charEntry) charEntries.push(charEntry);
          }
        })
      }

      // Format pinyin and definition for SRS
      const formattedEntry = {
        ...entry,
        pinyinString: entry.pinyin,  // Store original pinyin string
        definitionString: entry.definitions.map(d => d.definition).join(' | ')  // Join definitions with separator
      };

      res.render('word', {
          title: entry.simplified,
          chars: chars,
          entry: formattedEntry,
          charEntries: charEntries,
      });
    } catch (error) {
        console.error("Error rendering word page:", error);
        res.status(500).send("Internal Server Error");
    }
  } else{
    res.send('Word not found.')
  }
});

expressApp.get('/tag/:tag', cacheIt, (req: Request, res: Response) => {
  const entries = dict.findTag(req.params.tag);
  functions.logger.log('ENTRIES LEN', entries.length)
  res.render('results', {
      entries: entries,
  });
});

expressApp.get('/random', (req: Request, res: Response) => {
  const entry = dict.randomEntry();
  res.redirect(302, `/word/${entry.simplified}`);
});

expressApp.get('/about', cacheIt, (req: Request, res: Response) => {
  res.render('about');
});

// New routes for deck and review pages
expressApp.get('/deck', cacheIt, (req: Request, res: Response) => {
  res.render('deck', {
    title: 'Review Deck'
  });
});

expressApp.get('/review', cacheIt, (req: Request, res: Response) => {
  res.render('review', {
    title: 'Review Cards'
  });
});

export const webApp = onRequest(expressApp);
