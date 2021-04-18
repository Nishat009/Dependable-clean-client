import React from 'react';
import Review from '../Review/Review';
import './ReviewDetails.css'

const ReviewDetails = () => {
    return (
       <div>
            <h1 className="text-center font-family mb-5" style={{ fontWeight: '600' }}>Rev<span style={{ color: '#7AB259' }}>iew</span></h1>
        <div className="review-container" style={{ paddingTop: '3%' }}>
            
            <p className=" border-bottom"></p>
            <div>
                <Review></Review>
            </div>
        </div>
       </div>
    );
};

export default ReviewDetails;