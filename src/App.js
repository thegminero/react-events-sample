import './App.css';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { InstantSearch, useInfiniteHits, useRefinementList } from 'react-instantsearch';
import { createInsightsMiddleware } from 'instantsearch.js/es/middlewares';
import { useInstantSearch } from 'react-instantsearch';
import { useLayoutEffect, useRef, useState } from 'react';
import aa from 'search-insights';

// Initialize Algolia Insights
aa('init', {
  appId: 'MWN8IH23ME',
  apiKey: '4e648074863f9356162d9db95a19efe0',
});

// Middleware for handling custom events
function InsightsMiddleware() {
  const { addMiddlewares } = useInstantSearch();

  useLayoutEffect(() => {
    const middleware = createInsightsMiddleware({
      insightsClient: aa,
      onEvent: (event, insightsClient) => {
        const { insightsMethod, payload } = event;
        if (insightsMethod) {
          console.log('Tracking event:', insightsMethod, payload); // Debug event tracking
          insightsClient(insightsMethod, payload);
        }
      },
    });

    return addMiddlewares(middleware);
  }, [addMiddlewares]);

  return null;
}

// Search client configuration
const searchClient = algoliasearch('MWN8IH23ME', '4e648074863f9356162d9db95a19efe0');

// Custom InfiniteHits component with event tracking
function CustomInfiniteHits({ onAddToCart }) {
  const { hits, hasMore, refineNext } = useInfiniteHits();
  const sentinelRef = useRef(null);

  useLayoutEffect(() => {
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
      {hits.map((hit) => (
        <div key={hit.objectID} className="card">
          <img
            src={`https://i.linio.com/${hit.images[0].slug}-catalog.webp`}
            alt={hit.title}
            className="card-image"
          />
          <h3
            onClick={() => {
              console.log('Product clicked:', hit); // Debug product click
              aa('clickedObjectIDsAfterSearch', {
                eventName: 'Product Clicked',
                index: 'liniotestos',
                objectIDs: [hit.objectID],
                positions: [hit.__position],
                queryID: hit.__queryID
              });
            }}
          >
            {hit.title}
          </h3>
          <p>{hit?.description}</p>
          <p>Price: ${hit?.price?.current}</p>
          <button
            className="add-to-cart-button"
            onClick={() => {
              console.log('Add to cart event for:', hit); // Debug Add to Cart
              aa('convertedObjectIDsAfterSearch', {
                eventName: 'Product added to cart',
                index: 'liniotestos',
                objectIDs: [hit.objectID],
                queryID: hit.__queryID
              });
              onAddToCart(hit);
            }}
          >
            Add to Cart
          </button>
        </div>
      ))}
      <div ref={sentinelRef} className="sentinel" />
    </div>
  );
}

// Custom RefinementList component with filter event tracking
function CustomRefinementList({ onViewFilters }) {
  const { items, refine } = useRefinementList({
    attribute: 'brand.name',
    sortBy: ['name:asc'],
  });

  // Track when filters are displayed
  useLayoutEffect(() => {
    console.log('Filters viewed: brand.name'); // Debug viewed filters event
    //trigger aa(event)
  }, []);

  // Track selected filters
  useLayoutEffect(() => {
    const refinedItems = items.filter((item) => item.isRefined);
    console.log('Selected filters:', refinedItems); // Debug selected filters
    onViewFilters(refinedItems);
  }, [items, onViewFilters]);

  return (
    <div className="refinement-list-container">
      <h2>Filter by Brand</h2>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <label>
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
              />
              {item.label} ({item.count})
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Main App Component
function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (hit) => {
    console.log('Adding to cart:', hit); // Debug add to cart action
    setCart((prev) => [...prev, hit]);
  };

  const clearCart = () => {
    console.log('Clearing cart'); // Debug cart clear
    setCart([]);
  };

  const handlePurchase = () => {
    const objectIDs = cart.map((item) => item.objectID);
    if (objectIDs.length > 0) {
      console.log('Purchase event for:', objectIDs); // Debug purchase event
      aa('convertedObjectIDsAfterSearch', {
        eventName: 'Purchased from Cart',
        index: 'liniotestos',
        objectIDs,
      });
      clearCart();
    }
  };

  const handleViewedFilters = (filters) => {
    const selectedFilters = filters.map((filter) => filter.label);
    if (selectedFilters.length > 0) {
      console.log('Filters selected:', selectedFilters); // Debug filters viewed
      aa('viewedFilters', {
        eventName: 'Filters Viewed',
        index: 'liniotestos',
        filters: selectedFilters,
      });
    }
  };

  return (
    <div className="App">
      <header>
        <button onClick={handlePurchase} disabled={cart.length === 0}>
          Purchase
        </button>
        <button onClick={clearCart} disabled={cart.length === 0}>
          Clear Cart
        </button>
      </header>
      <div className="main">
        <InstantSearch indexName="liniotestos" searchClient={searchClient}>
          <InsightsMiddleware />
          <CustomRefinementList onViewFilters={handleViewedFilters} />
          <CustomInfiniteHits onAddToCart={addToCart} />
        </InstantSearch>
      </div>
    </div>
  );
}

export default App;
