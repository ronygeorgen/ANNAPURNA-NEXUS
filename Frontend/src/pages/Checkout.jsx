import React from "react";
import Checkout from "../components/User/Checkout/Checkout";
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';

function CheckoutPage() {
    
    const stripePromise = loadStripe('pk_test_51QSVjhHcWmv43Z0e2blssSLnjGfouvrkWs3sWk7tzfZpQXpfOnw0ujTc1R3lw2RQEHVKXDzEwgFHA9QnQTIsalUv00fynYE5JQ');
    return(
        <div>
            <Elements stripe={stripePromise}>
                <Checkout stripePromise={stripePromise}/>
            </Elements>
        </div>
    )
}

export default CheckoutPage;