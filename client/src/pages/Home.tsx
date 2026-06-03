import AppPromoBanner from "../components/Home/AppPromoBanner"
import Features from "../components/Home/Features"
import Hero from "../components/Home/Hero"
import HomeCatrgories from "../components/Home/HomeCatrgories"
import PopularProducts from "../components/Home/PopularProducts"
import NewsLetter from "../components/Home/NewsLetter"

const Home = () => {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Hero />
      <Features />
      <HomeCatrgories />
      <PopularProducts />
      <AppPromoBanner/>
      <NewsLetter />
    </div>
  )
}

export default Home
