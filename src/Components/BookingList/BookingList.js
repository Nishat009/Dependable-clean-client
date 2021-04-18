import React, {useContext, useEffect, useState } from 'react';
import { UserContext } from '../../App';
import Sidebar from '../Dashboard/Sidebar/Sidebar';
import Navbar from '../Shared/Navbar/Navbar';


const BookingList = () => {
    const [orders, setOrders] = useState([])
    const [loggedInUser, setLoggedInUser] = useContext(UserContext)

    useEffect(() => {
        fetch('https://young-wildwood-60700.herokuapp.com/bookingList?email=' + loggedInUser.email)
            .then(res => res.json())
            .then(data => setOrders(data))
    }, [loggedInUser.email])
    return (
        <div className="fluid-container">
            <Navbar></Navbar>
            <div className="row mx-0">
                <div className='col-md-2 p-0'>
                    <Sidebar></Sidebar>
                </div>
                <div className="col-md-10 p-4 mx-auto">
                    <h3 className="m-5">Thank You, {loggedInUser.email} You have booked total {orders.length} services.</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th scope="col">Service</th>
                                <th scope="col">Price</th>
                              
                                <th scope="col">Status</th>

                            </tr>
                        </thead>
                        {
                            orders.map(order =>
                                <tbody>
                                    <tr>
                                        <td style={{ width: "20%" }}>{order.serviceName}</td>
                                        <td style={{ width: "20%" }}>${order.price}</td>
                                        
                     <td style={{ width: "20%" }}>{order.status}</td>
                                    </tr>
                                </tbody>

                            )
                        }

                    </table>

                </div>
            </div>
        </div>

    );
};


export default BookingList;