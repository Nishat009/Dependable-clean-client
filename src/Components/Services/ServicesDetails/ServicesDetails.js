import React from 'react';
import { useHistory } from 'react-router';
import './ServicesDetails.css'

const ServicesDetails = ({service}) => {
    const history=useHistory()
    const handleChoose=(_id)=>{
        history.push(`/book/${_id}`)
    }

  
    return (
      
        <div className="container mt-2 mb-5 col-md-4">
        <div class="card card-design" style={{ width: "20rem", height:"24rem", boxShadow:'5px 5px 5px 5px' }}>
            <div style= {{backgroundColor:'#3A4256', color:'white'}} class=" card-body fw-bolder">
            {
            service.image ? <img style={{height: '200px', width: '17rem'}} src={`data:image/png;base64,${service.image.img}`}alt=""/>
            :
            <img style={{height: '200px', width: '17rem'}} className="img-fluid mb-3 content" src={`https://young-wildwood-60700.herokuapp.com/${service.img}`} alt=""/>
        }
                <h3 class="card-title ">{service.serviceName}</h3>
                <small > {service.details}</small>
                
            </div>
            <div className="card-footer d-flex justify-content-between">
            <h3>${service.price}</h3>
                <button onClick={()=>handleChoose(service._id)} style={{backgroundImage: "linear-gradient(90deg, #86ebe7, #3A4256)"}} className="btn">Choose Now</button>
            </div>
        </div>
        </div>
       
      
    );
};

export default ServicesDetails;