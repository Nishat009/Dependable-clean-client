import React from 'react';
import { Elements} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import SimpleCardForm from './SimpleCardForm';
// import SplitCardForm from './SplitCardForm';


const stripePromise = loadStripe('pk_test_51IeaICKR4Mb8yRNBMIgEzOYDkmpRxNc0OgIffxVOnvRGUkwHF8osllqU58WL5zaPxrN3GkayCTvVtBEi4lkdtcSx00LnRkzWlu');
const ProcessPayment = ({handlePaymentSuccess}) => {
    return (
        <Elements stripe={stripePromise}>
            <SimpleCardForm handlePaymentSuccess={handlePaymentSuccess}></SimpleCardForm>
        {/* <SplitCardForm></SplitCardForm> */}
        </Elements>
    );
};

export default ProcessPayment;