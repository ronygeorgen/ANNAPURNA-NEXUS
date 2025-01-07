import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logoutUser } from '../../../features/auth/authSlice';
import api from '../../../services/api';
import NavBar from '../NavBar/NavBar';

const statusOrder = ['REQUESTED', 'SHOP_VERIFIED', 'ADMIN_APPROVED'];

const normalizeStatus = (status) => {
  return status === 'PENDING' ? 'REQUESTED' : status;
};

const formatStatus = (status) => {
  const normalizedStatus = normalizeStatus(status);
  return normalizedStatus.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const StatusBadge = ({ status }) => {
  const normalizedStatus = normalizeStatus(status);
  const colorClasses = {
    REQUESTED: 'bg-blue-100 text-blue-800',
    SHOP_VERIFIED: 'bg-yellow-100 text-yellow-800',
    ADMIN_APPROVED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[normalizedStatus] || 'bg-gray-100 text-gray-800'}`}>
      {formatStatus(status)}
    </span>
  );
};

const StatusTimeline = ({ status }) => {
  const normalizedStatus = normalizeStatus(status);
  const currentIndex = statusOrder.indexOf(normalizedStatus);
  const showCancelled = normalizedStatus === 'CANCELLED';
  const displayStatuses = showCancelled ? ['CANCELLED'] : statusOrder;

  return (
    <div className="flex items-center space-x-2 mt-4">
      {displayStatuses.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`h-3 w-3 rounded-full ${
                normalizedStatus === 'CANCELLED' 
                  ? 'bg-red-500'
                  : index <= currentIndex 
                    ? 'bg-green-500'
                    : 'bg-gray-300'
              }`}
            />
            <span className="text-xs mt-1 text-gray-600">{formatStatus(step)}</span>
          </div>
          {index < displayStatuses.length - 1 && (
            <div
              className={`h-0.5 w-8 mt-1.5 ${
                normalizedStatus === 'CANCELLED'
                  ? 'bg-red-500'
                  : index < currentIndex
                    ? 'bg-green-500'
                    : 'bg-gray-300'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const VerticalStatusTimeline = ({ statusHistory }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Status History</h3>
      <div className="space-y-6">
        {statusHistory.map((item, index) => (
          <div key={index} className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className={`h-4 w-4 rounded-full ${
                normalizeStatus(item.status) === 'CANCELLED' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              {index < statusHistory.length - 1 && <div className="h-full w-0.5 bg-gray-300 mt-1" />}
            </div>
            <div>
              <StatusBadge status={item.status} />
              <p className="text-sm text-gray-600 mt-1">{item.note}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
    <p className="mt-4 text-gray-600 text-lg">Loading ration cards...</p>
  </div>
);

const RequestedCards = () => {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const userEmail = useSelector((state) => state.auth.user?.email);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const fetchCards = async () => {
      if (!userEmail) {
        toast.error('User email not found');
        return;
      }
      try {
        const response = await api.get('/ration-card/user-requested-cards/', {
          params: { user_email: userEmail }
        });
        setCards(response.data);
        setFilteredCards(response.data);
      } catch (error) {
        toast.error('Failed to fetch ration cards');
      }finally {
        setIsLoading(false);
      }
    };
    fetchCards();
  }, [userEmail]);

  useEffect(() => {
    const filtered = cards.filter((card) => {
      const normalizedCardStatus = normalizeStatus(card.status);
      const matchesSearch = 
        (normalizedCardStatus === 'ADMIN_APPROVED' ? card.card_number.toLowerCase().includes(searchTerm.toLowerCase()) : true) || 
        card.head_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'REQUESTED' && normalizedCardStatus === 'REQUESTED') ||
        normalizedCardStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredCards(filtered);
  }, [searchTerm, statusFilter, cards]);

  const displayStatuses = ['ALL', ...statusOrder, 'CANCELLED'];

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <NavBar handleLogout={handleLogout} />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Ration Card Dashboard</h1>
            
            {!isLoading && (
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-center space-x-2">
                  {displayStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        statusFilter === status
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      } shadow-sm`}
                    >
                      {status === 'ALL' ? 'All' : formatStatus(status)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{card.head_name}</h2>
                    <StatusBadge status={card.status} />
                  </div>
                  <p className="text-gray-600 mb-2">
                    Card Number: {normalizeStatus(card.status) === 'ADMIN_APPROVED' 
                      ? card.card_number 
                      : 'N/A'}
                  </p>
                  <p className="text-gray-600 mb-4 truncate">{card.household_address}</p>
                  <StatusTimeline status={card.status} />
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedCard(card)}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition duration-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}

          {selectedCard && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedCard.head_name}'s Ration Card</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <p className="text-gray-600 mb-2">
                    Card Number: {normalizeStatus(selectedCard.status) === 'ADMIN_APPROVED' 
                      ? selectedCard.card_number 
                      : 'N/A'}
                  </p>
                  <div>
                    <p className="font-semibold text-gray-600">Card Type:</p>
                    <p className="text-gray-800">{selectedCard.card_type?.name || 'Not Assigned'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-600">Registered Shop:</p>
                    <p className="text-gray-800">{selectedCard.registered_shop.name} - {selectedCard.registered_shop.location}</p>
                  </div>
                </div>

                <VerticalStatusTimeline statusHistory={[
                { status: 'REQUESTED', timestamp: selectedCard.created_at, note: 'Application Submitted' },
                ...(selectedCard.shop_verification_notes ? [{ 
                  status: 'SHOP_VERIFIED', 
                  timestamp: selectedCard.shop_verified_at || selectedCard.created_at, 
                  note: selectedCard.shop_verification_notes 
                }] : []),
                ...(selectedCard.admin_verification_notes ? [{ 
                  status: 'ADMIN_APPROVED', 
                  timestamp: selectedCard.admin_approved_at || selectedCard.created_at, 
                  note: selectedCard.admin_verification_notes 
                }] : []),
                ...(selectedCard.status === 'CANCELLED' ? [{ 
                  status: 'CANCELLED', 
                  timestamp: selectedCard.cancelled_at || selectedCard.created_at, 
                  note: selectedCard.cancellation_notes || 'Application Cancelled' 
                }] : [])
              ]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestedCards;