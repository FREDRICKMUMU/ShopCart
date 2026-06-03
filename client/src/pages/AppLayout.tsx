import { Outlet } from 'react-router'
import Banner from "../components/Banner"
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartSIdebar from '../components/CartSIdebar'


const AppLayout = () => {
  return (
    <>
      <Banner />
      <Navbar />
      <main className='min-h-screen'>
        <Outlet />
      </main>
      <Footer />
      <CartSIdebar />
    
    </>
  )
}

export default AppLayout
