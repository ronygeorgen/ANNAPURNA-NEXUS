import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../features/auth/authSlice'
import Button from '../../common/Button';
import { useNavigate, Link } from 'react-router-dom';
import  coverImage from '../../../assets/Cover.jpg'
import NavBar from '../NavBar/NavBar';
import { toast } from 'react-toastify';


export default function Home() {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/login');
            toast.success('Logged out successfully!')
        } catch (error) {
          
            toast.error("Logout failed", error);
        }
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

      <section className="py-12 bg-white">
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