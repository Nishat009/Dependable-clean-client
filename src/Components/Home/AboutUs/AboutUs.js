import React from 'react';
import about from '../../../images/about.jpg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook } from '@fortawesome/free-solid-svg-icons'

const AboutUs = () => {
    return (
        
            <section style={{height:'700px'}} className="row pt-5 mt-5 ">
    <div className="col-md-6 ">
        <img src={about} alt=""/>
    </div>
    <div className="col-md-4 mb-5">
    <h1 style={{color:'#3A4256'}}>Started Your Journey <br/>By Knowing Us</h1>
        <p className="text-secondary">Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero temporibus aperiam, voluptatum hic dolores earum!</p>
        <button style={{backgroundImage: "linear-gradient(90deg, #86ebe7, #3A4256)"}}class="btn text-white">About Us</button>
    </div>
</section>
        
    );
};

export default AboutUs;