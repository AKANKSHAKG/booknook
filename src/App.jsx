import "./App.css";
import { useState } from "react";
import { searchBooks, getWordOfDay, getBookNews, getQuote, extractWord } from "./services/bookService";

export default function App() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [side, setSide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(q) {
    setLoading(true); setError(null); setSearched(true); setSelected(null); setSide(null);
    try {
      const results = await searchBooks(q);
      if (!results.length) { setError(`No books found for "${q}". Try a different title or author.`); setBooks([]); }
      else setBooks(results);
    } catch(err) {
      if(err.response?.status===400||err.response?.status===403) setError("Invalid Google Books API key. Check REACT_APP_BOOKS_KEY in your .env file.");
      else setError(err.message || "Search failed.");
    } finally { setLoading(false); }
  }

  async function handleSelect(book) {
    setSelected(book);
    const word = extractWord(book.title);
    const [dict, news, quote] = await Promise.all([
      getWordOfDay(word),
      getBookNews(query),
      getQuote(),
    ]);
    setSide({ dict, news, quote });
  }

  function reset() { setBooks([]); setSelected(null); setSide(null); setSearched(false); setError(null); setQuery(""); }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <span className="logo">📚 BookNook</span>
          {!searched ? (
            <>
              <h1 className="hero-title">Find your next<br /><span>great read</span></h1>
              <p className="hero-sub">Search millions of books — get summaries, word meanings, related news & literary quotes.</p>
              <div className="search-wrap">
                <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&query.trim()&&handleSearch(query.trim())}
                  placeholder="Search by title, author, or ISBN…" className="search-input" autoFocus />
                <button onClick={()=>query.trim()&&handleSearch(query.trim())} disabled={loading||!query.trim()} className="search-btn">
                  {loading?"Searching…":"Search"}
                </button>
              </div>
            </>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
              <span className="logo" style={{marginBottom:0,cursor:"pointer"}} onClick={reset}>📚 BookNook</span>
              <div className="search-wrap" style={{flex:1}}>
                <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&query.trim()&&handleSearch(query.trim())}
                  placeholder="Search again…" className="search-input" />
                <button onClick={()=>query.trim()&&handleSearch(query.trim())} disabled={loading||!query.trim()} className="search-btn">{loading?"…":"Search"}</button>
                <button onClick={reset} className="reset-btn">✕</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {error && <div className="error-banner"><span>⚠ {error}</span><button onClick={()=>setError(null)} className="error-dismiss">✕</button></div>}

      {!searched && !loading && (
        <div className="suggestions">
          <p className="sug-label">Popular searches</p>
          <div className="chips">
            {["Atomic Habits","The Alchemist","Dune","Sapiens","Harry Potter","Steve Jobs"].map(t=>(
              <button key={t} onClick={()=>{setQuery(t);handleSearch(t);}} className="chip">{t}</button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="loading"><div className="spinner"/><p className="loading-text">Searching the library…</p></div>}

      {!loading && books.length > 0 && (
        <main className="main">
          <div className="section-label">{books.length} results — {selected ? "click another to change selection" : "click a book to explore"}</div>
          <div className="books-grid">
            {books.map(b=>(
              <div key={b.id} className={`book-card ${selected?.id===b.id?"selected":""}`} onClick={()=>handleSelect(b)}>
                <div className="book-cover-wrap">
                  {b.cover ? <img src={b.cover} alt={b.title} className="book-cover" /> : <span className="book-cover-placeholder">📖</span>}
                </div>
                <div className="book-info">
                  <div className="book-title">{b.title}</div>
                  <div className="book-author">{b.authors}</div>
                  <div className="book-meta">
                    {b.rating && <span className="book-rating">⭐ {b.rating}</span>}
                    {b.year && <span>{b.year}</span>}
                    {b.pages && <span>{b.pages}p</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selected && side && (
            <div className="detail-grid">
              <div className="col">
                <div className="card">
                  <div className="card-head"><span className="card-icon">📖</span><h3 className="card-title">About this book</h3></div>
                  <div className="detail-inner">
                    {selected.cover ? <img src={selected.cover} alt={selected.title} className="detail-cover" /> : <div className="detail-cover-ph">📖</div>}
                    <div className="detail-info">
                      <div className="detail-title">{selected.title}</div>
                      <div className="detail-author">{selected.authors}</div>
                      <div className="detail-meta">
                        {selected.year && <span>📅 {selected.year}</span>}
                        {selected.pages && <span>📄 {selected.pages} pages</span>}
                        {selected.rating && <span>⭐ {selected.rating}/5</span>}
                        {selected.categories && <span>🏷 {selected.categories}</span>}
                      </div>
                      <p className="detail-desc">{selected.description}</p>
                      {selected.previewLink && <a href={selected.previewLink} target="_blank" rel="noopener noreferrer" className="preview-link">Preview on Google Books →</a>}
                    </div>
                  </div>
                </div>
                {side.dict && (
                  <div className="card">
                    <div className="card-head"><span className="card-icon">📝</span><h3 className="card-title">Word from this title</h3></div>
                    <div className="dict-word">{side.dict.word}</div>
                    {side.dict.phonetic && <div className="dict-phonetic">{side.dict.phonetic}</div>}
                    <span className="dict-pos">{side.dict.partOfSpeech}</span>
                    <p className="dict-def">{side.dict.definition}</p>
                    {side.dict.example && <p className="dict-example">"{side.dict.example}"</p>}
                    {side.dict.synonyms.length > 0 && (
                      <div className="synonyms">{side.dict.synonyms.map(s=><span key={s} className="syn-chip">{s}</span>)}</div>
                    )}
                  </div>
                )}
              </div>
              <div className="col">
                <div className="card quote-card">
                  <span className="q-mark">"</span>
                  <p className="q-text">{side.quote?.content}</p>
                  <div className="q-author">— {side.quote?.author}</div>
                </div>
                {side.news?.length > 0 && (
                  <div className="card">
                    <div className="card-head"><span className="card-icon">📰</span><h3 className="card-title">Related News</h3></div>
                    <div className="news-list">
                      {side.news.map((a,i)=>(
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="news-item">
                          {a.image&&<img src={a.image} alt="" className="news-img" onError={e=>{e.target.style.display="none"}}/>}
                          <div className="news-body">
                            <span className="news-src">{a.source}</span>
                            <p className="news-ttl">{a.title}</p>
                            <span className="news-dt">{a.publishedAt}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      <footer className="footer">BookNook · Google Books · Dictionary API · NewsAPI · Quotable</footer>
    </div>
  );
}
