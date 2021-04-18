import React from 'react';
import './ContactUs.css';
const ContactUs = () => {
    return (
        <section className="contact my-5 py-5">
           <div className="container">
               <div className="section-header text-center text-white mb-5">
                    <h5 style={{color:"#1CC7C1"}}>Contact Us</h5>
                    <h1>Always  connect with us</h1>
               </div>
               <div className="col-md-9 mx-auto">
                   <form action="">
                       <div className="form-group mb-3">
                           <input type="text" className="form-control" placeholder="Email Address *"/>
                       </div>
                       <div className="form-group mb-3">
                           <input type="text" className="form-control" placeholder="Subject *"/>
                       </div>
                       <div className="form-group mb-3">
                           <textarea name="" className="form-control" id="" cols="30" rows="10" placeholder="Message *"></textarea>
                       </div>
                       <div className="form-group text-center mt-5">
                           <button style={{backgroundImage: "linear-gradient(90deg, #86ebe7, #1CC7C1)"}}class="btn text-white"> Submit </button>
                       </div>
                   </form>
               </div>
           </div>
       </section>
    );
};

export default ContactUs;