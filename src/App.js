import './App.css';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { useEffect, useRef } from 'react';
import { InstantSearch, useInfiniteHits, RefinementList } from 'react-instantsearch';

const searchClient = algoliasearch('MWN8IH23ME', '4e648074863f9356162d9db95a19efe0');

// Custom card component, pass sendEvent from CustomInfiniteHits to make it accessible
const Card = ({ hit, sendEvent }) => (
  <div className="card">
    <h3 onClick={() => sendEvent('click', hit, 'Product Clicked')}>{hit.title}</h3>
    <p>{hit?.description}</p>
    <p>Price: ${hit?.price?.current}</p>
    {/* Add more fields as needed */}
  </div>
);

// InfiniteHits, add sendEvents
function CustomInfiniteHits(props) {
  const { hits, hasMore, refineNext, sendEvent } = useInfiniteHits(props);

  const sentinelRef = useRef(null);
  useEffect(() => {
    if (sentinelRef.current && hasMore) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          refineNext();
        }
      });
      observer.observe(sentinelRef.current);

      return () => observer.disconnect();
    }
  }, [hasMore, refineNext]);

  return (
    <div className="infinite-hits">
      <div className="cards">
        {hits.map(hit => <Card key={hit.objectID} hit={hit} sendEvent={sendEvent} />)}
      </div>
      <div ref={sentinelRef} className="sentinel" />
    </div>
  );
}

// Custom refinement list component with styles
const CustomRefinementList = () => (
  <div className="refinement-list-container">
    <h2>Filter by Brand</h2>
    <RefinementList
      attribute="brand.name"
      showMore={true}
      showMoreLimit={25} // Limit for expanded list
      transformItems={(items) =>
        items.sort((a, b) => a.label.localeCompare(b.label)) // Sort alphabetically
      }
    />
  </div>
);

function App() {
  return (
    <div className="App">
      <InstantSearch searchClient={searchClient} indexName="liniotestos" insights={true}>
      <CustomRefinementList />
        <CustomInfiniteHits />
      </InstantSearch>
    </div>
  );
}

export default App;