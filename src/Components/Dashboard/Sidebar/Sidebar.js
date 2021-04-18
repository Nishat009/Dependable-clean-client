import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSignOutAlt, faCalendar, faGripHorizontal, faUsers, faBook, faList } from '@fortawesome/free-solid-svg-icons';
import {  faFileAlt } from '@fortawesome/free-regular-svg-icons'
import { UserContext } from '../../../App';

const Sidebar = () => {

    const [loggedInUser, setLoggedInUSer] = useContext(UserContext)
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:5000/isAdmin`, {
            method: "POST",
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: loggedInUser.email })

        })
            .then(res => res.json())
            .then(data => setIsAdmin(data));
    }, [])
    return (
        <div className="sidebar d-flex flex-column justify-content-between col-md-12 py-5 px-4" style={{height:"100vh"}}>
            <ul className="list-unstyled">
               {!isAdmin &&
                   <div>
                      
                 <li>
                    <Link to="/addReview" className="text-white">
                        <FontAwesomeIcon icon={faFileAlt} /> <span>Review</span>
                    </Link>
                </li>
                 <li>
                    <Link to="/book" className="text-white">
                        <FontAwesomeIcon icon={faBook} /> <span>Book Service</span> 
                    </Link>
                </li>
                <li>
                        <Link to="/bookList" className="text-white">
                            <FontAwesomeIcon icon={faList} /> <span>Book List</span>
                        </Link>
                    </li>
                   </div>
                   
               }
               
                
               
              {isAdmin &&
                    <div>
                         <li>
                    <Link to="/orderList" className="text-white">
                        <FontAwesomeIcon icon={faCalendar} /> <span>Order List</span> 
                    </Link>
                </li>
                    <li>
                        <Link to="/addService" className="text-white">
                            <FontAwesomeIcon icon={faFileAlt} /> <span>Add Services</span>
                        </Link>
                    </li>
                    
                    <li>
                        <Link to="/addManage" className="text-white">
                            <FontAwesomeIcon icon={faFileAlt} /> <span>Manage Service</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/addAdmin" className="text-white" >
                          <FontAwesomeIcon icon={faUsers} /> <span>Add Admin</span>
                        </Link>
                    </li>
                    </div>
              }
            </ul>
            
        </div>
    );
};

export default Sidebar;