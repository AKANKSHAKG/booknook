import axios from "axios";

export async function searchBooks(query) {
  const KEY = process.env.REACT_APP_BOOKS_KEY;
  const res = await axios.get("https://www.googleapis.com/books/v1/volumes", {
    params: { q: query, maxResults: 6, key: KEY },
  });
  return res.data.items?.map(item => {
    const i = item.volumeInfo;
    return {
      id: item.id, title: i.title,
      authors: i.authors?.join(", ") || "Unknown",
      description: i.description?.replace(/<[^>]+>/g,"").slice(0,200) + "…" || "No description.",
      cover: i.imageLinks?.thumbnail?.replace("http://","https://") || null,
      rating: i.averageRating, pages: i.pageCount,
      publisher: i.publisher, year: i.publishedDate?.split("-")[0],
      categories: i.categories?.[0] || null,
      previewLink: i.previewLink,
    };
  }) || [];
}

export async function getWordOfDay(word) {
  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const entry = res.data[0];
    const meaning = entry.meanings[0];
    return {
      word: entry.word, phonetic: entry.phonetic || "",
      partOfSpeech: meaning.partOfSpeech,
      definition: meaning.definitions[0].definition,
      example: meaning.definitions[0].example || null,
      synonyms: meaning.synonyms?.slice(0,4) || [],
    };
  } catch { return null; }
}

export async function getBookNews(query) {
  const KEY = process.env.REACT_APP_NEWS_KEY;
  try {
    const res = await axios.get("https://newsapi.org/v2/everything", {
      params: { q: `${query} book literature reading`, language:"en", sortBy:"publishedAt", pageSize:4, apiKey:KEY },
    });
    return res.data.articles.filter(a=>a.title!=="[Removed]"&&a.urlToImage).slice(0,4).map(a=>({
      title:a.title, source:a.source.name, url:a.url, image:a.urlToImage,
      publishedAt:new Date(a.publishedAt).toLocaleDateString(),
    }));
  } catch { return []; }
}

export async function getQuote() {
  try {
    const res = await axios.get("https://api.quotable.io/random", {
      params:{ tags:"books|knowledge|wisdom|education", minLength:50, maxLength:150 },
    });
    return { content:res.data.content, author:res.data.author };
  } catch { return { content:"A reader lives a thousand lives before he dies.", author:"George R.R. Martin" }; }
}

// Extract a single interesting word from book title for dictionary lookup
export function extractWord(title) {
  const words = title.split(" ").filter(w => w.length > 5 && !/[^a-zA-Z]/.test(w));
  return words[0]?.toLowerCase() || "serendipity";
}
