import React, { useState,useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../features/auth/authSlice'
import Button from '../../common/Button';
import { useNavigate, Link } from 'react-router-dom';
import  coverImage from '../../../assets/Cover.jpg'
import NavBar from '../NavBar/NavBar';
import { toast } from 'react-toastify';
import api from '../../../services/api';
// import ShopCard from './ShopCard';

export default function Home() {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [shops, setShops] = useState([]);

    useEffect(() => {
      fetchShops();
  }, []);
    
    const fetchShops = async () => {
      setLoading(true);
    try {
      const response = await api.get('/ration-shop/shops/', {withCredentials:true});
      setShops(response.data);
      setError(null);
    } catch (error) {
      console.log(error)
        setError('Failed to fetch shops. Please try again later.');
        toast.error('Failed to fetch shops');
      } finally {
        setLoading(false);
      }
    };
    
    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/login');
            toast.success('Logged out successfully!')
        } catch (error) {
          
            toast.error("Logout failed", error);
        }
    };

    const ShopCard = ({ shop }) => {
      const hasImage = shop.profile_image !== null;

      return (
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48">
                {hasImage ? (
                      <img
                          src={shop.profile_image}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                      />
                  ) : (
                      <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 relative overflow-hidden">
                          {/* Animated background elements */}
                          <div className="absolute inset-0">
                              <div className="absolute w-16 h-16 -left-8 -top-8 bg-orange-200 rounded-full opacity-20 animate-float-slow" />
                              <div className="absolute w-12 h-12 right-4 top-8 bg-blue-200 rounded-full opacity-20 animate-float-medium" />
                              <div className="absolute w-10 h-10 left-12 bottom-4 bg-purple-200 rounded-full opacity-20 animate-float-fast" />
                          </div>
                          
                          {/* Center content */}
                          <div className="flex items-center justify-center h-full relative z-10">
                              <div className="flex flex-col items-center space-y-3">
                                  <div className="p-3 bg-white/80 rounded-full shadow-lg animate-bounce-gentle">
                                      <svg 
                                          className="w-10 h-10 text-orange-500" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                      >
                                          <path 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round" 
                                              strokeWidth="2" 
                                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                          />
                                      </svg>
                                  </div>
                                  <div className="text-center">
                                      <span className="px-4 py-2 rounded-lg bg-white/80 text-gray-600 font-medium shadow-md animate-pulse-subtle">
                                          No image available
                                      </span>
                                  </div>
                              </div>
                          </div>
                          
                          {/* Animated corner decorations */}
                          <div className="absolute top-0 left-0 w-16 h-16 animate-spin-slow opacity-10">
                              <div className="absolute inset-0 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
                          </div>
                          <div className="absolute bottom-0 right-0 w-16 h-16 animate-spin-slow opacity-10">
                              <div className="absolute inset-0 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
                          </div>
                      </div>
                  )}
                  <span 
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-sm font-medium
                          ${shop.is_open 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                  >
                      {shop.is_open ? 'Open' : 'Closed'}
                  </span>
              </div>
              
              <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{shop.name}</h3>
                  {shop.description && (
                      <p className="text-gray-600 text-sm mb-3">
                          {shop.description}
                      </p>
                  )}
                  
                  <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm">{shop.location}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-sm">{shop.mobile_number}</span>
                      </div>
                      
                      {shop.owner_name && (
                          <div className="flex items-center text-gray-600">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm">{shop.owner_name}</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <NavBar handleLogout={ handleLogout } />

      <header className="relative bg-orange-100 h-[600px]">
      <div className="container mx-auto px-4 relative z-10 pt-60 ml-[30%]">
         <h1 className="text-4xl font-bold mb-4 text-gray-800">Website for ration subsidies!</h1>
          <div className="flex max-w-md">
            <input
              type="text"
              placeholder="Enter card number"
              className="flex-grow px-4 py-2 rounded-l-lg border-t border-b border-l text-gray-800 border-gray-200 bg-white"
            />
            <button className="px-6 py-3 rounded-r-lg bg-orange-500 text-white font-semibold hover:bg-orange-600">
              Search
            </button>
          </div>
        </div>
        <img
            src={coverImage}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover"
        />
      </header>

      {/* <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-8">Ration shops near you</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((shop) => (
              <div key={shop} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={`/placeholder.svg?height=200&width=300`}
                  alt={`Ration Shop ${shop}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Ration Shop {shop}</h3>
                  <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-semibold mb-8">Ration shops near you</h2>
            {loading && (
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            )}
            {error && (
                <div className="text-red-500 text-center mb-4">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {shops.map((shop) => (
                    <ShopCard key={shop.shop_id} shop={shop} />
                ))}
            </div>
        </div>
    </section>

      <section className="py-12 bg-orange-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-8">Request Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['New Ration Card', 'Update Ration Card', 'Add Member', 'Remove Member'].map((action) => (
              <button
                key={action}
                className="bg-orange-500 text-white font-semibold py-2 px-4 rounded hover:bg-orange-600 transition duration-300"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-8">Upcoming Offers and Announcements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((offer) => (
              <div key={offer} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={`/placeholder.svg?height=200&width=300`}
                  alt={`Offer ${offer}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Offer {offer}</h3>
                  <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-orange-100">
        <div className="container mx-auto px-4 flex items-center">
          <div className="w-1/2">
            <h2 className="text-3xl font-semibold mb-4">We are ready to hear your grievance</h2>
            <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis.</p>
            <button className="bg-orange-500 text-white font-semibold py-2 px-4 rounded hover:bg-orange-600 transition duration-300">
              Contact Us
            </button>
          </div>
          <div className="w-1/2">
            <img src="/placeholder.svg?height=400&width=400" alt="Customer Support" className="w-full h-auto" />
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <p className="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="text-sm">
                <li className="mb-2"><a href="#" className="hover:text-orange-500">Home</a></li>
                <li className="mb-2"><a href="#" className="hover:text-orange-500">About</a></li>
                <li className="mb-2"><a href="#" className="hover:text-orange-500">Services</a></li>
                <li className="mb-2"><a href="#" className="hover:text-orange-500">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-sm mb-2">123 Ration Street, City, Country</p>
              <p className="text-sm mb-2">Phone: (123) 456-7890</p>
              <p className="text-sm mb-2">Email: info@rationsubsidies.com</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-white hover:text-orange-500">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-white hover:text-orange-500">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-white hover:text-orange-500">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}