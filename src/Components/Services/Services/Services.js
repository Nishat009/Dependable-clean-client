import React, { useEffect, useState } from 'react';
import ServicesDetails from '../ServicesDetails/ServicesDetails';

import './Services.css';
const Services = () => {
    const [services, setServices] = useState([])
    useEffect( () => {
        fetch('https://young-wildwood-60700.herokuapp.com/services')
        .then(res => res.json())
        .then(data => setServices(data))
    }, [])
    return (
        <section className="services my-5">
             <div className="container">
               <div className="section-header text-center">
                    
                    <h1>From Our Service Details</h1>
               </div>
        <div className="row mx-2">
            {
                services.map(service =><ServicesDetails service={service} key ={service._id} ></ServicesDetails>)
            }
        </div>
        </div>
    </section>
    );
};

export default Services;