import React, { useEffect, useState } from "react";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";


const Review=()=> {
    const [reviews, setReviews] = useState([])
    useEffect( () => {
        fetch('http://localhost:5000/reviews')
        .then(res => res.json())
        .then(data => setReviews(data))
    }, [])
    
    
        const settings = {
          dots: true,
          infinite: true,
          speed: 1000,
          slidesToShow: 1,
          slidesToScroll: 1, 
          autoplay:true
        };
    return (
        
        
       
        <Slider {...settings} className="container h-100 mt-5">
        {
            reviews.map(review =>
                <div className=" text-center mt-4 mb-4">
                    
                    <h1 className=" text">{review.name}</h1>
                    <p className=" text">{review.comments}</p>
                    
                </div>
            )
        }
    </Slider>
      
    );
}

export default Review;