import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setServices } from '../../../../store';
import ServicesDetails from '../ServicesDetails/ServicesDetails';

const Services = () => {
    const dispatch = useDispatch();
    const services = useSelector((state) => state.services.items);
    useEffect( () => {
        fetch('http://localhost:5000/services')
        .then(res => res.json())
        .then(data => dispatch(setServices(data)))
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

