import React from 'react';
import Services from '../../Services/Services/Services';
import Footer from '../../Shared/Footer/Footer';
import AboutUs from '../AboutUs/AboutUs';
import ContactUs from '../ContactUs/ContactUs';
import Header from '../Header/Header';
import ReviewDetails from '../ReviewDetails/ReviewDetails'

const Home = () => {
    return (
        <div>
            <Header></Header>
            <AboutUs></AboutUs>
            <Services></Services>
            <ReviewDetails></ReviewDetails>
            <ContactUs></ContactUs>
            <Footer></Footer>
            
        </div>
    );
};

export default Home;