import React, { useState, useEffect } from 'react'
import { Phone, MessageSquare, MapPin } from 'lucide-react'
import NavBar from '../NavBar/NavBar'
import { logoutUser } from '../../../features/auth/authSlice'
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../../services/api';
import { toast } from 'sonner';
import ChatBox from '../../common/ChatBox';




function SelectedShop() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [cardNumber, setCardNumber] = useState('')
    const [cardDetails, setCardDetails] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [isChatOpen, setIsChatOpen] = useState(false);

    const shop = location.state?.shop;

    if (!shop) {
        navigate('/home');
        toast.error('No shop data')
        return null;
    }
    
    
    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/login');
            toast.success('Logged out successfully!')
        } catch (error) {
        
            toast.error("Logout failed", error);
        }
    };

    const handleCardSubmit = async () => {
      if (!cardNumber.trim()) {
          toast.error('Please enter a card number')
          return
      }

      setIsLoading(true)
      try {
          const card_number = cardNumber
          const response = await api.get(`ration-card/verify/${card_number}/`,{
              headers: {
                  'Content-Type': 'application/json',
              },
        });

        if (response.data && response.data.card_number) {
          setCardDetails(response.data)
          
          setIsVerified(true)
          toast.success('Card verified successfully!')
      } else {
          setCardDetails(null)
          setIsVerified(false)
          toast.error('Invalid card details received')
      }
  } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify card')
      setCardDetails(null)
      setIsVerified(false)
  } finally {
      setIsLoading(false)
      setCardNumber('')
  }
}

  const renderCardDetails = () => {
      if (!cardDetails) return null

      const cardTypeColors = {
          'YELLOW': 'yellow',
          'PINK': 'pink',
          'BLUE': 'blue',
          'WHITE': 'white'
      }

      if (!isVerified) {
        return (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
                <h3 className="font-semibold text-gray-800">
                    Verification Required
                </h3>
                <p className="text-sm text-gray-700">
                    Please verify your card number to see details
                </p>
            </div>
        )
      }


      const bgColor = `bg-${cardTypeColors[cardDetails?.card_type?.color_code || 'red']}-50`
      const borderColor = `border-${cardTypeColors[cardDetails?.card_type?.color_code] || 'red'}-400`
      const textColor = `text-${cardTypeColors[cardDetails?.card_type?.color_code] || 'red' }-800`

      return (
          <div className={`${bgColor} border-l-4 ${borderColor} p-4 rounded`}>
              <h3 className={`font-semibold ${textColor}`}>
                  {cardDetails?.card_type?.name || 'No card name for now. Admin not yet verified your card.'}
              </h3>
              <p className="text-sm text-gray-700">
                  Card Number: {cardDetails.card_number}
              </p>
              <p className="text-sm text-gray-700">
                  Registered at: {cardDetails.registered_shop.name}
              </p>
              <p className="text-sm text-gray-700">
                  Location: {cardDetails.registered_shop.location}
              </p>
          </div>
      )
  }

  const getContinueButtonText = () => {
    if (!cardNumber && !isVerified) return 'Enter Card Number to Continue'
    if (cardNumber && !isVerified) return 'Verify Card to Continue'
    return 'Continue'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar handleLogout={ handleLogout } />

      <main className="container mx-auto pt-20 px-4 py-8">
        <div className="bg-gradient-to-b from-orange-100 to-orange-50 rounded-lg shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Shop Image and Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Shop you chose:</h2>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={shop.profile_image}
                  alt={shop.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{shop.name}</h3>
                  <p className="text-gray-600 text-sm">
                    Status: {shop.is_open ? 'Open' : 'Closed'}
                  </p>
                  <p className="text-gray-600 text-sm">Location: {shop.location}</p>
                  <span className="text-sm font-medium text-green-600">
                    {shop.distance !== null ? `${shop.distance} km away` : 'Distance unavailable'}
                  </span>
                </div>
                
              </div>
            </div>

            {/* Card Details Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">Enter card number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="flex-grow px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your card number"
                  />
                  <button 
                      onClick={handleCardSubmit}
                      disabled={isLoading}
                      className={`px-4 py-2 ${isLoading ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-lg transition-colors`}
                  >
                      {isLoading ? 'Verifying...' : 'Submit'}
                  </button>
                </div>
              </div>
               {/* Card Details Section */}
               {cardNumber || cardDetails ? renderCardDetails() : (
                  <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
                      <h3 className="font-semibold text-gray-800">
                          No Card Details
                      </h3>
                      <p className="text-sm text-gray-700">
                          Enter your card number and click submit to view details
                      </p>
                  </div>
              )}

              <div className="flex  gap-4">
                {/* <button className="flex items-center gap-2 px-6 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <span className='lg:inline hidden'>Call</span>
                </button> */}
                <button 
                className="flex items-center gap-2 px-6 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                onClick={() => setIsChatOpen(true)}
                >
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <span className='lg:inline hidden' >Message</span>
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <span className='lg:inline hidden' >Directions</span>
                </button>
              </div>
              <button className={`w-full px-6 py-3 ${isVerified ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-lg font-semibold transition-colors`}
              disabled={!isVerified}
              onClick={() => {
                if (isVerified && cardDetails){
                  navigate('/home/selected-shop/face-recognition/',{
                    state: {
                      shop: shop,
                      cardDetails: cardDetails
                    }
                  });
                }
              }}
              >
                {getContinueButtonText()}
              </button>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Directions
          </h2>
          <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            {/* Replace with actual map implementation */}
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Map View</span>
            </div>
          </div>
        </div>
      </main>
      {isChatOpen && <ChatBox shop={shop} onClose={() => setIsChatOpen(false)} />}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
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

export default SelectedShop