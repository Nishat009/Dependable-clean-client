import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faGooglePlusG } from '@fortawesome/free-brands-svg-icons';
import './Footer.css';
import FooterCol from '../FooterCol/FooterCol';

const Footer = () => {
        
        const ourAddress = [
            {name: "New York - 101010 Hudson" , link: "//google.com/map"},
            {name: "Yards" , link: "//google.com/map"},
           
        ]
        
        const services = [
            {name: "09:00 - 17:00 Mon - Thu" , link: "/home"},
            {name: "09:00 - 17:00 Fri - Sat" , link: "/home"},
            {name: "closed" , link: "/home"},
        ]
        const social = [
           
        ]
    return (
        <footer className="footer-area clear-both">
            <div className="container pt-5">
                <div className="row py-5 text">
                    <FooterCol key={1} menuTitle={"Contact Info"} menuItems={ourAddress}/>
                    <FooterCol key={2} menuTitle="Opening Hours" menuItems={services}/>
                    <FooterCol key={3} menuTitle=" " menuItems={social}>
                        <ul className="social-media">
                            <li className="list-inline-item"><a href="//facebook.com"><FontAwesomeIcon className="icon active-icon" icon={faFacebookF} /></a></li>
                            <li className="list-inline-item"><a href="//google.com"><FontAwesomeIcon className="icon" icon={faGooglePlusG} /></a></li>
                            <li className="list-inline-item"><a href="//instagram.com"><FontAwesomeIcon className="icon" icon={faInstagram} /></a></li>
                        </ul>
                        <div className="mt-5">
                            <h6 className="ms-2" style={{color:'white'}}>Call now</h6>
                            <button style={{backgroundImage: "linear-gradient(90deg, #86ebe7, #1CC7C1)"}}class="btn text-white">+2025550295</button>
                        </div>
                    </FooterCol>
                </div>
                <div className="copyRight text-center" style={{color:'white'}}>
                    <p>Copyright All Rights Reserved</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;