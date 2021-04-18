import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../images/logo.jpg';
import './Navbar.css'
const Navbar = () => {
    return (
        <nav className="navbar navbar-expand-lg navbar-light">

            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <Link style={{color: 'white'}} class="navbar-brand fw-bolder " to="/home"><img class="logo" src={logo} alt=""/>Dependable Clean</Link>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto">
                    <li className="nav-item active">
                        <Link className="nav-link ms-5" to="/">Home</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link ms-5" to="/login">Login</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link ms-5" to="/dashboard">Dashboard</Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link ms-5" to="/login">Admin</Link>
                    </li>
                    
                   
                    
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;