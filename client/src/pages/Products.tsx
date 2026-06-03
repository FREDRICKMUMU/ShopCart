import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom"
import type { Product } from "../types";
import { dummyProducts } from "../assets/assets";
import { ChevronDown, SlidersHorizontal, Home, XIcon } from "lucide-react";
import ProductCard from "../components/ProductCard";
import FilterPanel from "../components/FilterPanel";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts] = useState<Product[]>(dummyProducts)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const category = searchParams.get("category") || "";
  const organic = searchParams.get("organic") || "";
  const sort = searchParams.get("sort") || "";
  const page = Number(searchParams.get("page")) || 1;
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const itemsPerPage = 12;

  // Extract unique categories from products
  const categoriesData = [...new Set(allProducts.map(p => p.category))].map(cat => ({
    slug: cat,
    name: cat?.charAt(0).toUpperCase() + cat?.slice(1)
  }))

  const activeCategory = categoriesData.find((c) => c.slug === category);
  const hasFilters = category || organic || minPrice || maxPrice;

  // Filter and sort products
  const filterAndSortProducts = () => {
    let result = [...allProducts]

    // Filter by category
    if (category) {
      result = result.filter(product => product.category === category)
    }

    // Filter by organic
    if (organic === "true") {
      result = result.filter(product => product.isOrganic === true)
    }

    // Filter by price range
    if (minPrice) {
      result = result.filter(product => product.price >= Number(minPrice))
    }
    if (maxPrice) {
      result = result.filter(product => product.price <= Number(maxPrice))
    }

        // Sort products
    if (sort === "price_asc") {
      result.sort((a, b) => a.price - b.price)
    } else if (sort === "price_desc") {
      result.sort((a, b) => b.price - a.price)
    } else if (sort === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      // Default: newest first (by id)
      result.sort((a, b) => (Number(b._id) || 0) - (Number(a._id) || 0))
    }
    return result
  }

  const fetchProducts = async () => {
    setLoading(true)
    
    const filtered = filterAndSortProducts()
    setFilteredProducts(filtered)
    
    // Calculate pagination
    const total = Math.ceil(filtered.length / itemsPerPage)
    setTotalPages(total)
    
    // Get current page products
    const start = (page - 1) * itemsPerPage
    const end = start + itemsPerPage
    setProducts(filtered.slice(start, end))
    
    setLoading(false)
  }

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    if (key !== "page") {
      newParams.delete("page")
    }
    setSearchParams(newParams)
  }

  const clearFilters = () => setSearchParams({})

  useEffect(() => {
    fetchProducts()
  }, [category, organic, sort, page, minPrice, maxPrice])

  return (
    <div className="min-h-screen bg-app-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm text-app-text-light mb-6">
          <Link to='/' className="hover:text-app-green transition-colors">
            <Home className="size-4" />
          </Link>
          <span>/</span>
          <span className="text-app-green font-medium">{activeCategory ? activeCategory.name : "All Products"}</span>
        </nav>
        <div className="flex gap-8 xl:gap-10">
          {/* SIDEBAR-DESKTOP */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-4 sticky top-24">
              <FilterPanel 
                categories={categoriesData} 
                category={category}
                organic={organic}
                minPrice={minPrice} 
                maxPrice={maxPrice}
                updateFilter={updateFilter} 
                clearFilters={clearFilters}
                hasFilters={hasFilters} />
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1">
            {/*HEADER */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-app-green">{activeCategory ? activeCategory.name : "All Products"}</h1>
                <p className="text-sm text-app-text-light mt-0.5">{filteredProducts.length} products found</p>
              </div>
              <div className="flex flex-col lg:items-center gap-3">
                {/*MOBILE FILTER TOGGLE */}
                <button onClick={() => setMobileFilterOpen(true)} className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm bg-white 
                rounded-xl border border-app-border hover:bg-app-cream transition-colors">
                  <SlidersHorizontal className="size-4" />
                  Filters
                </button>

                {/* SORT */}
                <div className="relative">
                  <select value={sort} onChange={(e) => updateFilter("sort", e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm bg-white rounded-xl border border-app-border
                    focus:border-app-green outline-none cursor-pointer">
                    <option value="">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="name">A to Z</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                        text-app-text-light pointer-events-none" />
                </div>
              </div>
            </div>

            {/* PRODUCT GRID */}
            {loading ? (
              <div className="flex-center py-16">
                <p>Loading...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-semibold text-app-green mb-2">No products found</p>
                <p className="text-sm text-app-text-light mb-4">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="px-5 py-2 text-sm font-medium bg-app-green text-white rounded-xl
                hover:bg-app-green-light">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-8">
                {products.map((product) => product.stock > 0 && (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex-center gap-2 mt-16">
                <button
                  onClick={() => page > 1 && updateFilter("page", String(page - 1))}
                  className={`size-9 rounded-lg text-sm font-medium transition-colors ${page === 1 ? "opacity-50 cursor-not-allowed" : "bg-white hover:bg-app-cream"}`}
                  disabled={page === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => { updateFilter("page", String(pageNum)); window.scrollTo(0, 0) }}
                      className={`size-9 rounded-lg text-sm font-medium transition-colors ${page === pageNum ? "bg-app-green text-white" : "bg-white text-app-text-light hover:bg-app-cream"}`}>
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => page < totalPages && updateFilter("page", String(page + 1))}
                  className={`size-9 rounded-lg text-sm font-medium transition-colors ${page === totalPages ? "opacity-50 cursor-not-allowed" : "bg-white hover:bg-app-cream"}`}
                  disabled={page === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      {/* MOBILE FILTERS MODAL */}
      {mobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50
        rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-in-up">
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <h3 className="text-lg font-semibold text-app-green">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 hover:bg-app-cream rounded-lg">
                <XIcon className="size-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel 
                categories={categoriesData} 
                category={category}
                organic={organic}
                minPrice={minPrice} 
                maxPrice={maxPrice}
                updateFilter={updateFilter} 
                clearFilters={clearFilters}
                hasFilters={hasFilters} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Products