import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../../services/api';
import { CheckCircleIcon } from 'lucide-react';

export default function StripeSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState({ orderId: '', amountPaid: '' });
    const [hasProcessed, setHasProcessed] = useState(false);

    useEffect(() => {
        const saveStripeOrder = async () => {
            // Check if order has already been processed to prevent multiple calls
            if (hasProcessed) return;

            try {
                // Extract Stripe session ID from URL
                const sessionId = new URLSearchParams(location.search).get('session_id');
                
                if (!sessionId) {
                    toast.error('No session ID found');
                    navigate('/home');
                    return;
                }
                // Call backend to verify and save the Stripe order
                const response = await api.post('/order-management/save-stripe-order/', { 
                    session_id: sessionId
                });
                const { order_id, amount_paid } = response.data;

                setOrderDetails({ orderId: order_id, amountPaid: amount_paid });

                // Clear cart 
                localStorage.removeItem('cartItems');
                localStorage.removeItem('normalItems');
                localStorage.removeItem('additionalItems');

                toast.success('Order placed successfully!');
                
                // Mark order as processed
                setHasProcessed(true);
            } catch (error) {
                console.error('Stripe order save failed:', error.response?.data);
                toast.error('Failed to save order');
                navigate('/home');
            }
        };

        // Only attempt to save order if not already processed
        if (!hasProcessed) {
            saveStripeOrder();
        }
    }, [location, navigate, hasProcessed]); 

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
                <div className="flex items-center justify-center">
                    <CheckCircleIcon className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-center text-gray-800">Payment Successful!</h1>
                <p className="text-center text-gray-600">
                    Thank you for your purchase. Your order has been processed successfully.
                </p>
                <div className="border-t border-b border-gray-200 py-4">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">OrderID:</span>
                        <span className="text-gray-600">{orderDetails.orderId}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold text-gray-700">Amount Paid:</span>
                        <span className="text-gray-600">₹{orderDetails.amountPaid}</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                    A confirmation email has been sent to your registered email address.
                </p>
                <div className="flex justify-center">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                        onClick={() => window.location.href = '/'}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        </div>
    );
}