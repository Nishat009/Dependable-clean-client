import React, { useEffect, useState } from "react";


const Review=()=> {
    const [reviews, setReviews] = useState([])
    useEffect( () => {
        fetch('http://localhost:5000/reviews')
        .then(res => res.json())
        .then(data => setReviews(data))
    }, [])
    
    
    return (
        
        
       
        <div className="container h-100 mt-5">
        {
            reviews.map(review =>
                <div className=" text-center mt-4 mb-4">
                    
                    <h1 className=" text">{review.name}</h1>
                    <p className=" text">{review.comments}</p>
                    
                </div>
            )
        }
    </div>
      
    );
}

export default Review;
