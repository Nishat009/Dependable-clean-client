import React from 'react';
import { Carousel } from 'react-bootstrap';
const HeaderMainSlider = () => {
    return (
      <div>
        
        <Carousel>
  <Carousel.Item>
    
    <img
      className="d-block w-100"
      src="https://images.unsplash.com/photo-1484154218962-a197022b5858?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=753&q=80"
      alt="First slide"
    />
    <Carousel.Caption className="justify-content-center">
    <p>Get Your Service Done According To Your Choice</p>
    </Carousel.Caption>
  </Carousel.Item>
  <Carousel.Item>
    <img
      className="d-block w-100"
      src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=667&q=80"
      alt="Second slide"
    />

    <Carousel.Caption className="justify-content-between">
     <p >Get Your Service Done According To Your Choice</p>
    </Carousel.Caption>
  </Carousel.Item>
  <Carousel.Item>
    <img
      className="d-block w-100"
      src="https://images.unsplash.com/photo-1583947582712-e880d61c71d0?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80"
      alt="Third slide"
    />

    <Carousel.Caption>
    <p>Get Your Service Done According To Your Choice</p>
    </Carousel.Caption>
  </Carousel.Item>
</Carousel>
      </div>

 
  
    );
};

export default HeaderMainSlider;