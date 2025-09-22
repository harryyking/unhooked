import { v } from "convex/values";
import { query, mutation, action, internalQuery, ActionCtx } from "./_generated/server"; // Add internalQuery if you want private queries
import { api } from "./_generated/api"; // For referencing functions
import { Id } from "./_generated/dataModel";
import axios from 'axios';

const API_KEY = process.env.API_BIBLE_KEY;


const bookMap: { [key: string]: string } = {
  "GENESIS": "GEN",
  "EXODUS": "EXO",
  "LEVITICUS": "LEV",
  "NUMBERS": "NUM",
  "DEUTERONOMY": "DEU",
  "JOSHUA": "JOS",
  "JUDGES": "JDG",
  "RUTH": "RUT",
  "1 SAMUEL": "1SA",
  "2 SAMUEL": "2SA",
  "1 KINGS": "1KI",
  "2 KINGS": "2KI",
  "1 CHRONICLES": "1CH",
  "2 CHRONICLES": "2CH",
  "EZRA": "EZR",
  "NEHEMIAH": "NEH",
  "ESTHER": "EST",
  "JOB": "JOB",
  "PSALMS": "PSA",
  "PROVERBS": "PRO",
  "ECCLESIASTES": "ECC",
  "SONG OF SONGS": "SNG",
  "ISAIAH": "ISA",
  "JEREMIAH": "JER",
  "LAMENTATIONS": "LAM",
  "EZEKIEL": "EZK",
  "DANIEL": "DAN",
  "HOSEA": "HOS",
  "JOEL": "JOL",
  "AMOS": "AMO",
  "OBADIAH": "OBA",
  "JONAH": "JON",
  "MICAH": "MIC",
  "NAHUM": "NAM",
  "HABAKKUK": "HAB",
  "ZEPHANIAH": "ZEP",
  "HAGGAI": "HAG",
  "ZECHARIAH": "ZEC",
  "MALACHI": "MAL",
  "MATTHEW": "MAT",
  "MARK": "MRK",
  "LUKE": "LUK",
  "JOHN": "JHN",
  "ACTS": "ACT",
  "ROMANS": "ROM",
  "1 CORINTHIANS": "1CO",
  "2 CORINTHIANS": "2CO",
  "GALATIANS": "GAL",
  "EPHESIANS": "EPH",
  "PHILIPPIANS": "PHP",
  "COLOSSIANS": "COL",
  "1 THESSALONIANS": "1TH",
  "2 THESSALONIANS": "2TH",
  "1 TIMOTHY": "1TI",
  "2 TIMOTHY": "2TI",
  "TITUS": "TIT",
  "PHILEMON": "PHM",
  "HEBREWS": "HEB",
  "JAMES": "JAS",
  "1 PETER": "1PE",
  "2 PETER": "2PE",
  "1 JOHN": "1JN",
  "2 JOHN": "2JN",
  "3 JOHN": "3JN",
  "JUDE": "JUD",
  "REVELATION": "REV",
  // Deuterocanonical (optional; remove if not needed for your app)
  "TOBIT": "TOB",
  "JUDITH": "JDT",
  "ESTHER GREEK": "ESG",
  "WISDOM OF SOLOMON": "WIS",
  "SIRACH": "SIR",
  "BARUCH": "BAR",
  "LETTER OF JEREMIAH": "LJE",
  "SONG OF THE 3 YOUNG MEN": "S3Y",
  "SUSANNA": "SUS",
  "BEL AND THE DRAGON": "BEL",
  "1 MACCABEES": "1MA",
  "2 MACCABEES": "2MA",
  "3 MACCABEES": "3MA",
  "4 MACCABEES": "4MA",
  "1 ESDRAS": "1ES",
  "2 ESDRAS": "2ES",
  "PRAYER OF MANASSEH": "MAN",
  "PSALM 151": "PS2",
  "ODAE": "ODA",
  "PSALMS OF SOLOMON": "PSS",
  "EZRA APOCALYPSE": "EZA",
  "5 EZRA": "5EZ",
  "6 EZRA": "6EZ",
  "DANIEL GREEK": "DAG",
  "PSALMS 152-155": "PS3",
  "2 BARUCH": "2BA",
  "LETTER OF BARUCH": "LBA",
  "JUBILEES": "JUB",
  "ENOCH": "ENO",
  "1 MEQABYAN": "1MQ",
  "2 MEQABYAN": "2MQ",
  // Add aliases if common in your inputs (e.g., for variations)
  "SONG OF SOLOMON": "SNG", // Alias for Song of Songs
  "CANTICLES": "SNG",       // Another rare alias
};

function normalizeVerseId(ref: string): string {
  const cleaned = ref.trim().replace(/:/g, '.'); // Replace colon with dot; preserve hyphens for ranges
  const parts = cleaned.split(/\s+/);

  if (parts.length < 2) {
    throw new Error(`Invalid verse reference format: "${ref}" (too few parts)`);
  }

  let bookName = '';
  let chapterVerseIndex = 0;

  // Handle numbered books (1-4 followed by name, with or without space)
  const firstPart = parts[0].toUpperCase();
  if (/^[1-4]$/.test(firstPart) && parts.length >= 3) {
    bookName = `${firstPart} ${parts[1].toUpperCase()}`;
    chapterVerseIndex = 2;
  } else if (/^[1-4][A-Z]+$/i.test(firstPart)) {
    // Handles compacted like "1John" or "2Kings"
    const num = firstPart.match(/^[1-4]/)![0];
    const name = firstPart.slice(1).toUpperCase();
    bookName = `${num} ${name}`;
    chapterVerseIndex = 1;
  } else {
    bookName = firstPart.toUpperCase();
    chapterVerseIndex = 1;
  }

  const chapterVerse = parts.slice(chapterVerseIndex).join('.');

  if (!chapterVerse.includes('.')) {
    throw new Error(`Invalid verse reference format: "${ref}" (missing chapter/verse separator)`);
  }

  const bookCode = bookMap[bookName] || bookName.replace(/\s+/g, '').substring(0, 3).toUpperCase();

  // Optional: Log fallback uses for debugging
  if (!bookMap[bookName]) {
    console.warn(`Book name "${bookName}" not in map; using fallback "${bookCode}"`);
  }

  return `${bookCode}.${chapterVerse}`;
}
  

/**
 * Gets a random daily verse reference from devotionals.
 */
export const getRandomDailyVerse = query({
  handler: async (ctx) => {
    const allDevotionals = await ctx.db.query("devotionals").collect();
    if (allDevotionals.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * allDevotionals.length);
    return allDevotionals[randomIndex];
  },
});


export const getDailyVerseForUser = action({
  handler: async (ctx: ActionCtx): Promise<{ verse: string; reference: string } | null> => {


    // Get user via runQuery (now from users.ts)
    const user = await ctx.runQuery(api.user.getCurrentUser);

    const bibleId = user?.preferredBibleVersion || '65eec8e0b60e656b-01'; // Default to KJV

    // Get the daily verse reference
    const dailyDevotional = await ctx.runQuery(api.devotional.getRandomDailyVerse);

    if (!dailyDevotional) {
      return null; // Handle no verses
    }

    const verseId = normalizeVerseId(dailyDevotional.verses);
    console.log('Normalized Verse ID:', verseId); // For Convex logs

    const isRange = verseId.includes('-');
    const endpoint = isRange ? 'passages' : 'verses';

    // Call the external API
    const response = await axios.get(
      `https://api.scripture.api.bible/v1/bibles/${bibleId}/${endpoint}/${verseId}?content-type=text&include-chapter-numbers=false&include-verse-numbers=false`,
      {
        headers: { 'api-key': API_KEY },
      }
    );

    const verseData = response.data.data;
    if (!verseData) {
      throw new Error('Verse not found');
    }

    return {
      verse: verseData.content,
      reference: dailyDevotional.verses,
    };
  },
});



/**
 * Adds a verse reference to devotionals.
 */
export const addVerses = mutation({
  args: {
    reference: v.string(), // Renamed for clarity
  },
  handler: async (ctx, args) => {
    // Optional: Add auth check here if needed
    const addVerse = await ctx.db.insert('devotionals', {
      verses: normalizeVerseId(args.reference)
    });

    return addVerse;
  },
});