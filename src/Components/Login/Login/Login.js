import React, { useContext } from 'react';
import firebase from "firebase/app";
import "firebase/auth";
import firebaseConfig from './firebase.config';
import { UserContext } from '../../../App';
import { useHistory, useLocation } from 'react-router';
import LoginBg from '../../../images/login.svg';
import logo from '../../../images/logo.jpg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faGoogle} from '@fortawesome/free-brands-svg-icons'


const Login = () => {
    const [loggedInUser, setLoggedInUser] = useContext(UserContext);
    const history = useHistory();
    const location = useLocation();
    const { from } = location.state || { from: { pathname: "/" } };
  
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }
  
    const handleGoogleSignIn = () => {
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).then(function (result) {
        const { displayName, email, photoURL } = result.user;
        const signedInUser = { name: displayName, email, photoURL }
        setLoggedInUser(signedInUser);
        storeAuthToken();
      }).catch(function (error) {
        const errorMessage = error.message;
        console.log(errorMessage);
      });
    }
  
    const storeAuthToken = () => {
      firebase.auth().currentUser.getIdToken(/* forceRefresh */ true)
        .then(function (idToken) {
          sessionStorage.setItem('token', idToken);
          history.replace(from);
        }).catch(function (error) {
          // Handle error
        });
    }
    return (
        <div className="login-page container">
      <div className="row align-items-center" style={{ height: "100vh" }}>
      <div className="col-md-7 d-none d-md-block align-self-end">
          <img className="img-fluid" style={{height:"300px", width:"350px"}} src={LoginBg} alt="" />
        </div>
        <div className="col-md-5 p-5">
          <div>
              <img className="text-center" style={{height:"120px", marginLeft:"120px", width:"120px"}} src={logo} alt=""/>
          </div>
          <div className=" mt-3 text-center">
            <button  className="btn-style w-100 border rounded" style={{backgroundImage: "linear-gradient(90deg, #86ebe7, #3A4256)"}} onClick={handleGoogleSignIn} ><FontAwesomeIcon icon={faGoogle} ></FontAwesomeIcon> Google Sign in</button>
          </div>
        </div>
       
      </div>
    </div>
    );
};

export default Login;